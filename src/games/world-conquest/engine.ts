/**
 * World Conquest rules (pure). 2–5 players share out the 36 territories of an invented world
 * (map.ts) and place their starting armies three at a time. A turn: reinforcements (a third of
 * your territories, at least 3, plus the bonus of every landmass you hold whole, plus card sets),
 * attacks (up to three attacking dice against up to two defending, highest against highest, ties
 * to the defender; a conquered territory is occupied with at least as many armies as dice rolled),
 * then one move of armies between two adjacent territories of your own. Conquering at least one
 * territory in a turn earns a card; sets of three are traded for growing numbers of armies.
 * Knocking a player out takes their cards. The last player standing wins. Dice, the deal and the
 * deck come from a generator stored in the state. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { MAP } from './map';

export const N = MAP.territories.length;
export const START_ARMIES: Record<number, number> = { 2: 40, 3: 35, 4: 30, 5: 25 };
export const SETUP_BATCH = 3;
export const HAND_LIMIT = 5;
export const MAX_ROUNDS = 300;
/** Card kinds: shield, horse, cannon; 3 is a wild card. */
export const KINDS = ['shield', 'horse', 'cannon', 'wild'] as const;
/** Cards 0–35 show territory i with kind i mod 3; cards 36 and 37 are wild. */
export const CARDS = N + 2;
export const cardKind = (c: number) => (c >= N ? 3 : c % 3);
export const cardTerritory = (c: number) => (c >= N ? -1 : c);

/** Armies for the k-th set traded in the game (0-based): 4, 6, 8, 10, 12, 15, then +5. */
export const setValue = (k: number) => (k < 5 ? 4 + 2 * k : 15 + 5 * (k - 5));

export function isSet(cards: readonly number[]): boolean {
  if (cards.length !== 3 || new Set(cards).size !== 3) return false;
  const k = cards.map(cardKind);
  if (k.includes(3)) return true;
  return new Set(k).size === 1 || new Set(k).size === 3;
}

export type Phase =
  | { k: 'setup'; placed: number }
  | { k: 'reinforce'; left: number; then: 'attack' }
  | { k: 'attack' }
  | { k: 'advance'; from: number; to: number; min: number; max: number }
  | { k: 'fortify' }
  | { k: 'over' };

export type LogEntry =
  | {
      k: 'battle';
      p: number;
      def: number;
      from: number;
      to: number;
      a: number[];
      d: number[];
      lost: [number, number];
    }
  | { k: 'conquer'; p: number; t: number; from: number }
  | { k: 'out'; p: number; by: number; cards: number }
  | { k: 'trade'; p: number; cards: number[]; armies: number; bonus: number | null }
  | { k: 'reinforce'; p: number; armies: number }
  | { k: 'fortify'; p: number; from: number; to: number; n: number }
  | { k: 'card'; p: number }
  | { k: 'win'; p: number };

export interface WarGame {
  seed: number;
  rng: RngState;
  players: number;
  owner: number[];
  armies: number[];
  /** Armies still to place in setup, per player. */
  pool: number[];
  hands: number[][];
  deck: number[];
  discard: number[];
  trades: number;
  turn: number;
  round: number;
  phase: Phase;
  conquered: boolean;
  alive: boolean[];
  winner: number | null;
  /** The last battle's dice, for the table. */
  dice: { a: number[]; d: number[] } | null;
  log: LogEntry[];
}

export type Action =
  | { t: 'place'; at: number }
  | { t: 'trade'; cards: number[] }
  | { t: 'attack'; from: number; to: number; dice: number }
  | { t: 'advance'; n: number }
  | { t: 'endAttack' }
  | { t: 'fortify'; from: number; to: number; n: number }
  | { t: 'end' };

/* ---------- setup ---------- */

