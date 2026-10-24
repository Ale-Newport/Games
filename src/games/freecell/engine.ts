/**
 * FreeCell. A seeded deck is dealt face up into eight columns (7, 7, 7, 7, 6, 6, 6, 6). There are
 * four free cells (one card each) and four foundations, built up by suit from the ace (an ace may
 * start any empty foundation).
 *
 * - Columns build down in alternating colors. The top card of a column or a free cell may move to
 *   a foundation, a free cell, or onto a column (an empty column takes any card).
 * - A run in sequence may move as a unit if there is room to move it card by card: at most
 *   (free cells + 1) · 2^(empty columns) cards, not counting the target if it is an empty column.
 * - Foundation cards stay home.
 * - Won when all 52 cards are home; lost when no move is left, or after 1000 moves.
 *
 * Moves: "c3>f0", "c3>r1" (to cell 1), "r1>c4", "r1>f2", "c3:5>c6" (column 3 from card 5).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { isRed, rankOf, shuffledDeck, suitOf } from '../shared/cards/cards';

export const MOVE_LIMIT = 1000;

export interface FreeCellState {
  seed: number;
  columns: number[][];
  /** −1 for an empty cell. */
  cells: number[];
  foundations: number[][];
  history: string[];
  result: 'won' | 'lost' | null;
}

export function dealFreeCell(seed: number): FreeCellState {
  const deck = shuffledDeck(seed);
  const columns: number[][] = Array.from({ length: 8 }, () => []);
  deck.forEach((c, i) => columns[i % 8]!.push(c));
  return {
    seed,
    columns,
    cells: [-1, -1, -1, -1],
    foundations: [[], [], [], []],
    history: [],
    result: null,
  };
}

const top = (p: readonly number[]) => p[p.length - 1];

export function fitsFoundation(f: readonly number[], card: number): boolean {
  const t = top(f);
  if (t === undefined) return rankOf(card) === 1;
  return suitOf(t) === suitOf(card) && rankOf(card) === rankOf(t) + 1;
}

/** Whether `card` may go onto a non-empty column whose top is `t`. */
const stacks = (t: number, card: number) =>
  isRed(t) !== isRed(card) && rankOf(card) === rankOf(t) - 1;

/** Cards at the bottom of column `p` (from index k up) that form a movable sequence. */
export function sequenceStart(p: readonly number[]): number {
  let k = p.length - 1;
  while (k > 0 && stacks(p[k - 1]!, p[k]!)) k--;
  return k;
}

/** Largest run that may move, given the free cells and empty columns (target excluded). */
export function maxRun(s: FreeCellState, toEmptyColumn: boolean): number {
  const free = s.cells.filter((c) => c === -1).length;
  const empty = s.columns.filter((p) => p.length === 0).length - (toEmptyColumn ? 1 : 0);
  return (free + 1) * 2 ** Math.max(0, empty);
}

export function legalFreeCellMoves(s: FreeCellState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.columns.forEach((p, i) => {
    const t = top(p);
    if (t === undefined) return;
    s.foundations.forEach((f, j) => fitsFoundation(f, t) && out.push(`c${i}>f${j}`));
    s.cells.forEach((c, r) => c === -1 && out.push(`c${i}>r${r}`));
    const start = sequenceStart(p);
    s.columns.forEach((q, j) => {
      if (j === i) return;
      const qt = top(q);
      if (qt === undefined) {
        // To an empty column: any run that fits (one destination per run length is enough).
        const limit = maxRun(s, true);
        for (let k = Math.max(start, p.length - limit); k < p.length; k++) {
          if (k === 0) continue; // moving a whole column into an empty one changes nothing
          out.push(`c${i}:${k}>c${j}`);
        }
        return;
      }
      for (let k = start; k < p.length; k++)
        if (stacks(qt, p[k]!) && p.length - k <= maxRun(s, false)) out.push(`c${i}:${k}>c${j}`);
    });
  });
  s.cells.forEach((c, r) => {
    if (c === -1) return;
    s.foundations.forEach((f, j) => fitsFoundation(f, c) && out.push(`r${r}>f${j}`));
    s.columns.forEach((q, j) => {
      const qt = top(q);
      if (qt === undefined || stacks(qt, c)) out.push(`r${r}>c${j}`);
    });
  });
  return out;
}

const MOVE = /^(?:c\d>[fr]\d|c\d:\d+>c\d|r\d>[fc]\d)$/;

const clone = (s: FreeCellState): FreeCellState => ({
  ...s,
  columns: s.columns.map((p) => p.slice()),
  cells: s.cells.slice(),
  foundations: s.foundations.map((f) => f.slice()),
  history: s.history.slice(),
});

