/**
 * The AI environment: one game per episode, 2–4 seats (config `{ players }`, 2 by default).
 * Actions are fixed integers (see `CODE`). Observations show the whole board and every farm, but
 * not the generator or the order of the round spaces still to come (only how many there are).
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
  isValidFarm,
  legalActions,
  newFarm,
  type Action,
  type Farm,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { CELLS, IMPROVEMENTS, SPACES } from './world';

export interface Config {
  players?: number;
}

/** Most grain baked at once that the encoding allows. */
export const MAX_BAKE = 40;
export const CODE = {
  done: 0,
  place: 1,
  room: 1 + SPACES.length,
  stable: 1 + SPACES.length + CELLS,
  plough: 1 + SPACES.length + 2 * CELLS,
  pasture: 1 + SPACES.length + 3 * CELLS,
  sowGrain: 1 + SPACES.length + 4 * CELLS,
  sowVeg: 1 + SPACES.length + 5 * CELLS,
  improve: 1 + SPACES.length + 6 * CELLS,
  bake: 1 + SPACES.length + 6 * CELLS + IMPROVEMENTS.length,
  size: 1 + SPACES.length + 6 * CELLS + IMPROVEMENTS.length + MAX_BAKE,
};

export function encode(a: Action): number {
  switch (a.t) {
    case 'done':
      return CODE.done;
    case 'place':
      return CODE.place + a.space;
    case 'room':
      return CODE.room + a.cell;
    case 'stable':
      return CODE.stable + a.cell;
    case 'plough':
      return CODE.plough + a.cell;
    case 'pasture':
      return CODE.pasture + a.cell;
    case 'sow':
      return (a.crop === 'grain' ? CODE.sowGrain : CODE.sowVeg) + a.cell;
    case 'improve':
      return CODE.improve + a.imp;
    case 'bake':
      return CODE.bake + Math.min(a.n, MAX_BAKE) - 1;
  }
}
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n === CODE.done) return { t: 'done' };
  if (n < CODE.room) return { t: 'place', space: n - CODE.place };
  if (n < CODE.stable) return { t: 'room', cell: n - CODE.room };
  if (n < CODE.plough) return { t: 'stable', cell: n - CODE.stable };
  if (n < CODE.pasture) return { t: 'plough', cell: n - CODE.plough };
  if (n < CODE.sowGrain) return { t: 'pasture', cell: n - CODE.pasture };
  if (n < CODE.sowVeg) return { t: 'sow', cell: n - CODE.sowGrain, crop: 'grain' };
  if (n < CODE.improve) return { t: 'sow', cell: n - CODE.sowVeg, crop: 'veg' };
  if (n < CODE.bake) return { t: 'improve', imp: n - CODE.improve };
  return { t: 'bake', n: n - CODE.bake + 1 };
}

export type Observation = Omit<Farm, 'rng' | 'future'> & { seat: number; roundsToCome: number };
export function observe(g: Farm, seat: number): Observation {
  const { rng: _r, future, ...rest } = g;
  void _r;
  return { ...rest, seat, roundsToCome: future.length };
}

export function outcome(g: Farm): Outcome | null {
  if (g.phase !== 'over') return null;
  const n = g.winners.length;
  return {
    returns: g.ps.map((_, p) => (g.winners.includes(p) ? 1 / n : 0)),
    winners: n > 1 ? [] : g.winners,
    draw: n > 1,
    scores: (g.scores ?? []).map((s) => s.total),
    reason: 'rounds-out',
  };
}

export const env: GameEnvironment<Farm, number, Observation, Config> = {
  id: 'farmstead',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // The order of the round spaces comes from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newFarm([2, 3, 4].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newFarm(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g) =>
    legalActions(g)
      .filter((a) => a.t !== 'bake' || a.n <= MAX_BAKE)
      .map(encode),
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
    if (!isValidFarm(parsed)) throw new Error('Invalid Farmstead state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Farm, Action>): Agent<Farm, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Farm, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Farm, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Farm, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Farm, Action>) },
);

export const bundle: AiBundle<Farm, number> = {
  env: env as unknown as AiBundle<Farm, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
