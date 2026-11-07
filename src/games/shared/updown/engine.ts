/**
 * "Up or down" solitaires (#078 TriPeaks, #079 Golf): cards from a tableau go onto a single waste
 * pile when they are one rank above or below its top card; the stock turns a new waste card when
 * nothing fits. Each layout defines its positions, which cards cover which, whether covered cards
 * lie face down, whether ranks wrap (king ↔ ace) and how it scores.
 *
 * - TriPeaks: 28 cards in three overlapping peaks (rows of 3, 6, 9, 10); only the bottom row starts
 *   face up and a card turns up once uncovered. Ranks wrap. Score: each card played scores the
 *   length of the current run of plays (a draw ends the run); +15 for each peak top, +30 more for
 *   clearing all three.
 * - Golf: seven columns of five face-up cards; only column tops play. No wrap. Score as in golf:
 *   cards left on the tableau, or minus the cards left in the stock when the tableau is cleared
 *   (lower is better).
 * - The waste starts with one card from the stock; the stock is turned once (no redeal).
 * - Won when the tableau is cleared. Lost when the stock is empty and no card fits.
 *
 * Moves: "draw", "p12" (play position 12 to the waste).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { rankOf, shuffledDeck } from '../cards/cards';

export interface UpDownLayout {
  id: 'tripeaks' | 'golf';
  /** coveredBy[i]: positions that must be cleared before position i is free. */
  coveredBy: readonly (readonly number[])[];
  /** Covered cards lie face down until freed. */
  hidden: boolean;
  wrap: boolean;
  /** Display position of each tableau card (columns and card heights). */
  xy: readonly { col: number; y: number }[];
}

export interface UpDownState {
  seed: number;
  /** −1 where a card has been played. */
  tableau: number[];
  stock: number[];
  waste: number[];
  /** Plays since the last draw (TriPeaks scoring). */
  run: number;
  history: string[];
  score: number;
  result: 'won' | 'lost' | null;
}

const RANGE = (n: number) => Array.from({ length: n }, (_, i) => i);

/** TriPeaks: rows of 3 (peak tops), 6, 9 and 10 cards. */
export const TRIPEAKS: UpDownLayout = (() => {
  const coveredBy: number[][] = [];
  const xy: { col: number; y: number }[] = [];
  const STEP = 0.42;
  for (let p = 0; p < 3; p++) {
    coveredBy.push([3 + 2 * p, 4 + 2 * p]);
    xy.push({ col: 3 * p + 1.5, y: 0 });
  }
  for (let q = 0; q < 6; q++) {
    const p = Math.floor(q / 2);
    const s = q % 2;
    coveredBy.push([9 + 3 * p + s, 10 + 3 * p + s]);
    xy.push({ col: 3 * p + s + 1, y: STEP });
  }
  for (let j = 0; j < 9; j++) {
    coveredBy.push([18 + j, 19 + j]);
    xy.push({ col: j + 0.5, y: 2 * STEP });
  }
  for (let j = 0; j < 10; j++) {
    coveredBy.push([]);
    xy.push({ col: j, y: 3 * STEP });
  }
  return { id: 'tripeaks', coveredBy, hidden: true, wrap: true, xy };
})();

/** Golf: seven columns of five; position c·5 + k, k = 0 at the back. */
export const GOLF: UpDownLayout = {
  id: 'golf',
  coveredBy: RANGE(35).map((i) => (i % 5 === 4 ? [] : [i + 1])),
  hidden: false,
  wrap: false,
  xy: RANGE(35).map((i) => ({ col: Math.floor(i / 5), y: (i % 5) * 0.28 })),
};

export function dealUpDown(L: UpDownLayout, seed: number): UpDownState {
  const deck = shuffledDeck(seed);
  const n = L.coveredBy.length;
  const tableau = deck.slice(0, n);
  const stock = deck.slice(n);
  const waste = [stock.pop()!];
  return {
    seed,
    tableau,
    stock,
    waste,
    run: 0,
    history: [],
    score: L.id === 'golf' ? n : 0,
    result: null,
  };
}

export const isFree = (L: UpDownLayout, s: UpDownState, i: number) =>
  s.tableau[i] !== -1 && L.coveredBy[i]!.every((j) => s.tableau[j] === -1);

/** Whether `card` may go onto `top`: one rank apart (king and ace touch when ranks wrap). */
export function fits(L: UpDownLayout, top: number, card: number): boolean {
  const d = Math.abs(rankOf(top) - rankOf(card));
  return d === 1 || (L.wrap && d === 12);
}

export function legalUpDownMoves(L: UpDownLayout, s: UpDownState): string[] {
  if (s.result) return [];
  const top = s.waste[s.waste.length - 1]!;
  const out: string[] = [];
  s.tableau.forEach((c, i) => {
    if (isFree(L, s, i) && fits(L, top, c)) out.push(`p${i}`);
  });
  if (s.stock.length) out.push('draw');
  return out;
}

export function isLegalUpDownMove(L: UpDownLayout, s: UpDownState, m: string): boolean {
  if (s.result || typeof m !== 'string') return false;
  if (m === 'draw') return s.stock.length > 0;
  if (!/^p\d+$/.test(m)) return false;
  const i = Number(m.slice(1));
  return (
    i < s.tableau.length && isFree(L, s, i) && fits(L, s.waste[s.waste.length - 1]!, s.tableau[i]!)
  );
}

function shift(L: UpDownLayout, n: UpDownState, m: string) {
  if (m === 'draw') {
    n.waste.push(n.stock.pop()!);
    n.run = 0;
    return;
  }
  const i = Number(m.slice(1));
  n.waste.push(n.tableau[i]!);
  n.tableau[i] = -1;
  n.run++;
  if (L.id === 'tripeaks') {
    n.score += n.run;
    if (i < 3) n.score += 15;
  } else n.score--;
}

function settle(L: UpDownLayout, n: UpDownState) {
  if (n.tableau.every((c) => c === -1)) {
    n.result = 'won';
    if (L.id === 'tripeaks') n.score += 30;
    else n.score = -n.stock.length;
  } else if (legalUpDownMoves(L, { ...n, result: null }).length === 0) n.result = 'lost';
}

const clone = (s: UpDownState): UpDownState => ({
  ...s,
  tableau: s.tableau.slice(),
  stock: s.stock.slice(),
  waste: s.waste.slice(),
  history: s.history.slice(),
});

/** A legal move without checks or settling the result (used by search). */
export function moveUpDown(L: UpDownLayout, s: UpDownState, m: string): UpDownState {
  const n = clone(s);
  n.history.push(m);
  shift(L, n, m);
  return n;
}

export function applyUpDownMove(L: UpDownLayout, s: UpDownState, m: string): UpDownState {
  if (!isLegalUpDownMove(L, s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = moveUpDown(L, s, m);
  settle(L, n);
  return n;
}

export function replayUpDown(
  L: UpDownLayout,
  seed: number,
  history: readonly string[],
): UpDownState {
  const s = dealUpDown(L, seed);
  for (const m of history) {
    if (!isLegalUpDownMove(L, s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    s.history.push(m);
    shift(L, s, m);
    settle(L, s);
  }
  return s;
}

export function isValidUpDownState(L: UpDownLayout, data: unknown): data is UpDownState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayUpDown(L, data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const clearedCount = (s: UpDownState) => s.tableau.filter((c) => c === -1).length;
