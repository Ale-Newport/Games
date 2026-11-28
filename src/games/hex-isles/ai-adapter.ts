/**
 * The AI environment: one game per episode, 3 or 4 seats (config `{ players }`, 3 by default — the evaluator seats
 * the minimum).
 * Actions are fixed integers (see `encode` / `decode`); domestic trades are one card for one in
 * this encoding (the table also allows bundles). Observations show the board, every building, the
 * seat's own hand and charts, and only the counts of the others' cards and charts.
 */
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS as RAW_PRESETS } from './ai';
import {
  act,
  currentPlayer,
  isLegal,
  isValidIsles,
  legalActions,
  MAX_OFFERS,
  newIsles,
  none,
  offerOk,
  points,
  type Action,
  type Cards,
  type IsleGame,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface Config {
  players?: number;
}

/* ---------- action encoding ---------- */

const PAIRS: [number, number][] = [];
for (let r = 0; r < 5; r++) for (let r2 = r; r2 < 5; r2++) PAIRS.push([r, r2]);
const BANK: [number, number][] = [];
for (let r = 0; r < 5; r++) for (let r2 = 0; r2 < 5; r2++) if (r !== r2) BANK.push([r, r2]);

export const A = {
  hut: 0, // + corner (54)
  path: 54, // + edge (72)
  town: 126, // + corner (54)
  roll: 180,
  buy: 181,
  captain: 182,
  roadworks: 183,
  end: 184,
  bounty: 185, // + pair (15)
  embargo: 200, // + resource (5)
  storm: 205, // + hex (19)
  steal: 224, // + seat (4)
  discard: 228, // + resource (5)
  bank: 233, // + give/get pair (20)
  offer: 253, // + seat·20 + give/get pair (80)
  accept: 333,
  decline: 334,
  size: 335,
} as const;

const unit = (r: number): Cards => {
  const c = none();
  c[r] = 1;
  return c;
};
const single = (c: Cards) => {
  const i = c.findIndex((x) => x > 0);
  return c.reduce((a, x) => a + x, 0) === 1 ? i : -1;
};

export function encode(a: Action): number {
  switch (a.t) {
    case 'hut':
      return A.hut + a.v;
    case 'path':
      return A.path + a.e;
    case 'town':
      return A.town + a.v;
    case 'roll':
      return A.roll;
    case 'buy':
      return A.buy;
    case 'captain':
      return A.captain;
    case 'roadworks':
      return A.roadworks;
    case 'end':
      return A.end;
    case 'bounty':
      return A.bounty + PAIRS.findIndex(([r, r2]) => r === a.r && r2 === a.r2);
    case 'embargo':
      return A.embargo + a.r;
    case 'storm':
      return A.storm + a.h;
    case 'steal':
      return A.steal + a.p;
    case 'discard':
      return single(a.cards) < 0 ? -1 : A.discard + single(a.cards);
    case 'bank':
      return A.bank + BANK.findIndex(([r, r2]) => r === a.give && r2 === a.get);
    case 'offer': {
      const g = single(a.give);
      const w = single(a.get);
      if (g < 0 || w < 0) return -1;
      return A.offer + a.to * 20 + BANK.findIndex(([r, r2]) => r === g && r2 === w);
    }
    case 'answer':
      return a.accept ? A.accept : A.decline;
  }
}

export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= A.size) return null;
  if (n < A.path) return { t: 'hut', v: n };
  if (n < A.town) return { t: 'path', e: n - A.path };
  if (n < A.roll) return { t: 'town', v: n - A.town };
  if (n === A.roll) return { t: 'roll' };
  if (n === A.buy) return { t: 'buy' };
  if (n === A.captain) return { t: 'captain' };
  if (n === A.roadworks) return { t: 'roadworks' };
  if (n === A.end) return { t: 'end' };
  if (n < A.embargo) {
    const [r, r2] = PAIRS[n - A.bounty]!;
    return { t: 'bounty', r, r2 };
  }
  if (n < A.storm) return { t: 'embargo', r: n - A.embargo };
  if (n < A.steal) return { t: 'storm', h: n - A.storm };
  if (n < A.discard) return { t: 'steal', p: n - A.steal };
  if (n < A.bank) return { t: 'discard', cards: unit(n - A.discard) };
  if (n < A.offer) {
    const [give, get] = BANK[n - A.bank]!;
    return { t: 'bank', give, get };
  }
  if (n < A.accept) {
    const k = n - A.offer;
    const [give, get] = BANK[k % 20]!;
    return { t: 'offer', to: Math.floor(k / 20), give: unit(give), get: unit(get) };
  }
  return { t: 'answer', accept: n === A.accept };
}