export function newWar(players: number, seed: number): WarGame {
  if (!(players in START_ARMIES)) throw new RangeError('World Conquest is for 2–5 players');
  const rng = new Rng(seed >>> 0);
  const order = rng.shuffle(MAP.territories.map((_, i) => i));
  const owner = Array<number>(N).fill(-1);
  order.forEach((t, k) => (owner[t] = k % players));
  const armies = Array<number>(N).fill(1);
  const pool = Array.from(
    { length: players },
    (_, p) => START_ARMIES[players]! - owner.filter((o) => o === p).length,
  );
  const deck = rng.shuffle(Array.from({ length: CARDS }, (_, i) => i));
  return {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    owner,
    armies,
    pool,
    hands: Array.from({ length: players }, () => []),
    deck,
    discard: [],
    trades: 0,
    turn: 0,
    round: 0,
    phase: { k: 'setup', placed: 0 },
    conquered: false,
    alive: Array<boolean>(players).fill(true),
    winner: null,
    dice: null,
    log: [],
  };
}

/* ---------- queries ---------- */

export const owned = (g: WarGame, p: number) =>
  g.owner.map((o, i) => (o === p ? i : -1)).filter((i) => i >= 0);

/** Landmasses held whole by p. */
export const regionsHeld = (g: WarGame, p: number) =>
  MAP.regions
    .map((r, i) => (r.members.every((t) => g.owner[t] === p) ? i : -1))
    .filter((i) => i >= 0);

/** Reinforcements at the start of p's turn (before cards). */
export function income(g: WarGame, p: number): number {
  const base = Math.max(3, Math.floor(owned(g, p).length / 3));
  return base + regionsHeld(g, p).reduce((a, r) => a + MAP.regions[r]!.bonus, 0);
}

/** Every valid set in a hand (as card ids). */
export function setsIn(hand: readonly number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < hand.length; i++)
    for (let j = i + 1; j < hand.length; j++)
      for (let k = j + 1; k < hand.length; k++) {
        const s = [hand[i]!, hand[j]!, hand[k]!];
        if (isSet(s)) out.push(s);
      }
  return out;
}

export const currentPlayer = (g: WarGame) => (g.phase.k === 'over' ? -1 : g.turn);

export function legalActions(g: WarGame): Action[] {
  const ph = g.phase;
  const p = g.turn;
  const out: Action[] = [];
  const mine = owned(g, p);
  switch (ph.k) {
    case 'over':
      return [];
    case 'setup':
      return mine.map((at) => ({ t: 'place', at }));
    case 'reinforce': {
      const hand = g.hands[p]!;
      for (const cards of setsIn(hand)) out.push({ t: 'trade', cards });
      // Five or more cards: a set must be traded before anything else.
      if (hand.length >= HAND_LIMIT && out.length) return out;
      if (ph.left > 0) for (const at of mine) out.push({ t: 'place', at });
      return out;
    }
    case 'attack':
      for (const from of mine) {
        if (g.armies[from]! < 2) continue;
        for (const to of MAP.territories[from]!.adj)
          if (g.owner[to] !== p)
            for (let d = 1; d <= Math.min(3, g.armies[from]! - 1); d++)
              out.push({ t: 'attack', from, to, dice: d });
      }
      out.push({ t: 'endAttack' });
      return out;
    case 'advance':
      for (let n = ph.min; n <= ph.max; n++) out.push({ t: 'advance', n });
      return out;
    case 'fortify':
      for (const from of mine) {
        if (g.armies[from]! < 2) continue;
        for (const to of MAP.territories[from]!.adj)
          if (g.owner[to] === p)
            for (let n = 1; n <= g.armies[from]! - 1; n++) out.push({ t: 'fortify', from, to, n });
      }
      out.push({ t: 'end' });
      return out;
  }
}

