/**
 * The AI environment: one game per episode, 2–4 seats (config `{ players, target }`, 2 players
 * to 10 points by default). Actions are fixed integers (see `CODE`). Observations show the whole
 * board except the generator and the order of the objective and agenda decks (only their sizes).
 */
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { RAW_PRESETS } from './ai';
import {
  act,
  currentPlayer,
  isLegal,
  isValidStar,
  legalActions,
  newStar,
  type Action,
  type Star,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { CARDS, KINDS, OBJECTIVES, PLANETS, POS, type Kind } from './world';

export interface Config {
  players?: number;
  target?: number;
}

const S = POS.length;
const K = KINDS.length;
const PL = PLANETS.length;
/** Most of one kind moved at once (fleet limits and capacities keep counts small). */
export const MAX_N = 16;
export const CODE = {
  done: 0,
  roll: 1,
  retreat: 2,
  decline: 3,
  pass: 4,
  skip: 5,
  abstain: 6,
  pick: 7,
  activate: 7 + CARDS.length,
  build: 7 + CARDS.length + S,
  unbuild: 7 + CARDS.length + S + K,
  // play: card × (x + 1), x from −1 to PL − 1 (planets, techs and objectives all fit).
  play: 7 + CARDS.length + S + 2 * K,
  follow: 7 + CARDS.length + S + 2 * K + CARDS.length * (PL + 1),
  score: 7 + CARDS.length + S + 2 * K + CARDS.length * (PL + 1) + (PL + 1),
  vote: 7 + CARDS.length + S + 2 * K + CARDS.length * (PL + 1) + (PL + 1) + OBJECTIVES.length,
  land: 7 + CARDS.length + S + 2 * K + CARDS.length * (PL + 1) + (PL + 1) + OBJECTIVES.length + 4,
  move:
    7 +
    CARDS.length +
    S +
    2 * K +
    CARDS.length * (PL + 1) +
    (PL + 1) +
    OBJECTIVES.length +
    4 +
    PL * MAX_N,
  size: 0,
};
CODE.size = CODE.move + S * K * MAX_N;
const SIMPLE = ['done', 'roll', 'retreat', 'decline', 'pass', 'skip', 'abstain'] as const;

export function encode(a: Action): number {
  switch (a.t) {
    case 'done':
    case 'roll':
    case 'retreat':
    case 'decline':
    case 'pass':
    case 'skip':
    case 'abstain':
      return CODE[a.t];
    case 'pick':
      return CODE.pick + a.card;
    case 'activate':
      return CODE.activate + a.sys;
    case 'build':
      return CODE.build + KINDS.indexOf(a.kind);
    case 'unbuild':
      return CODE.unbuild + KINDS.indexOf(a.kind);
    case 'play':
      return CODE.play + a.card * (PL + 1) + a.x + 1;
    case 'follow':
      return CODE.follow + a.x + 1;
    case 'score':
      return CODE.score + a.obj;
    case 'vote':
      return CODE.vote + a.option;
    case 'land':
      return CODE.land + a.planet * MAX_N + (a.n - 1);
    case 'move':
      return CODE.move + (a.from * K + KINDS.indexOf(a.kind)) * MAX_N + (a.n - 1);
  }
}
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n < CODE.pick) return { t: SIMPLE[n]! };
  if (n < CODE.activate) return { t: 'pick', card: n - CODE.pick };
  if (n < CODE.build) return { t: 'activate', sys: n - CODE.activate };
  if (n < CODE.unbuild) return { t: 'build', kind: KINDS[n - CODE.build] as Kind };
  if (n < CODE.play) return { t: 'unbuild', kind: KINDS[n - CODE.unbuild] as Kind };
  if (n < CODE.follow) {
    const v = n - CODE.play;
    return { t: 'play', card: Math.floor(v / (PL + 1)), x: (v % (PL + 1)) - 1 };
  }
  if (n < CODE.score) return { t: 'follow', x: n - CODE.follow - 1 };
  if (n < CODE.vote) return { t: 'score', obj: n - CODE.score };
  if (n < CODE.land) return { t: 'vote', option: n - CODE.vote };
  if (n < CODE.move) {
    const v = n - CODE.land;
    return { t: 'land', planet: Math.floor(v / MAX_N), n: (v % MAX_N) + 1 };
  }
  const v = n - CODE.move;
  const fk = Math.floor(v / MAX_N);
  return {
    t: 'move',
    from: Math.floor(fk / K),
    kind: KINDS[fk % K] as Kind,
    n: (v % MAX_N) + 1,
  };
}

export type Observation = Omit<Star, 'rng' | 'deck1' | 'deck2' | 'agendas'> & {
  seat: number;
  decks: [number, number, number];
};
export function observe(g: Star, seat: number): Observation {
  const { rng: _r, deck1, deck2, agendas, ...rest } = g;
  void _r;
  return { ...rest, seat, decks: [deck1.length, deck2.length, agendas.length] };
}

export function outcome(g: Star): Outcome | null {
  if (g.phase !== 'over') return null;
  const n = g.winners.length;
  return {
    returns: g.ps.map((_, p) => (g.winners.includes(p) ? 1 / n : 0)),
    winners: n > 1 ? [] : g.winners,
    draw: n > 1,
    scores: g.ps.map((x) => x.vp),
    reason: g.ps.some((x) => x.vp >= g.target) ? 'target' : 'rounds-out',
  };
}

const PLAYERS = [2, 3, 4];
export const env: GameEnvironment<Star, number, Observation, Config> = {
  id: 'star-council',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // Dice and decks come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newStar(
      PLAYERS.includes(c?.players ?? 2) ? (c?.players ?? 2) : 2,
      seed >>> 0,
      c?.target === 7 ? 7 : 10,
    ),
  reset: (seed) => newStar(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g) => legalActions(g).map(encode),
  applyAction: (g, n) => {
    const a = decode(n);
    if (!a || !isLegal(g, a)) throw new IllegalActionError(`Illegal action ${String(n)}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : currentPlayer(g)),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: outcome,
  getReward: (g, seat) => outcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isValidStar(parsed)) throw new Error('Invalid Star Council state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Star, Action>): Agent<Star, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Star, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Star, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Star, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Star, Action>) },
);

export const bundle: AiBundle<Star, number> = {
  env: env as unknown as AiBundle<Star, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