/** Legal actions as integers: the listed moves plus every one-for-one offer allowed. */
export function legalCodes(g: IsleGame): number[] {
  const out = legalActions(g).map(encode);
  if (g.phase.k === 'main' && g.offers < MAX_OFFERS)
    for (let to = 0; to < g.players; to++)
      BANK.forEach(([give, get], k) => {
        if (offerOk(g, to, unit(give), unit(get))) out.push(A.offer + to * 20 + k);
      });
  return out.sort((a, b) => a - b);
}

/* ---------- observation ---------- */

export interface Observation {
  seat: number;
  players: number;
  board: IsleGame['board'];
  storm: number;
  sites: IsleGame['sites'];
  paths: IsleGame['paths'];
  bank: Cards;
  deck: number;
  turn: number;
  round: number;
  phase: IsleGame['phase'];
  dice: IsleGame['dice'];
  played: boolean;
  offers: number;
  trail: number | null;
  fleet: number | null;
  hand: Cards;
  charts: IsleGame['hands'][number]['charts'];
  fresh: IsleGame['hands'][number]['fresh'];
  /** Everyone's public figures: card and chart counts, captains played, visible points. */
  table: { cards: number; charts: number; captains: number; points: number }[];
}

export function observe(g: IsleGame, seat: number): Observation {
  const me = g.hands[seat]!;
  return {
    seat,
    players: g.players,
    board: g.board,
    storm: g.storm,
    sites: g.sites,
    paths: g.paths,
    bank: g.bank,
    deck: g.deck.length,
    turn: g.turn,
    round: g.round,
    phase: g.phase,
    dice: g.dice,
    played: g.played,
    offers: g.offers,
    trail: g.trail,
    fleet: g.fleet,
    hand: me.hand,
    charts: me.charts,
    fresh: me.fresh,
    table: g.hands.map((h, p) => ({
      cards: h.hand.reduce((a, x) => a + x, 0),
      charts: h.charts.length + h.fresh.length,
      captains: h.captains,
      points: points(g, p, p === seat),
    })),
  };
}

/* ---------- environment ---------- */

export function outcome(g: IsleGame): Outcome | null {
  if (g.phase.k !== 'over' || g.winner === null) return null;
  return {
    returns: g.hands.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: g.hands.map((_, p) => points(g, p)),
    reason: 'ten-points',
  };
}

export const env: GameEnvironment<IsleGame, number, Observation, Config> = {
  id: 'hex-isles',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 3,
    maxPlayers: 4,
    // Dice, steals and the chart deck come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) => newIsles(c?.players === 4 ? 4 : 3, seed >>> 0),
  reset: (seed) => newIsles(3, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: legalCodes,
  applyAction: (g, n) => {
    const a = decode(n);
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
    if (!isValidIsles(parsed)) throw new Error('Invalid Hex Isles state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

/** The table's agents (object actions) wrapped for the integer environment. */
function wrap(agent: Agent<IsleGame, Action>): Agent<IsleGame, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<IsleGame, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<IsleGame, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<IsleGame, number>)
    : { ...a, create: () => wrap(a.create() as Agent<IsleGame, Action>) },
);

export const bundle: AiBundle<IsleGame, number> = {
  env: env as unknown as AiBundle<IsleGame, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