export function isLegal(g: WarGame, a: Action): boolean {
  const ph = g.phase;
  const p = g.turn;
  switch (a.t) {
    case 'place':
      return (
        (ph.k === 'setup' || (ph.k === 'reinforce' && ph.left > 0 && !mustTrade(g))) &&
        g.owner[a.at] === p
      );
    case 'trade':
      return (
        ph.k === 'reinforce' && isSet(a.cards) && a.cards.every((c) => g.hands[p]!.includes(c))
      );
    case 'attack':
      return (
        ph.k === 'attack' &&
        g.owner[a.from] === p &&
        g.owner[a.to] !== p &&
        MAP.territories[a.from]!.adj.includes(a.to) &&
        Number.isInteger(a.dice) &&
        a.dice >= 1 &&
        a.dice <= Math.min(3, g.armies[a.from]! - 1)
      );
    case 'advance':
      return ph.k === 'advance' && Number.isInteger(a.n) && a.n >= ph.min && a.n <= ph.max;
    case 'endAttack':
      return ph.k === 'attack';
    case 'fortify':
      return (
        ph.k === 'fortify' &&
        g.owner[a.from] === p &&
        g.owner[a.to] === p &&
        MAP.territories[a.from]!.adj.includes(a.to) &&
        Number.isInteger(a.n) &&
        a.n >= 1 &&
        a.n <= g.armies[a.from]! - 1
      );
    case 'end':
      return ph.k === 'fortify';
  }
}
const mustTrade = (g: WarGame) =>
  g.hands[g.turn]!.length >= HAND_LIMIT && setsIn(g.hands[g.turn]!).length > 0;

/* ---------- transitions ---------- */

const LOG_KEEP = 40;
const log = (g: WarGame, e: LogEntry) => {
  g.log = [...g.log, e].slice(-LOG_KEEP);
};

function startTurn(g: WarGame) {
  const n = income(g, g.turn);
  g.conquered = false;
  g.dice = null;
  g.phase = { k: 'reinforce', left: n, then: 'attack' };
  log(g, { k: 'reinforce', p: g.turn, armies: n });
}

function nextAlive(g: WarGame, from: number) {
  for (let k = 1; k <= g.players; k++) {
    const q = (from + k) % g.players;
    if (g.alive[q]) return q;
  }
  return from;
}

function endTurn(g: WarGame) {
  if (g.conquered) {
    if (!g.deck.length && g.discard.length) {
      const rng = new Rng(g.rng);
      g.deck = rng.shuffle(g.discard);
      g.rng = rng.state;
      g.discard = [];
    }
    const c = g.deck.shift();
    if (c !== undefined) {
      g.hands[g.turn]!.push(c);
      log(g, { k: 'card', p: g.turn });
    }
  }
  const next = nextAlive(g, g.turn);
  if (next <= g.turn) g.round += 1;
  g.turn = next;
  if (g.round >= MAX_ROUNDS) {
    // Safety limit: the most territories (then armies) win.
    const score = (p: number) =>
      owned(g, p).length * 1000 + owned(g, p).reduce((a, t) => a + g.armies[t]!, 0);
    const ps = g.alive.map((al, p) => (al ? p : -1)).filter((p) => p >= 0);
    g.winner = ps.reduce((b, p) => (score(p) > score(b) ? p : b), ps[0]!);
    g.phase = { k: 'over' };
    log(g, { k: 'win', p: g.winner });
    return;
  }
  startTurn(g);
}

function afterReinforce(g: WarGame) {
  const ph = g.phase;
  if (ph.k === 'reinforce' && ph.left === 0 && !mustTrade(g)) g.phase = { k: 'attack' };
}

