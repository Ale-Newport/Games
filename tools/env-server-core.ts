/**
 * Command handling for the JSON-lines environment server (tools/env-server.ts). Kept separate from
 * the stdin/stdout entry point so tests can drive it directly and inject fixture environments.
 *
 * Two layers share one handle table:
 *
 * - Raw commands (`make`, `reset`, `observe`, `legal`, `step`, ...) expose the GameEnvironment
 *   contract one transition at a time. Chance nodes and every seat are the caller's job.
 * - Gym commands (`gym_make`, `gym_reset`, `gym_step`) back training/arcade_ai/gym.py. A gym handle
 *   controls one seat (or every seat for self-play) through the game's fixed action encoding.
 *   Chance nodes are sampled here with a seeded RNG and the other seats are played by the game's
 *   own agent presets (its AiBundle), so each gym step returns at the controlled seat's next turn.
 *
 * `batch` runs several commands in one round trip (vectorized environments).
 */
import { sampleChanceAction } from '../src/ai/agents/mcts-agent';
import type { Agent } from '../src/ai/agents/types';
import { AI_BUNDLES, loadAiBundle, type AnyBundle } from '../src/ai/adapters/registry';
import { CHANCE_PLAYER, IllegalActionError } from '../src/ai/protocols/types';
import { Rng } from '../src/core/game-engine/random';

export type Message = Record<string, unknown>;

export interface EnvServerOptions {
  /** Defaults to the registry loader (`loadAiBundle`). */
  loadBundle?: (game: string) => Promise<AnyBundle>;
  /** Defaults to the registered game ids. */
  listGames?: () => string[];
}

type ObservationMode = 'tensor' | 'raw';

interface GymState {
  /** Controlled seat, or null for self-play (every non-chance seat is controlled). */
  seat: number | null;
  /** Agent preset id for every seat that is not controlled. */
  opponent: string;
  /** Per-seat preset overrides, keyed by seat index. */
  opponents: Record<string, string>;
  observation: ObservationMode;
  config: unknown;
  timeLimitMs?: number;
  /** Opponent agents, created per episode (search agents may keep tables). */
  agents: Map<number, Agent<unknown, unknown>>;
  /** Decision RNG for opponent agents and chance RNG, both reseeded by every reset. */
  rng: Rng;
  chanceRng: Rng;
  /** Seat that made the latest non-chance move (self-play observer at terminal states). */
  lastMover: number | null;
}

interface Handle {
  game: string;
  bundle: AnyBundle;
  state: unknown;
  gym?: GymState;
}

interface AutoMove {
  player: number;
  /** Encoded index for seat moves; null for chance events. */
  encoded: number | null;
  action: unknown;
}

/** Guard against environments that never return control (e.g. agent-vs-agent loops). */
const MAX_AUTO_MOVES = 100_000;

/** Same derivation as playMatch (src/ai/evaluation/match.ts), so seeds mean the same thing. */
function chanceSeed(seed: number): number {
  return seed ^ 0x5bd1e995;
}

function errorInfo(error: unknown): { error: string; type: string } {
  return error instanceof Error
    ? { error: error.message, type: error.name }
    : { error: String(error), type: 'Error' };
}

function asSeed(value: unknown): number {
  const seed = Number(value ?? 0);
  if (!Number.isFinite(seed)) throw new Error(`Invalid seed ${String(value)}`);
  return seed;
}