/** Moves the cards of a legal move inside `n` (mutating it). */
function shiftCards(n: FreeCellState, m: string) {
  const [from, to] = m.split('>') as [string, string];
  let cards: number[];
  if (from[0] === 'r') {
    const r = Number(from.slice(1));
    cards = [n.cells[r]!];
    n.cells[r] = -1;
  } else {
    const [col, at] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    const p = n.columns[col]!;
    cards = p.splice(at ?? p.length - 1);
  }
  const dest = Number(to.slice(1));
  if (to[0] === 'f') n.foundations[dest]!.push(...cards);
  else if (to[0] === 'r') n.cells[dest] = cards[0]!;
  else n.columns[dest]!.push(...cards);
}

/** Plays a legal move without checks or settling the result (used by search). */
export function moveFreeCell(s: FreeCellState, m: string): FreeCellState {
  const n = clone(s);
  n.history.push(m);
  shiftCards(n, m);
  return n;
}

/** Whether `m` is legal, checked directly (cheaper than generating every move). */
export function isLegalFreeCellMove(s: FreeCellState, m: string): boolean {
  if (s.result || typeof m !== 'string' || !MOVE.test(m)) return false;
  const [from, to] = m.split('>') as [string, string];
  const dest = Number(to.slice(1));
  if (from[0] === 'r') {
    const card = s.cells[Number(from.slice(1))];
    if (card === undefined || card === -1) return false;
    if (to[0] === 'f') return dest < 4 && fitsFoundation(s.foundations[dest]!, card);
    const q = s.columns[dest];
    if (!q) return false;
    const qt = top(q);
    return qt === undefined || stacks(qt, card);
  }
  const [col, at] = from.slice(1).split(':').map(Number) as [number, number | undefined];
  const p = s.columns[col];
  if (!p || p.length === 0) return false;
  if (to[0] === 'f')
    return at === undefined && dest < 4 && fitsFoundation(s.foundations[dest]!, top(p)!);
  if (to[0] === 'r') return at === undefined && s.cells[dest] === -1;
  // Column to column: a sequence that fits, small enough to move.
  const q = s.columns[dest];
  if (!q || dest === col || at === undefined || at >= p.length || at < sequenceStart(p))
    return false;
  const qt = top(q);
  if (qt === undefined) return at > 0 && p.length - at <= maxRun(s, true);
  return stacks(qt, p[at]!) && p.length - at <= maxRun(s, false);
}

/** Whether any move at all is left (stops at the first one). */
function anyMove(s: FreeCellState): boolean {
  if (s.cells.includes(-1) && s.columns.some((p) => p.length)) return true;
  const tops = [
    ...s.cells.filter((c) => c !== -1),
    ...s.columns.map(top).filter((c) => c !== undefined),
  ];
  if (tops.some((c) => s.foundations.some((f) => fitsFoundation(f, c!)))) return true;
  const empty = s.columns.some((p) => p.length === 0);
  if (empty && (s.cells.some((c) => c !== -1) || s.columns.some((p) => p.length > 1))) return true;
  return legalFreeCellMoves({ ...s, result: null }).length > 0;
}

export function applyFreeCellMove(s: FreeCellState, m: string): FreeCellState {
  if (!isLegalFreeCellMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = moveFreeCell(s, m);
  settleResult(n);
  return n;
}

function settleResult(n: FreeCellState) {
  if (n.foundations.every((f) => f.length === 13)) n.result = 'won';
  else if (n.history.length >= MOVE_LIMIT || !anyMove(n)) n.result = 'lost';
}

/**
 * A card that can go home and that no column could still need: aces and twos, or cards whose
 * opposite-color cards one rank lower are already home.
 */
export function safeHome(s: FreeCellState, card: number): boolean {
  const r = rankOf(card);
  if (r <= 2) return true;
  const red = isRed(card);
  const lowOpposite = s.foundations
    .filter((f) => f.length && isRed(f[0]!) !== red)
    .map((f) => f.length);
  return lowOpposite.length === 2 && lowOpposite.every((n) => n >= r - 1);
}

/** The next safe automatic play to a foundation, if any. */
export function safeAutoMove(s: FreeCellState): string | null {
  if (s.result) return null;
  for (const m of legalFreeCellMoves(s)) {
    if (!m.includes('>f')) continue;
    const from = m.split('>')[0]!;
    const card =
      from[0] === 'r' ? s.cells[Number(from.slice(1))]! : top(s.columns[Number(from.slice(1))]!)!;
    if (safeHome(s, card)) return m;
  }
  return null;
}

/** Replays a game, checking every move, on one working state (linear in the game's length). */
export function replayFreeCell(seed: number, history: readonly string[]): FreeCellState {
  const s = dealFreeCell(seed);
  for (const m of history) {
    if (!isLegalFreeCellMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    shiftCards(s, m);
    s.history.push(m);
    settleResult(s);
  }
  return s;
}

export function isValidFreeCellState(data: unknown): data is FreeCellState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayFreeCell(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const homeCount = (s: FreeCellState) => s.foundations.reduce((a, f) => a + f.length, 0);
