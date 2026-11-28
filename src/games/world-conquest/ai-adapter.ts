/**
 * The AI environment: one game per episode, 2–5 seats (config `{ players }`, 2 by default — the
 * evaluator seats the minimum). Actions are fixed integers: placements, card sets by hand position,
 * attacks per directed border and dice, advances and fortifications as fifths of the allowed range
 * (the table allows any number). Observations show the whole board and the seat's own cards; the
 * others' cards are only counted.
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
  isLegal,
  isSet,
  isValidWar,
  N,
  newWar,
  owned,
  type Action,
  type WarGame,
} from './engine';
import { MAP } from './map';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface Config {
  players?: number;
}

/** Every border in both directions. */
export const DIR: [number, number][] = MAP.territories.flatMap((t, i) =>
  t.adj.map((j) => [i, j] as [number, number]),
);
const dirIndex = new Map(DIR.map(([a, b], k) => [a * 100 + b, k]));
const COMBOS: [number, number, number][] = [];
for (let i = 0; i < 10; i++)
  for (let j = i + 1; j < 10; j++) for (let k = j + 1; k < 10; k++) COMBOS.push([i, j, k]);

export const CODE = {
  place: 0,
  trade: N,
  attack: N + COMBOS.length,
  advance: N + COMBOS.length + DIR.length * 3,
  fortify: N + COMBOS.length + DIR.length * 3 + 5,
  endAttack: N + COMBOS.length + DIR.length * 8 + 5,
  end: N + COMBOS.length + DIR.length * 8 + 6,
  size: N + COMBOS.length + DIR.length * 8 + 7,
} as const;

const frac = (lo: number, hi: number, f: number) => lo + Math.round(((hi - lo) * f) / 4);

/** The engine action for a code in state g, or null when it does not apply. */
export function decode(g: WarGame, n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n < CODE.trade) return { t: 'place', at: n };
  if (n < CODE.attack) {
    const hand = g.hands[g.turn]!;
    const pos = COMBOS[n - CODE.trade]!;
    if (pos.some((i) => i >= hand.length)) return null;
    return { t: 'trade', cards: pos.map((i) => hand[i]!) };
  }
  if (n < CODE.advance) {
    const k = n - CODE.attack;
    const [from, to] = DIR[Math.floor(k / 3)]!;
    return { t: 'attack', from, to, dice: (k % 3) + 1 };
  }
  if (n < CODE.fortify) {
    const ph = g.phase;
    if (ph.k !== 'advance') return null;
    return { t: 'advance', n: frac(ph.min, ph.max, n - CODE.advance) };
  }
  if (n < CODE.endAttack) {
    const k = n - CODE.fortify;
    const [from, to] = DIR[Math.floor(k / 5)]!;
    const max = g.armies[from]! - 1;
    if (max < 1) return null;
    return { t: 'fortify', from, to, n: frac(1, max, k % 5) };
  }
  return n === CODE.endAttack ? { t: 'endAttack' } : { t: 'end' };
}

/** The code of an engine action (advances and fortifications rounded to the nearest fifth). */
export function encode(g: WarGame, a: Action): number {
  switch (a.t) {
    case 'place':
      return a.at;
    case 'trade': {
      const hand = g.hands[g.turn]!;
      const pos = a.cards.map((c) => hand.indexOf(c)).sort((x, y) => x - y);
      const k = COMBOS.findIndex((c) => c.every((v, i) => v === pos[i]));
      // A set beyond the first ten hand positions: trade the first encodable set instead.
      return k >= 0
        ? CODE.trade + k
        : (legalCodes(g).find((c) => c >= CODE.trade && c < CODE.attack) ?? -1);
    }
    case 'attack':
      return CODE.attack + dirIndex.get(a.from * 100 + a.to)! * 3 + a.dice - 1;
    case 'advance': {
      const ph = g.phase;
      if (ph.k !== 'advance') return -1;
      let best = 0;
      for (let f = 0; f < 5; f++)
        if (Math.abs(frac(ph.min, ph.max, f) - a.n) < Math.abs(frac(ph.min, ph.max, best) - a.n))
          best = f;
      return CODE.advance + best;
    }
    case 'fortify': {
      const max = g.armies[a.from]! - 1;
      let best = 0;
      for (let f = 0; f < 5; f++)
        if (Math.abs(frac(1, max, f) - a.n) < Math.abs(frac(1, max, best) - a.n)) best = f;
      return CODE.fortify + dirIndex.get(a.from * 100 + a.to)! * 5 + best;
    }
    case 'endAttack':
      return CODE.endAttack;
    case 'end':
      return CODE.end;
  }
}