export function createEnvServer(options: EnvServerOptions = {}) {
  const loadBundle = options.loadBundle ?? loadAiBundle;
  const listGames = options.listGames ?? (() => Object.keys(AI_BUNDLES));
  const handles = new Map<number, Handle>();
  let nextHandle = 0;

  function get(handle: unknown): Handle {
    const h = handles.get(Number(handle));
    if (!h) throw new Error(`Unknown handle ${String(handle)}`);
    return h;
  }

  function gymOf(h: Handle): GymState {
    if (!h.gym) throw new Error(`Handle for ${h.game} was not created with gym_make`);
    return h.gym;
  }

  function snapshot(h: Handle) {
    const { env } = h.bundle;
    const terminal = env.isTerminal(h.state);
    return {
      player: env.getCurrentPlayer(h.state),
      terminal,
      legal: terminal ? [] : env.getLegalActions(h.state),
      outcome: terminal ? env.getOutcome(h.state) : null,
    };
  }

  function describe(id: string, bundle: AnyBundle) {
    const { env, agents } = bundle;
    return {
      id,
      kind: env.info.kind,
      minPlayers: env.info.minPlayers,
      maxPlayers: env.info.maxPlayers,
      stochastic: env.info.stochastic,
      hiddenInformation: env.info.hiddenInformation,
      zeroSum: env.info.zeroSum,
      actionSpaceSize: env.info.actionSpaceSize ?? null,
      observationShape: env.info.observationShape ?? null,
      encode: Boolean(env.encodeAction && env.decodeAction),
      tensor: Boolean(env.getObservationTensor),
      chanceOutcomes: Boolean(env.getChanceOutcomes),
      agents: agents.map((a) => a.id),
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Gym layer

  function controls(g: GymState, player: number): boolean {
    return g.seat === null ? player >= 0 : player === g.seat;
  }

  function observerOf(h: Handle, g: GymState): number {
    if (g.seat !== null) return g.seat;
    const player = h.bundle.env.getCurrentPlayer(h.state);
    return player >= 0 ? player : (g.lastMover ?? 0);
  }

  function opponentFor(h: Handle, g: GymState, seat: number): Agent<unknown, unknown> {
    let agent = g.agents.get(seat);
    if (!agent) {
      const id = g.opponents[String(seat)] ?? g.opponent;
      const preset = h.bundle.agents.find((p) => p.id === id);
      if (!preset) throw new Error(`Unknown agent preset "${id}" for ${h.game}`);
      agent = preset.create() as Agent<unknown, unknown>;
      g.agents.set(seat, agent);
    }
    return agent;
  }

  function encodedLegal(h: Handle): number[] {
    const env = h.bundle.env;
    const size = env.info.actionSpaceSize ?? Infinity;
    return env.getLegalActions(h.state).map((action: unknown) => {
      const index = env.encodeAction!(action);
      if (!Number.isInteger(index) || index < 0 || index >= size)
        throw new Error(`${h.game}: encodeAction returned ${index} outside [0, ${size})`);
      return index;
    });
  }

  function gymView(h: Handle) {
    const env = h.bundle.env;
    const g = gymOf(h);
    const terminal = env.isTerminal(h.state);
    const observer = observerOf(h, g);
    let observation: unknown;
    let shape: readonly number[] | null = null;
    if (g.observation === 'tensor') {
      const tensor = env.getObservationTensor!(h.state, observer);
      observation = tensor.data;
      shape = tensor.shape;
    } else {
      observation = env.getObservation(h.state, observer);
    }
    return {
      player: env.getCurrentPlayer(h.state),
      terminal,
      outcome: terminal ? env.getOutcome(h.state) : null,
      observer,
      legal: terminal ? [] : encodedLegal(h),
      observation,
      shape,
    };
  }

  /** Applies one action and adds every seat's reward in the resulting state to `rewards`. */
  function transition(h: Handle, player: number, action: unknown, rewards: number[]): void {
    const env = h.bundle.env;
    h.state = env.applyAction(h.state, action);
    rewards.forEach((_, seat) => (rewards[seat]! += env.getReward(h.state, seat)));
    if (player >= 0) gymOf(h).lastMover = player;
  }

  /** Samples chance events and plays opponent seats until a controlled seat must act. */
  function advance(h: Handle, rewards: number[]): AutoMove[] {
    const env = h.bundle.env;
    const g = gymOf(h);
    const moves: AutoMove[] = [];
    while (!env.isTerminal(h.state)) {
      if (moves.length >= MAX_AUTO_MOVES)
        throw new Error(`${h.game}: no controlled turn within ${MAX_AUTO_MOVES} automatic moves`);
      const player = env.getCurrentPlayer(h.state);
      if (controls(g, player)) break;
      let action: unknown;
      if (player === CHANCE_PLAYER) {
        action = sampleChanceAction(env, h.state, g.chanceRng);
        moves.push({ player, encoded: null, action });
      } else if (player >= 0) {
        action = opponentFor(h, g, player).selectAction(env, h.state, player, {
          rng: g.rng,
          timeLimitMs: g.timeLimitMs,
        });
        moves.push({ player, encoded: env.encodeAction!(action), action });
      } else {
        throw new Error(`${h.game}: non-terminal state with no player to act (${player})`);
      }
      transition(h, player, action, rewards);
    }
    return moves;
  }

  function zeroRewards(h: Handle): number[] {
    return new Array<number>(h.bundle.env.info.maxPlayers).fill(0);
  }

  function parseSeat(value: unknown, bundle: AnyBundle): number | null {
    if (value === null) return null;
    const seat = Number(value);
    if (!Number.isInteger(seat) || seat < 0 || seat >= bundle.env.info.maxPlayers)
      throw new Error(`Seat ${String(value)} is outside 0..${bundle.env.info.maxPlayers - 1}`);
    return seat;
  }

  function checkPreset(bundle: AnyBundle, game: string, id: string): string {
    if (!bundle.agents.some((p) => p.id === id))
      throw new Error(
        `Unknown agent preset "${id}" for ${game}. Available: ${bundle.agents.map((p) => p.id).join(', ')}`,
      );
    return id;
  }

  function gymReset(h: Handle, msg: Message) {
    const g = gymOf(h);
    const seed = asSeed(msg.seed);
    if (msg.seat !== undefined) g.seat = parseSeat(msg.seat, h.bundle);
    if (msg.config !== undefined && msg.config !== null) g.config = msg.config;
    h.state = h.bundle.env.createInitialState(g.config ?? undefined, seed);
    g.rng = new Rng(seed);
    g.chanceRng = new Rng(chanceSeed(seed));
    g.agents.clear();
    g.lastMover = null;
    const rewards = zeroRewards(h);
    const auto = advance(h, rewards);
    return { rewards, auto, ...gymView(h) };
  }

  function gymStep(h: Handle, msg: Message) {
    const env = h.bundle.env;
    if (env.isTerminal(h.state)) throw new Error('Episode is over; call gym_reset');
    const player = env.getCurrentPlayer(h.state);
    if (!controls(gymOf(h), player))
      throw new Error(`It is not a controlled seat's turn (current player ${player})`);
    const encoded = Number(msg.action);
    if (!Number.isInteger(encoded) || !encodedLegal(h).includes(encoded))
      throw new IllegalActionError(`Action ${String(msg.action)} is not legal in this state`);
    const rewards = zeroRewards(h);
    transition(h, player, env.decodeAction!(encoded, h.state), rewards);
    const auto = advance(h, rewards);
    return { mover: player, rewards, auto, ...gymView(h) };
  }

  async function gymMake(msg: Message) {
    const game = String(msg.game);
    const bundle = await loadBundle(game);
    const { env } = bundle;
    if (!env.encodeAction || !env.decodeAction || !env.info.actionSpaceSize)
      throw new Error(
        `${game} has no fixed discrete action encoding (encodeAction/decodeAction/actionSpaceSize)`,
      );
    const requested = String(msg.observation ?? 'auto');
    if (!['auto', 'tensor', 'raw'].includes(requested))
      throw new Error(`Unknown observation mode "${requested}" (auto, tensor or raw)`);
    if (requested === 'tensor' && !env.getObservationTensor)
      throw new Error(`${game} has no observation tensor; use observation "raw"`);
    const observation: ObservationMode =
      requested === 'raw' || !env.getObservationTensor ? 'raw' : 'tensor';
    const opponents: Record<string, string> = {};
    for (const [seat, id] of Object.entries((msg.opponents as Record<string, unknown>) ?? {})) {
      parseSeat(seat, bundle);
      opponents[seat] = checkPreset(bundle, game, String(id));
    }
    const opponent = checkPreset(bundle, game, String(msg.opponent ?? 'random'));
    const seed = asSeed(msg.seed);
    const config = msg.config ?? undefined;
    const g: GymState = {
      seat: parseSeat(msg.seat === undefined ? 0 : msg.seat, bundle),
      opponent,
      opponents,
      observation,
      config,
      timeLimitMs: msg.timeLimitMs === undefined ? undefined : Number(msg.timeLimitMs),
      agents: new Map(),
      rng: new Rng(seed),
      chanceRng: new Rng(chanceSeed(seed)),
      lastMover: null,
    };
    const id = nextHandle++;
    const h: Handle = { game, bundle, state: env.createInitialState(config, seed), gym: g };
    handles.set(id, h);
    const shape =
      observation === 'tensor'
        ? env.getObservationTensor!(h.state, g.seat ?? 0).shape
        : (env.info.observationShape ?? null);
    return {
      handle: id,
      ...describe(game, bundle),
      version: env.version,
      rulesetId: env.rulesetId,
      observation,
      // Shape of this handle's tensors (a config may change the board size).
      observationShape: shape,
    };
  }

  // ---------------------------------------------------------------------------------------------

  async function handle(msg: Message): Promise<unknown> {
    switch (msg.cmd) {
      case 'list':
        return listGames();
      case 'catalog': {
        const ids = Array.isArray(msg.games) ? msg.games.map(String) : listGames();
        const rows = [];
        for (const id of ids) {
          try {
            rows.push(describe(id, await loadBundle(id)));
          } catch (error) {
            rows.push({ id, error: errorInfo(error).error });
          }
        }
        return rows;
      }
      case 'info': {
        const { env, agents } = await loadBundle(String(msg.game));
        return {
          id: env.id,
          version: env.version,
          rulesetId: env.rulesetId,
          info: env.info,
          agents: agents.map((a) => a.id),
        };
      }
      case 'make': {
        const game = String(msg.game);
        const bundle = await loadBundle(game);
        const id = nextHandle++;
        const h: Handle = {
          game,
          bundle,
          state: bundle.env.createInitialState(msg.config, asSeed(msg.seed)),
        };
        handles.set(id, h);
        return { handle: id, ...snapshot(h) };
      }
      case 'reset': {
        const h = get(msg.handle);
        h.state = h.bundle.env.createInitialState(msg.config, asSeed(msg.seed));
        return snapshot(h);
      }
      case 'observe': {
        const h = get(msg.handle);
        const player = Number(msg.player ?? h.bundle.env.getCurrentPlayer(h.state));
        const env = h.bundle.env;
        return {
          observation: env.getObservation(h.state, player),
          tensor: env.getObservationTensor?.(h.state, player) ?? null,
        };
      }
      case 'legal': {
        const h = get(msg.handle);
        const env = h.bundle.env;
        const legal = env.getLegalActions(h.state);
        return {
          legal,
          encoded: env.encodeAction ? legal.map((a: unknown) => env.encodeAction!(a)) : null,
        };
      }
      case 'step': {
        const h = get(msg.handle);
        const env = h.bundle.env;
        const action =
          msg.encoded !== undefined && env.decodeAction
            ? env.decodeAction(Number(msg.encoded), h.state)
            : msg.action;
        const mover = env.getCurrentPlayer(h.state);
        h.state = env.applyAction(h.state, action);
        const rewards = Array.from({ length: env.info.maxPlayers }, (_, p) =>
          env.getReward(h.state, p),
        );
        return { mover, rewards, ...snapshot(h) };
      }
      case 'serialize':
        return get(msg.handle).bundle.env.serializeState(get(msg.handle).state);
      case 'restore': {
        const h = get(msg.handle);
        h.state = h.bundle.env.deserializeState(String(msg.data));
        return snapshot(h);
      }
      case 'close':
        handles.delete(Number(msg.handle));
        return null;
      case 'gym_make':
        return gymMake(msg);
      case 'gym_reset':
        return gymReset(get(msg.handle), msg);
      case 'gym_step':
        return gymStep(get(msg.handle), msg);
      case 'gym_observe': {
        const h = get(msg.handle);
        return {
          ...gymView(h),
          raw: h.bundle.env.getObservation(h.state, observerOf(h, gymOf(h))),
        };
      }
      case 'batch': {
        if (!Array.isArray(msg.requests)) throw new Error('batch needs a "requests" array');
        const results = [];
        for (const request of msg.requests as Message[]) {
          if (request.cmd === 'batch') throw new Error('Nested batch requests are not allowed');
          try {
            results.push({ ok: true, result: await handle(request) });
          } catch (error) {
            results.push({ ok: false, ...errorInfo(error) });
          }
        }
        return results;
      }
      default:
        throw new Error(`Unknown command ${String(msg.cmd)}`);
    }
  }

  /** Handles one request line and returns the response line (without the trailing newline). */
  async function respond(line: string): Promise<string> {
    let id: unknown = null;
    try {
      const msg = JSON.parse(line) as Message;
      id = msg.id ?? null;
      const result = await handle(msg);
      return JSON.stringify({ id, ok: true, result });
    } catch (error) {
      return JSON.stringify({ id, ok: false, ...errorInfo(error) });
    }
  }

  return { handle, respond, handleCount: () => handles.size };
}
