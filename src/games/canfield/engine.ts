/**
 * Canfield. From a seeded deck: 13 cards form the reserve (only its top card face up), the next
 * card starts the first foundation and sets the **base rank**, four cards start the four tableau
 * piles, and the other 34 form the stock.
 *
 * - Foundations build up by suit from the base rank, wrapping from king to ace; a card of the base
 *   rank may start any empty foundation.
 * - Tableau piles build down in alternating colors, also wrapping (a king may go on an ace); any
 *   properly built run moves as a unit. An empty tableau pile is filled at once from the reserve;
 *   once the reserve is empty, any card may be put there.
 * - The stock is turned three cards at a time onto the waste (fewer at the end), with unlimited
 *   passes; the tops of the waste and the reserve are playable.
 * - Won with all 52 cards home. Lost when drawing is the only move left and a whole pass turned up
 *   nothing else, or after 1500 moves. Score: cards home.
 *
 * Moves: "draw", "r>f1" (reserve), "w>t2" (waste), "t0:2>t3", "t1>f0".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { isRed, rankOf, shuffledDeck, suitOf } from '../shared/cards/cards';

export const MOVE_LIMIT = 1500;

export interface CanfieldState {
  seed: number;
  base: number;
  reserve: number[];
  stock: number[];
  waste: number[];
  foundations: number[][];
  tableau: number[][];
  history: string[];
  /** Consecutive draws made when drawing was the only legal move. */
  quiet: number;
  /** Times the waste went back into the stock. */
  recycles: number;
  result: 'won' | 'lost' | null;
}

export function dealCanfield(seed: number): CanfieldState {
  const deck = shuffledDeck(seed);
  const reserve = deck.slice(0, 13);
  const first = deck[13]!;
  return {
    seed,
    base: rankOf(first),
    reserve,
    foundations: [[first], [], [], []],
    tableau: [14, 15, 16, 17].map((i) => [deck[i]!]),
    stock: deck.slice(18),
    waste: [],
    history: [],
    quiet: 0,
    recycles: 0,
    result: null,
  };
}

const top = (p: readonly number[]) => p[p.length - 1];
/** The rank after r, wrapping king → ace. */
const up = (r: number) => (r % 13) + 1;

export function fitsFoundation(s: CanfieldState, f: readonly number[], card: number): boolean {
  const t = top(f);
  if (t === undefined) return rankOf(card) === s.base;
  return suitOf(t) === suitOf(card) && rankOf(card) === up(rankOf(t));
}

/** `card` may lie on `t` in the tableau: alternating colors, one rank lower (ace → king wraps). */
export const stacks = (t: number, card: number) =>
  isRed(t) !== isRed(card) && up(rankOf(card)) === rankOf(t);

function fitsTableau(s: CanfieldState, p: readonly number[], card: number): boolean {
  const t = top(p);
  // Empty piles refill from the reserve by themselves; once it is empty they take any card.
  if (t === undefined) return s.reserve.length === 0;
  return stacks(t, card);
}

/** First index of the movable run at the top of tableau pile i. */
export function runStart(p: readonly number[]): number {
  let k = p.length - 1;
  while (k > 0 && stacks(p[k - 1]!, p[k]!)) k--;
  return k;
}

export function legalCanfieldMoves(s: CanfieldState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  for (const [code, card] of [
    ['r', top(s.reserve)],
    ['w', top(s.waste)],
  ] as const) {
    if (card === undefined) continue;
    s.foundations.forEach((f, j) => fitsFoundation(s, f, card) && out.push(`${code}>f${j}`));
    s.tableau.forEach((p, j) => fitsTableau(s, p, card) && out.push(`${code}>t${j}`));
  }
  s.tableau.forEach((p, i) => {
    const t = top(p);
    if (t === undefined) return;
    s.foundations.forEach((f, j) => fitsFoundation(s, f, t) && out.push(`t${i}>f${j}`));
    for (let k = runStart(p); k < p.length; k++)
      s.tableau.forEach((q, j) => {
        if (j === i || (!q.length && k === 0)) return;
        if (fitsTableau(s, q, p[k]!)) out.push(`t${i}:${k}>t${j}`);
      });
  });
  if (s.stock.length || s.waste.length) out.push('draw');
  return out;
}

const MOVE = /^(?:draw|[rw]>[ft]\d|t\d>f\d|t\d:\d+>t\d)$/;

export const isLegalCanfieldMove = (s: CanfieldState, m: string) =>
  !s.result && typeof m === 'string' && MOVE.test(m) && legalCanfieldMoves(s).includes(m);

/** Fills empty tableau piles from the reserve. */
function refill(n: CanfieldState) {
  n.tableau.forEach((p) => {
    if (!p.length && n.reserve.length) p.push(n.reserve.pop()!);
  });
}

function shift(n: CanfieldState, m: string, onlyDraw: boolean) {
  if (m === 'draw') {
    if (n.stock.length) for (let i = 0; i < 3 && n.stock.length; i++) n.waste.push(n.stock.pop()!);
    else {
      n.stock = n.waste.reverse();
      n.waste = [];
      n.recycles++;
    }
    n.quiet = onlyDraw ? n.quiet + 1 : 0;
    return;
  }
  n.quiet = 0;
  const [from, to] = m.split('>') as [string, string];
  let cards: number[];
  if (from === 'r') cards = [n.reserve.pop()!];
  else if (from === 'w') cards = [n.waste.pop()!];
  else {
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    const p = n.tableau[i]!;
    cards = p.splice(k ?? p.length - 1);
  }
  const dest = Number(to.slice(1));
  if (to[0] === 'f') n.foundations[dest]!.push(...cards);
  else n.tableau[dest]!.push(...cards);
  refill(n);
}

export const homeCount = (s: CanfieldState) => s.foundations.reduce((a, f) => a + f.length, 0);

function settle(n: CanfieldState) {
  if (homeCount(n) === 52) n.result = 'won';
  else if (n.history.length >= MOVE_LIMIT) n.result = 'lost';
  else {
    const legal = legalCanfieldMoves({ ...n, result: null });
    const cycle = Math.ceil((n.stock.length + n.waste.length) / 3) + 1;
    if (legal.length === 0 || (legal.length === 1 && n.quiet > cycle)) n.result = 'lost';
  }
}

const clone = (s: CanfieldState): CanfieldState => ({
  ...s,
  reserve: s.reserve.slice(),
  stock: s.stock.slice(),
  waste: s.waste.slice(),
  foundations: s.foundations.map((f) => f.slice()),
  tableau: s.tableau.map((p) => p.slice()),
  history: s.history.slice(),
});

/** A legal move without checks or settling the result (used by search). */
export function moveCanfield(s: CanfieldState, m: string): CanfieldState {
  const n = clone(s);
  n.history.push(m);
  shift(n, m, false);
  return n;
}

export function applyCanfieldMove(s: CanfieldState, m: string): CanfieldState {
  if (!isLegalCanfieldMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = clone(s);
  n.history.push(m);
  shift(n, m, legalCanfieldMoves(s).length === 1);
  settle(n);
  return n;
}

export function replayCanfield(seed: number, history: readonly string[]): CanfieldState {
  return history.reduce((s, m) => applyCanfieldMove(s, m), dealCanfield(seed));
}

export function isValidCanfieldState(data: unknown): data is CanfieldState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayCanfield(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
