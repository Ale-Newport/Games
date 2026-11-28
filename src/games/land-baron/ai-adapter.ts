/**
 * The AI environment: one game per episode, 2–5 seats (config `{ players, limit }`; 2 players and a
 * 60-round timed game by default, so evaluations end). Actions are fixed integers: roll, bail,
 * pardon, buy, decline, pass, three bid raises (and an opening bid of 1), accept, refuse, end, then
 * build / sell / mortgage / redeem per space, and offers to buy a rival's space for 1, 1.5 or 2
 * times its price (the table also allows any swap of properties and cash). Everything in the game
 * is public except the dice generator and the card order, which observations leave out.
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
import { SIZE } from './board';
import {
  act,
  currentPlayer,
  isLegal,
  isValidBaron,
  legalActions,
  MAX_OFFERS,
  newBaron,
  offerOk,
  price,
  worth,
  type Action,
  type Baron,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface Config {
  players?: number;
  limit?: number;
}

const FIXED = [
  'roll',
  'bail',
  'pardon',
  'buy',
  'decline',
  'pass',
  'bid10',
  'bid50',
  'bid100',
  'bid1',
  'accept',
  'refuse',
  'end',
] as const;
const KS = [1, 1.5, 2];
export const CODE = {
  build: FIXED.length,
  sell: FIXED.length + SIZE,
  mortgage: FIXED.length + SIZE * 2,
  redeem: FIXED.length + SIZE * 3,
  offer: FIXED.length + SIZE * 4,
  size: FIXED.length + SIZE * 7,
} as const;

const askPrice = (s: number, k: number) => Math.round(price(s) * KS[k]!);

export function decode(g: Baron, n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n < FIXED.length) {
    const f = FIXED[n]!;
    const ph = g.phase;
    switch (f) {
      case 'bid10':
      case 'bid50':
      case 'bid100':
        return ph.k === 'auction' ? { t: 'bid', n: ph.bid + Number(f.slice(3)) } : null;
      case 'bid1':
        return { t: 'bid', n: 1 };
      case 'accept':
        return { t: 'answer', accept: true };
      case 'refuse':
        return { t: 'answer', accept: false };
      default:
        return { t: f };
    }
  }
  if (n < CODE.sell) return { t: 'build', at: n - CODE.build };
  if (n < CODE.mortgage) return { t: 'sell', at: n - CODE.sell };
  if (n < CODE.redeem) return { t: 'mortgage', at: n - CODE.mortgage };
  if (n < CODE.offer) return { t: 'redeem', at: n - CODE.redeem };
  const k = n - CODE.offer;
  const s = Math.floor(k / 3);
  const o = g.owner[s];
  if (o === null || o === undefined) return null;
  return { t: 'offer', to: o, give: [], get: [s], cash: askPrice(s, k % 3) };
}

export function encode(g: Baron, a: Action): number {
  switch (a.t) {
    case 'bid': {
      const ph = g.phase;
      if (ph.k !== 'auction') return -1;
      if (a.n === 1 && ph.bid === 0) return FIXED.indexOf('bid1');
      const step = a.n - ph.bid;
      return FIXED.indexOf(step <= 10 ? 'bid10' : step <= 50 ? 'bid50' : 'bid100');
    }
    case 'answer':
      return FIXED.indexOf(a.accept ? 'accept' : 'refuse');
    case 'build':
      return CODE.build + a.at;
    case 'sell':
      return CODE.sell + a.at;
    case 'mortgage':
      return CODE.mortgage + a.at;
    case 'redeem':
      return CODE.redeem + a.at;
    case 'offer': {
      const s = a.get[0];
      if (a.give.length || a.get.length !== 1 || s === undefined) return -1;
      const k = KS.findIndex((_, i) => askPrice(s, i) === a.cash);
      return k < 0 ? -1 : CODE.offer + s * 3 + k;
    }
    default:
      return FIXED.indexOf(a.t);
  }
}

export function legalCodes(g: Baron): number[] {
  const out = new Set(
    legalActions(g)
      .map((a) => encode(g, a))
      .filter((c) => c >= 0),
  );
  if (g.phase.k === 'main' && g.offers < MAX_OFFERS) {
    const p = g.turn;
    for (let s = 0; s < SIZE; s++) {
      const o = g.owner[s];
      if (o === null || o === undefined || o === p) continue;
      KS.forEach((_, k) => {
        if (offerOk(g, o, [], [s], askPrice(s, k))) out.add(CODE.offer + s * 3 + k);
      });
    }
  }
  return [...out].sort((a, b) => a - b);
}

export type Observation = Omit<Baron, 'rng' | 'luck' | 'council'> & { seat: number };
export function observe(g: Baron, seat: number): Observation {
  const { rng: _r, luck: _l, council: _c, ...rest } = g;
  void _r;
  void _l;
  void _c;
  return { ...rest, seat };
}

export function outcome(g: Baron): Outcome | null {
  if (g.phase.k !== 'over' || g.winner === null) return null;
  return {
    returns: g.out.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: g.out.map((_, p) => worth(g, p)),
    reason: g.out.filter((o) => !o).length === 1 ? 'last-standing' : 'richest',
  };
}

export const env: GameEnvironment<Baron, number, Observation, Config> = {
  id: 'land-baron',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 5,
    // Dice and cards come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newBaron(
      [2, 3, 4, 5].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2,
      seed >>> 0,
      c?.limit ?? 60,
    ),
  reset: (seed) => newBaron(2, seed >>> 0, 60),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: legalCodes,
  applyAction: (g, n) => {
    const a = decode(g, n);
    if (!a || !legalCodes(g).includes(n) || !isLegal(g, a))
      throw new IllegalActionError(`Illegal action ${String(n)}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase.k === 'over' ? NO_PLAYER : currentPlayer(g)),
  isTerminal: (g) => g.phase.k === 'over',
  getOutcome: outcome,
  getReward: (g, seat) => outcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isValidBaron(parsed)) throw new Error('Invalid Land Baron state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => `#${n}`,
};

function wrap(agent: Agent<Baron, Action>): Agent<Baron, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) => {
      const a = agent.selectAction(
        e as unknown as GameEnvironment<Baron, Action>,
        g,
        p,
        ctx,
      ) as Action;
      const code = encode(g, a);
      return code >= 0 ? code : encode(g, legalActions(g).at(-1)!);
    },
  };
}

export const AGENT_PRESETS: AgentPreset<Baron, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Baron, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Baron, Action>) },
);

export const bundle: AiBundle<Baron, number> = {
  env: env as unknown as AiBundle<Baron, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
