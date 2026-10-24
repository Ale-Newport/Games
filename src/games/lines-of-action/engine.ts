/**
 * Lines of Action on an 8 × 8 board. Black (seat 0) starts with twelve pieces on the top and bottom
 * rows (corners empty) and moves first; White has twelve on the left and right columns.
 *
 * A piece moves in a straight line (orthogonal or diagonal) exactly as many squares as there are
 * pieces of either color on that whole line. It may pass over its own pieces but not the
 * opponent's, and may land on an opponent's piece (capturing it) but not on its own.
 *
 * You win when all your pieces form one group (connected orthogonally or diagonally). If a move
 * connects both sides, the mover wins. A player with no legal move loses; after 300 plies the game
 * is a draw. Cells: index = y·8 + x, y = 0 the top row (rank 8). Actions: "from-to".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 8;
export const PLY_LIMIT = 300;

export interface LoaState {
  /** 0 empty, 1 Black, 2 White. */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 | null; reason: 'connected' | 'stuck' | 'limit' } | null;
}

const DX = [1, -1, 0, 0, 1, -1, 1, -1];
const DY = [0, 0, 1, -1, 1, -1, -1, 1];

export const cellName = (c: number) => `${'abcdefgh'[c % N]}${N - Math.floor(c / N)}`;

export function createLoaState(): LoaState {
  const board = new Array<number>(N * N).fill(0);
  for (let i = 1; i < N - 1; i++) {
    board[i] = 1;
    board[(N - 1) * N + i] = 1;
    board[i * N] = 2;
    board[i * N + N - 1] = 2;
  }
  return { board, toMove: 0, history: [], result: null };
}

/** Pieces on the whole line through (x, y) along direction (dx, dy), both ways. */
function lineCount(board: ArrayLike<number>, x0: number, y0: number, dx: number, dy: number) {
  let n = 1;
  for (const s of [1, -1]) {
    let x = x0 + s * dx;
    let y = y0 + s * dy;
    while (x >= 0 && x < N && y >= 0 && y < N) {
      if (board[y * N + x] !== 0) n++;
      x += s * dx;
      y += s * dy;
    }
  }
  return n;
}

/** Destinations of the piece on `from` (whatever its color). */
export function loaTargets(board: ArrayLike<number>, from: number, out: number[] = []): number[] {
  const me = board[from]!;
  const x0 = from % N;
  const y0 = (from - x0) / N;
  for (let d = 0; d < 8; d++) {
    const dist = lineCount(board, x0, y0, DX[d]!, DY[d]!);
    const tx = x0 + DX[d]! * dist;
    const ty = y0 + DY[d]! * dist;
    if (tx < 0 || tx >= N || ty < 0 || ty >= N) continue;
    let blocked = false;
    for (let k = 1; k < dist; k++) {
      const v = board[(y0 + DY[d]! * k) * N + x0 + DX[d]! * k];
      if (v !== 0 && v !== me) {
        blocked = true;
        break;
      }
    }
    if (blocked || board[ty * N + tx] === me) continue;
    out.push(ty * N + tx);
  }
  return out;
}

export const parseMove = (a: string) => a.split('-').map(Number) as [number, number];

export function legalLoaActions(s: LoaState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.board.forEach((x, c) => {
    if (x === s.toMove + 1) for (const t of loaTargets(s.board, c)) out.push(`${c}-${t}`);
  });
  return out;
}

/** Number of 8-connected groups of `seat`'s pieces. */
export function groups(board: ArrayLike<number>, seat: 0 | 1): number {
  const me = seat + 1;
  const seen = new Uint8Array(N * N);
  const stack: number[] = [];
  let count = 0;
  for (let c = 0; c < N * N; c++) {
    if (board[c] !== me || seen[c]) continue;
    count++;
    seen[c] = 1;
    stack.push(c);
    while (stack.length) {
      const p = stack.pop()!;
      const px = p % N;
      const py = (p - px) / N;
      for (let d = 0; d < 8; d++) {
        const x = px + DX[d]!;
        const y = py + DY[d]!;
        const q = y * N + x;
        if (x < 0 || x >= N || y < 0 || y >= N || seen[q] || board[q] !== me) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
  }
  return count;
}

export function applyLoaAction(s: LoaState, a: string): LoaState {
  if (s.result || typeof a !== 'string' || !/^\d+-\d+$/.test(a))
    throw new IllegalActionError(`Illegal move ${String(a)}`);
  const [f, t] = parseMove(a);
  if (s.board[f] !== s.toMove + 1 || !loaTargets(s.board, f).includes(t))
    throw new IllegalActionError(`Illegal move ${a}`);
  const board = s.board.slice();
  board[t] = board[f]!;
  board[f] = 0;
  const me = s.toMove;
  const opp = (1 - me) as 0 | 1;
  const next: LoaState = { board, toMove: opp, history: [...s.history, a], result: null };
  if (groups(board, me) === 1) next.result = { winner: me, reason: 'connected' };
  else if (groups(board, opp) === 1) next.result = { winner: opp, reason: 'connected' };
  else if (legalLoaActions(next).length === 0) next.result = { winner: me, reason: 'stuck' };
  else if (next.history.length >= PLY_LIMIT) next.result = { winner: null, reason: 'limit' };
  return next;
}

export function replayLoa(history: readonly string[]): LoaState {
  return history.reduce((s, a) => applyLoaAction(s, a), createLoaState());
}

export function isValidLoaState(data: unknown): data is LoaState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayLoa(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