export function act(g0: WarGame, a: Action): WarGame {
  if (!isLegal(g0, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g: WarGame = structuredClone(g0);
  const ph = g.phase;
  const p = g.turn;
  switch (a.t) {
    case 'place': {
      g.armies[a.at]! += 1;
      if (ph.k === 'setup') {
        g.pool[p]! -= 1;
        const placed = ph.placed + 1;
        if (g.pool[p]! > 0 && placed < SETUP_BATCH) g.phase = { k: 'setup', placed };
        else if (g.pool.every((x) => x === 0)) {
          g.turn = 0;
          startTurn(g);
        } else {
          // The next player who still has armies to place.
          let q = (p + 1) % g.players;
          while (g.pool[q] === 0) q = (q + 1) % g.players;
          g.turn = q;
          g.phase = { k: 'setup', placed: 0 };
        }
      } else if (ph.k === 'reinforce') {
        g.phase = { ...ph, left: ph.left - 1 };
        afterReinforce(g);
      }
      break;
    }
    case 'trade': {
      if (ph.k !== 'reinforce') break;
      const value = setValue(g.trades);
      g.trades += 1;
      g.hands[p] = g.hands[p]!.filter((c) => !a.cards.includes(c));
      g.discard.push(...a.cards);
      // Two extra armies on one shown territory the player holds (once per set).
      const bonus = a.cards.map(cardTerritory).find((t) => t >= 0 && g.owner[t] === p) ?? null;
      if (bonus !== null) g.armies[bonus]! += 2;
      g.phase = { ...ph, left: ph.left + value };
      log(g, { k: 'trade', p, cards: [...a.cards], armies: value, bonus });
      afterReinforce(g);
      break;
    }
    case 'attack': {
      const rng = new Rng(g.rng);
      const def = g.owner[a.to]!;
      const dd = Math.min(2, g.armies[a.to]!);
      const roll = (n: number) =>
        Array.from({ length: n }, () => rng.range(1, 6)).sort((x, y) => y - x);
      const A = roll(a.dice);
      const D = roll(dd);
      g.rng = rng.state;
      const lost: [number, number] = [0, 0];
      for (let i = 0; i < Math.min(A.length, D.length); i++)
        if (A[i]! > D[i]!) lost[1] += 1;
        else lost[0] += 1;
      g.armies[a.from]! -= lost[0];
      g.armies[a.to]! -= lost[1];
      g.dice = { a: A, d: D };
      log(g, { k: 'battle', p, def, from: a.from, to: a.to, a: A, d: D, lost });
      if (g.armies[a.to] === 0) {
        g.owner[a.to] = p;
        g.conquered = true;
        log(g, { k: 'conquer', p, t: a.to, from: a.from });
        if (!g.owner.includes(def)) {
          g.alive[def] = false;
          const cards = g.hands[def]!;
          g.hands[p]!.push(...cards);
          g.hands[def] = [];
          log(g, { k: 'out', p: def, by: p, cards: cards.length });
        }
        if (g.owner.every((o) => o === p)) {
          g.armies[a.to] = a.dice;
          g.armies[a.from]! -= a.dice;
          g.winner = p;
          g.phase = { k: 'over' };
          log(g, { k: 'win', p });
          break;
        }
        const max = g.armies[a.from]! - 1;
        g.phase = { k: 'advance', from: a.from, to: a.to, min: Math.min(a.dice, max), max };
      }
      break;
    }
    case 'advance': {
      if (ph.k !== 'advance') break;
      g.armies[ph.from]! -= a.n;
      g.armies[ph.to]! += a.n;
      // A player who took six or more cards by knocking someone out trades down to four now.
      if (g.hands[p]!.length >= 6 && setsIn(g.hands[p]!).length)
        g.phase = { k: 'reinforce', left: 0, then: 'attack' };
      else g.phase = { k: 'attack' };
      break;
    }
    case 'endAttack':
      g.phase = { k: 'fortify' };
      break;
    case 'fortify':
      g.armies[a.from]! -= a.n;
      g.armies[a.to]! += a.n;
      log(g, { k: 'fortify', p, from: a.from, to: a.to, n: a.n });
      endTurn(g);
      break;
    case 'end':
      endTurn(g);
      break;
  }
  return g;
}

/* ---------- validation ---------- */

export function isValidWar(v: unknown): v is WarGame {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as WarGame;
  if (!(g.players in START_ARMIES)) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  const ints = (xs: unknown, n: number) =>
    Array.isArray(xs) && xs.length === n && xs.every((x) => Number.isInteger(x));
  if (!ints(g.owner, N) || !ints(g.armies, N) || !ints(g.pool, g.players)) return false;
  if (!g.owner.every((o) => o >= 0 && o < g.players)) return false;
  if (!g.armies.every((a) => a >= 0)) return false;
  if (!Array.isArray(g.hands) || g.hands.length !== g.players) return false;
  // Every card is in exactly one place.
  const all = [...g.hands.flat(), ...g.deck, ...g.discard];
  if (all.length !== CARDS || new Set(all).size !== CARDS) return false;
  if (!Array.isArray(g.alive) || g.alive.length !== g.players) return false;
  if (!Number.isInteger(g.turn) || g.turn < 0 || g.turn >= g.players) return false;
  const kinds = ['setup', 'reinforce', 'attack', 'advance', 'fortify', 'over'];
  return typeof g.phase === 'object' && g.phase !== null && kinds.includes(g.phase.k);
}