export function legalCodes(g: WarGame): number[] {
  const ph = g.phase;
  const p = g.turn;
  const out: number[] = [];
  switch (ph.k) {
    case 'over':
      return [];
    case 'setup':
      return owned(g, p);
    case 'reinforce': {
      const hand = g.hands[p]!;
      COMBOS.forEach((pos, k) => {
        if (pos.every((i) => i < hand.length) && isSet(pos.map((i) => hand[i]!)))
          out.push(CODE.trade + k);
      });
      if (!(hand.length >= 5 && out.length) && ph.left > 0) out.push(...owned(g, p));
      // A hand beyond the encoded ten positions can still trade its first ten.
      return out.sort((a, b) => a - b);
    }
    case 'attack':
      DIR.forEach(([from, to], k) => {
        if (g.owner[from] !== p || g.owner[to] === p) return;
        for (let d = 1; d <= Math.min(3, g.armies[from]! - 1); d++)
          out.push(CODE.attack + k * 3 + d - 1);
      });
      out.push(CODE.endAttack);
      return out;
    case 'advance':
      return [0, 1, 2, 3, 4].map((f) => CODE.advance + f);
    case 'fortify':
      DIR.forEach(([from, to], k) => {
        if (g.owner[from] === p && g.owner[to] === p && g.armies[from]! >= 2)
          for (let f = 0; f < 5; f++) out.push(CODE.fortify + k * 5 + f);
      });
      out.push(CODE.end);
      return out;
  }
}

/* ---------- observation ---------- */

export interface Observation {
  seat: number;
  players: number;
  owner: number[];
  armies: number[];
  pool: number[];
  turn: number;
  round: number;
  phase: WarGame['phase'];
  trades: number;
  conquered: boolean;
  alive: boolean[];
  hand: number[];
  /** Card counts of every player. */
  cards: number[];
  deck: number;
}

export function observe(g: WarGame, seat: number): Observation {
  return {
    seat,
    players: g.players,
    owner: g.owner,
    armies: g.armies,
    pool: g.pool,
    turn: g.turn,
    round: g.round,
    phase: g.phase,
    trades: g.trades,
    conquered: g.conquered,
    alive: g.alive,
    hand: g.hands[seat]!,
    cards: g.hands.map((h) => h.length),
    deck: g.deck.length,
  };
}

export function outcome(g: WarGame): Outcome | null {
  if (g.phase.k !== 'over' || g.winner === null) return null;
  return {
    returns: g.alive.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: g.alive.map((_, p) => owned(g, p).length),
    reason: g.owner.every((o) => o === g.winner) ? 'conquest' : 'round-limit',
  };
}

export const env: GameEnvironment<WarGame, number, Observation, Config> = {
  id: 'world-conquest',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 5,
    // Dice, the deal and the deck come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newWar([2, 3, 4, 5].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newWar(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: legalCodes,
  applyAction: (g, n) => {
    const a = decode(g, n);
    if (!a || !legalCodes(g).includes(n) || !isLegal(g, a))
      throw new IllegalActionError(`Illegal action ${String(n)}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase.k === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase.k === 'over',
  getOutcome: outcome,
  getReward: (g, seat) => outcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isValidWar(parsed)) throw new Error('Invalid World Conquest state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => `#${n}`,
};

function wrap(agent: Agent<WarGame, Action>): Agent<WarGame, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        g,
        agent.selectAction(e as unknown as GameEnvironment<WarGame, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<WarGame, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<WarGame, number>)
    : { ...a, create: () => wrap(a.create() as Agent<WarGame, Action>) },
);

export const bundle: AiBundle<WarGame, number> = {
  env: env as unknown as AiBundle<WarGame, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
