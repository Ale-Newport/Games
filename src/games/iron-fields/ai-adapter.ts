/**
 * The AI environment: one game per episode, 2–4 seats (config `{ players }`, 2 by default).
 * Actions are fixed integers (see `CODE`). Observations show the whole land, every unit and every
 * board, but not the generator, the order of the encounter deck (only its size) or an attacker's
 * bid while the defender is choosing (the defender sees `null`).
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
  isValidIron,
  legalActions,
  newIron,
  type Action,
  type Iron,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { BOTTOMS, MAX_BID, POS, RECRUITS, RES, STRUCTURES, TOPS, type Res } from './world';

export interface Config {
  players?: number;
}

const S = POS.length;
/** Units are numbered as created; 64 is more than a game can make (4 × (1 + 8 + 4)). */
export const MAX_UNITS = 64;
const TRADE = ['pop', ...RES] as const;
export const CODE = {
  done: 0,
  coin: 1,
  section: 2,
  bid: 2 + TOPS.length,
  option: 2 + TOPS.length + MAX_BID + 1,
  trade: 2 + TOPS.length + MAX_BID + 1 + 3,
  produce: 2 + TOPS.length + MAX_BID + 1 + 3 + TRADE.length * TRADE.length,
  upgrade: 2 + TOPS.length + MAX_BID + 1 + 3 + TRADE.length * TRADE.length + S,
  deploy:
    2 +
    TOPS.length +
    MAX_BID +
    1 +
    3 +
    TRADE.length * TRADE.length +
    S +
    TOPS.length * BOTTOMS.length,
  enlist:
    2 +
    TOPS.length +
    MAX_BID +
    1 +
    3 +
    TRADE.length * TRADE.length +
    2 * S +
    TOPS.length * BOTTOMS.length,
  build:
    2 +
    TOPS.length +
    MAX_BID +
    1 +
    3 +
    TRADE.length * TRADE.length +
    2 * S +
    TOPS.length * BOTTOMS.length +
    RECRUITS.length,
  move: 0,
  size: 0,
};
CODE.move = CODE.build + S * STRUCTURES.length;
CODE.size = CODE.move + MAX_UNITS * S;

export function encode(a: Action): number {
  switch (a.t) {
    case 'done':
      return CODE.done;
    case 'coin':
      return CODE.coin;
    case 'section':
      return CODE.section + a.i;
    case 'bid':
      return CODE.bid + a.n;
    case 'option':
      return CODE.option + a.k;
    case 'trade':
      return CODE.trade + TRADE.indexOf(a.a) * TRADE.length + TRADE.indexOf(a.b);
    case 'produce':
      return CODE.produce + a.hex;
    case 'upgrade':
      return CODE.upgrade + TOPS.indexOf(a.top) * BOTTOMS.length + BOTTOMS.indexOf(a.bottom);
    case 'deploy':
      return CODE.deploy + a.hex;
    case 'enlist':
      return CODE.enlist + RECRUITS.indexOf(a.recruit);
    case 'build':
      return CODE.build + a.hex * STRUCTURES.length + STRUCTURES.indexOf(a.kind);
    case 'move':
      return CODE.move + a.unit * S + a.to;
  }
}
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n === CODE.done) return { t: 'done' };
  if (n === CODE.coin) return { t: 'coin' };
  if (n < CODE.bid) return { t: 'section', i: n - CODE.section };
  if (n < CODE.option) return { t: 'bid', n: n - CODE.bid };
  if (n < CODE.trade) return { t: 'option', k: n - CODE.option };
  if (n < CODE.produce) {
    const v = n - CODE.trade;
    return {
      t: 'trade',
      a: TRADE[Math.floor(v / TRADE.length)]! as Res | 'pop',
      b: TRADE[v % TRADE.length]! as Res | 'pop',
    };
  }
  if (n < CODE.upgrade) return { t: 'produce', hex: n - CODE.produce };
  if (n < CODE.deploy) {
    const v = n - CODE.upgrade;
    return {
      t: 'upgrade',
      top: TOPS[Math.floor(v / BOTTOMS.length)]!,
      bottom: BOTTOMS[v % BOTTOMS.length]!,
    };
  }
  if (n < CODE.enlist) return { t: 'deploy', hex: n - CODE.deploy };
  if (n < CODE.build) return { t: 'enlist', recruit: RECRUITS[n - CODE.enlist]! };
  if (n < CODE.move) {
    const v = n - CODE.build;
    return {
      t: 'build',
      hex: Math.floor(v / STRUCTURES.length),
      kind: STRUCTURES[v % STRUCTURES.length]!,
    };
  }
  const v = n - CODE.move;
  return { t: 'move', unit: Math.floor(v / S), to: v % S };
}

export type Observation = Omit<Iron, 'rng' | 'deck'> & { seat: number; deckSize: number };
export function observe(g: Iron, seat: number): Observation {
  const { rng: _r, deck, ...rest } = g;
  void _r;
  const o: Observation = { ...structuredClone(rest), seat, deckSize: deck.length };
  if (o.battle && o.battle.attacker !== seat) o.battle.attackBid = null;
  return o;
}

export function outcome(g: Iron): Outcome | null {
  if (g.phase !== 'over') return null;
  const n = g.winners.length;
  return {
    returns: g.ps.map((_, p) => (g.winners.includes(p) ? 1 / n : 0)),
    winners: n > 1 ? [] : g.winners,
    draw: n > 1,
    scores: (g.scores ?? []).map((s) => s.total),
    reason: g.ps.some((x) => x.stars.length >= 5) ? 'stars' : 'turns-out',
  };
}

export const env: GameEnvironment<Iron, number, Observation, Config> = {
  id: 'iron-fields',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // Encounters and the land come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newIron([2, 3, 4].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newIron(2, seed >>> 0),
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
    if (!isValidIron(parsed)) throw new Error('Invalid Iron Fields state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Iron, Action>): Agent<Iron, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Iron, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Iron, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Iron, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Iron, Action>) },
);

export const bundle: AiBundle<Iron, number> = {
  env: env as unknown as AiBundle<Iron, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
