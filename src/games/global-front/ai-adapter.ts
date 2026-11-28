/**
 * The AI environment: one game per episode, two seats — seat 0 plays the Northern Pact (Varn and
 * Ossia), seat 1 the Southern Accord (Kelt and Tamar). Actions are fixed integers: buy and unbuy
 * per unit kind, move one unit (kind, from, to), sail (coast, water, coast, one of six loads),
 * roll, retreat, place (kind, place), next. Observations show the whole board (it is public) but
 * not the dice generator.
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
  citiesOf,
  currentPlayer,
  isLegal,
  isValidFront,
  legalActions,
  newFront,
  type Action,
  type Front,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { KINDS, LOCS, type UnitKind } from './world';

const N = LOCS.length;
const K = KINDS.length;
export const LOADS: UnitKind[][] = [
  ['infantry'],
  ['artillery'],
  ['armor'],
  ['infantry', 'infantry'],
  ['infantry', 'artillery'],
  ['infantry', 'armor'],
];
export const CODE = {
  buy: 0,
  unbuy: K,
  move: 2 * K,
  sail: 2 * K + K * N * N,
  roll: 2 * K + K * N * N + N * N * N * LOADS.length,
  retreat: 2 * K + K * N * N + N * N * N * LOADS.length + 1,
  place: 2 * K + K * N * N + N * N * N * LOADS.length + 2,
  next: 2 * K + K * N * N + N * N * N * LOADS.length + 2 + K * N,
  size: 2 * K + K * N * N + N * N * N * LOADS.length + 3 + K * N,
} as const;

export function encode(a: Action): number {
  switch (a.t) {
    case 'buy':
      return CODE.buy + KINDS.indexOf(a.kind);
    case 'unbuy':
      return CODE.unbuy + KINDS.indexOf(a.kind);
    case 'move':
      return CODE.move + (KINDS.indexOf(a.kind) * N + a.from) * N + a.to;
    case 'sail': {
      const l = LOADS.findIndex((x) => x.join() === a.kinds.join());
      return l < 0 ? -1 : CODE.sail + ((a.from * N + a.sea) * N + a.to) * LOADS.length + l;
    }
    case 'roll':
      return CODE.roll;
    case 'retreat':
      return CODE.retreat;
    case 'place':
      return CODE.place + KINDS.indexOf(a.kind) * N + a.loc;
    case 'next':
      return CODE.next;
  }
}
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n < CODE.unbuy) return { t: 'buy', kind: KINDS[n]! };
  if (n < CODE.move) return { t: 'unbuy', kind: KINDS[n - CODE.unbuy]! };
  if (n < CODE.sail) {
    const k = n - CODE.move;
    return {
      t: 'move',
      kind: KINDS[Math.floor(k / (N * N))]!,
      from: Math.floor(k / N) % N,
      to: k % N,
      n: 1,
    };
  }
  if (n < CODE.roll) {
    const k = n - CODE.sail;
    const l = k % LOADS.length;
    const r = Math.floor(k / LOADS.length);
    return {
      t: 'sail',
      from: Math.floor(r / (N * N)),
      sea: Math.floor(r / N) % N,
      to: r % N,
      kinds: LOADS[l]!,
    };
  }
  if (n === CODE.roll) return { t: 'roll' };
  if (n === CODE.retreat) return { t: 'retreat' };
  if (n < CODE.next) {
    const k = n - CODE.place;
    return { t: 'place', kind: KINDS[Math.floor(k / N)]!, loc: k % N };
  }
  return { t: 'next' };
}

export type Observation = Omit<Front, 'rng'> & { seat: number };
export function observe(g: Front, seat: number): Observation {
  const { rng: _r, ...rest } = g;
  void _r;
  return { ...rest, seat };
}

export function outcome(g: Front): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: [0, 1].map((s) => (s === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: [citiesOf(g, 0), citiesOf(g, 1)],
    reason: 'cities',
  };
}

export const env: GameEnvironment<Front, number, Observation, Record<string, never>> = {
  id: 'global-front',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    // The dice come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
  },
  createInitialState: (_c, seed) => newFront(seed >>> 0),
  reset: (seed) => newFront(seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g) =>
    legalActions(g)
      .map(encode)
      .filter((c) => c >= 0),
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
    if (!isValidFront(parsed)) throw new Error('Invalid Global Front state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Front, Action>): Agent<Front, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Front, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Front, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Front, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Front, Action>) },
);

export const bundle: AiBundle<Front, number> = {
  env: env as unknown as AiBundle<Front, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
