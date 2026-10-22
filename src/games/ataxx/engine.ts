/**
 * Ataxx on a 7×7 board: each turn a piece either clones to an adjacent empty cell (a new piece
 * appears, the original stays) or jumps two cells away (the piece leaves its origin). Every
 * opponent piece around the destination converts. A player without a move passes; the game ends
 * when the board is full, a side has no pieces, neither can move, or after 400 plies, and the side
 * with more pieces wins (equal counts draw). Threefold repetition is a draw.
 *
 * Actions: "+24" (clone onto cell 24 from any adjacent own piece), "8-24" (jump from 8 to 24) or
 * "pass" (only when there is no other move).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 7;
export const PLY_LIMIT = 400;

export interface AtaxxState {
  /** 0 empty, 1 = seat 0 (Red, first), 2 = seat 1 (Blue). */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  keys: string[];
  result:
    | { kind: 'win'; winner: 0 | 1; counts: [number, number] }
    | { kind: 'draw'; counts: [number, number]; reason: 'equal' | 'repetition' }
    | null;
}

const cells = N * N;
const rc = (p: number) => [Math.floor(p / N), p % N] as const;

/** Cells at Chebyshev distance 1 and exactly 2. */
export const RING1: readonly number[][] = [];
export const RING2: readonly number[][] = [];
for (let p = 0; p < cells; p++) {
  const [r, c] = rc(p);
  const one: number[] = [];
  const two: number[] = [];
  for (let dr = -2; dr <= 2; dr++)
    for (let dc = -2; dc <= 2; dc++) {
      const d = Math.max(Math.abs(dr), Math.abs(dc));
      const rr = r + dr;
      const cc = c + dc;
      if (d === 0 || rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
      (d === 1 ? one : two).push(rr * N + cc);
    }
  (RING1 as number[][]).push(one);
  (RING2 as number[][]).push(two);
}

const keyOf = (board: readonly number[], toMove: number) => `${board.join('')}|${toMove}`;

export function createAtaxxState(): AtaxxState {
  const board = new Array<number>(cells).fill(0);
  board[0] = 1;
  board[cells - 1] = 1;
  board[N - 1] = 2;
  board[cells - N] = 2;
  return { board, toMove: 0, history: [], keys: [keyOf(board, 0)], result: null };
}

function movesFor(board: readonly number[], color: number): string[] {
  const out: string[] = [];
  for (let to = 0; to < cells; to++) {
    if (board[to] !== 0) continue;
    if (RING1[to]!.some((p) => board[p] === color)) out.push(`+${to}`);
    for (const from of RING2[to]!) if (board[from] === color) out.push(`${from}-${to}`);
  }
  return out;
}

export function legalAtaxxActions(s: AtaxxState): string[] {
  if (s.result) return [];
  const moves = movesFor(s.board, s.toMove + 1);
  return moves.length ? moves : ['pass'];
}

export const countsOf = (board: readonly number[]): [number, number] => [
  board.filter((v) => v === 1).length,
  board.filter((v) => v === 2).length,
];

export function applyAtaxxAction(s: AtaxxState, a: string): AtaxxState {
  if (s.result || !legalAtaxxActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove + 1;
  const board = s.board.slice();
  if (a !== 'pass') {
    const to = Number(a.startsWith('+') ? a.slice(1) : a.split('-')[1]);
    if (!a.startsWith('+')) board[Number(a.split('-')[0])] = 0;
    board[to] = me;
    for (const q of RING1[to]!) if (board[q] === 3 - me) board[q] = me;
  }
  const toMove = (1 - s.toMove) as 0 | 1;
  const keys = [...s.keys, keyOf(board, toMove)];
  const history = [...s.history, a];
  const counts = countsOf(board);
  const over =
    counts[0] === 0 ||
    counts[1] === 0 ||
    counts[0] + counts[1] === cells ||
    (movesFor(board, 1).length === 0 && movesFor(board, 2).length === 0) ||
    history.length >= PLY_LIMIT;
  let result: AtaxxState['result'] = null;
  if (over)
    result =
      counts[0] === counts[1]
        ? { kind: 'draw', counts, reason: 'equal' }
        : { kind: 'win', winner: counts[0] > counts[1] ? 0 : 1, counts };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    result = { kind: 'draw', counts, reason: 'repetition' };
  return { board, toMove, history, keys, result };
}

export function replayAtaxx(history: readonly string[]): AtaxxState {
  return history.reduce((s, a) => applyAtaxxAction(s, a), createAtaxxState());
}

export function isValidAtaxxState(data: unknown): data is AtaxxState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayAtaxx(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
