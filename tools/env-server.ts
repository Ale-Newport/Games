/**
 * JSON-lines environment server: exposes registered game environments over stdin/stdout so that
 * offline trainers (training/arcade_ai/env.py) use the exact TypeScript rules engines.
 *
 * Request:  {"id": 1, "cmd": "make", "game": "tic-tac-toe", "seed": 7, "config": {...}}
 * Response: {"id": 1, "ok": true, "result": {...}}  or  {"id": 1, "ok": false, "error": "..."}
 *
 * Commands: info, list, make, reset, observe, legal, step, terminal, outcome, serialize,
 *           restore, close.
 */
import { createInterface } from 'node:readline';
import { AI_BUNDLES, loadAiBundle, type AnyBundle } from '../src/ai/adapters/registry';

interface Handle {
  bundle: AnyBundle;
  state: unknown;
}

const handles = new Map<number, Handle>();
let nextHandle = 0;

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

function get(handle: unknown): Handle {
  const h = handles.get(Number(handle));
  if (!h) throw new Error(`Unknown handle ${String(handle)}`);
  return h;
}

async function handle(msg: Record<string, unknown>): Promise<unknown> {
  switch (msg.cmd) {
    case 'list':
      return Object.keys(AI_BUNDLES);
    case 'info': {
      const { env, agents } = await loadAiBundle(String(msg.game));
      return {
        id: env.id,
        version: env.version,
        rulesetId: env.rulesetId,
        info: env.info,
        agents: agents.map((a) => a.id),
      };
    }
    case 'make': {
      const bundle = await loadAiBundle(String(msg.game));
      const id = nextHandle++;
      const h = { bundle, state: bundle.env.createInitialState(msg.config, Number(msg.seed ?? 0)) };
      handles.set(id, h);
      return { handle: id, ...snapshot(h) };
    }
    case 'reset': {
      const h = get(msg.handle);
      h.state = h.bundle.env.createInitialState(msg.config, Number(msg.seed ?? 0));
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
    default:
      throw new Error(`Unknown command ${String(msg.cmd)}`);
  }
}

const rl = createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let id: unknown = null;
  try {
    const msg = JSON.parse(line) as Record<string, unknown>;
    id = msg.id ?? null;
    const result = await handle(msg);
    process.stdout.write(`${JSON.stringify({ id, ok: true, result })}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({ id, ok: false, error: error instanceof Error ? error.message : String(error) })}\n`,
    );
  }
});
