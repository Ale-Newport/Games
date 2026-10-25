/**
 * Pyramid solitaire. 28 cards are dealt face up into a pyramid of seven rows (1…7 cards), each
 * card half covering two cards of the row above; the other 24 form the stock.
 *
 * - A card is free when no card of the row below still covers it. The waste's top card is free
 *   too.
 * - Remove two free cards whose values add up to 13 (ace 1, jack 11, queen 12), or a king alone.
 * - Drawing turns the stock's top card onto the waste. The waste may be turned back into the stock
 *   twice (three passes in all).
 * - Won when the pyramid is cleared (the stock and waste need not be). Lost when no move is left,
 *   or after 600 moves.
 * - Score: 5 points per card removed, plus 50 for clearing the pyramid.
 *
 * Positions: pyramid index i = r(r+1)/2 + k for row r (0 top) and card k; "w" the waste top.
 * Moves: "draw", "p27" (a king), "w" (a king on the waste), "p20+p27", "p25+w".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck } from '../shared/cards/cards';

export const PASSES = 3;
export const MOVE_LIMIT = 600;

export interface PyramidState {
  seed: number;
  /** −1 where a card has been removed. */
  pyramid: number[];
  stock: number[];
  waste: number[];
  /** Times the waste went back into the stock. */
  recycles: number;
  history: string[];
  score: number;
  result: 'won' | 'lost' | null;
}

export const rowOf = (i: number) => Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
export const posOf = (r: number, k: number) => (r * (r + 1)) / 2 + k;

export function dealPyramid(seed: number): PyramidState {
  const deck = shuffledDeck(seed);
  return {
    seed,
    pyramid: deck.slice(0, 28),
    stock: deck.slice(28),
    waste: [],
    recycles: 0,
    history: [],
    score: 0,
    result: null,
  };
}

/** Whether pyramid card i is uncovered (and still there). */
export function isFree(s: PyramidState, i: number): boolean {
  if (s.pyramid[i] === -1) return false;
  const r = rowOf(i);
  if (r === 6) return true;
  const k = i - posOf(r, 0);
  return s.pyramid[posOf(r + 1, k)] === -1 && s.pyramid[posOf(r + 1, k + 1)] === -1;
}

/** Free positions with their cards: pyramid indices and the waste top. */
export function freeCards(s: PyramidState): { at: string; card: number }[] {
  const out: { at: string; card: number }[] = [];
  s.pyramid.forEach((c, i) => {
    if (isFree(s, i)) out.push({ at: `p${i}`, card: c });
  });
  const w = s.waste[s.waste.length - 1];
  if (w !== undefined) out.push({ at: 'w', card: w });
  return out;
}

export const canDraw = (s: PyramidState) =>
  s.stock.length > 0 || (s.waste.length > 0 && s.recycles < PASSES - 1);

export function legalPyramidMoves(s: PyramidState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  const free = freeCards(s);
  free.forEach((a, x) => {
    if (rankOf(a.card) === 13) out.push(a.at);
    for (let y = x + 1; y < free.length; y++)
      if (rankOf(a.card) + rankOf(free[y]!.card) === 13) out.push(`${a.at}+${free[y]!.at}`);
  });
  if (canDraw(s)) out.push('draw');
  return out;
}

const MOVE = /^(?:draw|w|p\d+|p\d+\+(?:p\d+|w))$/;

export function isLegalPyramidMove(s: PyramidState, m: string): boolean {
  if (s.result || typeof m !== 'string' || !MOVE.test(m)) return false;
  if (m === 'draw') return canDraw(s);
  const card = (at: string) => {
    if (at === 'w') return s.waste[s.waste.length - 1];
    const i = Number(at.slice(1));
    return i < 28 && isFree(s, i) ? s.pyramid[i] : undefined;
  };
  const [a, b] = m.split('+') as [string, string | undefined];
  const ca = card(a);
  if (ca === undefined) return false;
  if (b === undefined) return rankOf(ca) === 13;
  const cb = card(b);
  return cb !== undefined && a !== b && rankOf(ca) + rankOf(cb) === 13;
}

/** Applies a legal move inside `n` (mutating it). */
function shift(n: PyramidState, m: string) {
  if (m === 'draw') {
    if (n.stock.length) n.waste.push(n.stock.pop()!);
    else {
      n.stock = n.waste.reverse();
      n.waste = [];
      n.recycles++;
    }
    return;
  }
  for (const at of m.split('+')) {
    if (at === 'w') n.waste.pop();
    else n.pyramid[Number(at.slice(1))] = -1;
    n.score += 5;
  }
}

function settle(n: PyramidState) {
  if (n.pyramid.every((c) => c === -1)) {
    n.result = 'won';
    n.score += 50;
  } else if (
    n.history.length >= MOVE_LIMIT ||
    legalPyramidMoves({ ...n, result: null }).length === 0
  )
    n.result = 'lost';
}

const clone = (s: PyramidState): PyramidState => ({
  ...s,
  pyramid: s.pyramid.slice(),
  stock: s.stock.slice(),
  waste: s.waste.slice(),
  history: s.history.slice(),
});

/** A legal move without checks or settling the result (used by search). */
export function movePyramid(s: PyramidState, m: string): PyramidState {
  const n = clone(s);
  n.history.push(m);
  shift(n, m);
  return n;
}

export function applyPyramidMove(s: PyramidState, m: string): PyramidState {
  if (!isLegalPyramidMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = movePyramid(s, m);
  settle(n);
  return n;
}

export function replayPyramid(seed: number, history: readonly string[]): PyramidState {
  const s = dealPyramid(seed);
  for (const m of history) {
    if (!isLegalPyramidMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    s.history.push(m);
    shift(s, m);
    settle(s);
  }
  return s;
}

export function isValidPyramidState(data: unknown): data is PyramidState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayPyramid(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const removedCount = (s: PyramidState) => s.pyramid.filter((c) => c === -1).length;
