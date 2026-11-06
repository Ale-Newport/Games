/**
 * Breakthrough on an 8×8 board: each side starts with two full rows of pawns. A pawn moves one
 * cell straight forward onto an empty cell, or one cell diagonally forward onto an empty cell or
 * an enemy pawn, which it captures (straight moves never capture). The first pawn to reach the far
 * row wins; capturing every enemy pawn wins too. A side with pawns always has a move (its most
 * advanced pawn has a free or capturable diagonal), and pawns only move forward, so the game always
 * ends and there are no draws.
 *
 * Actions: "52-44" (from-to; cells are row·8 + col, a8 top-left). White (seat 0) starts on rows
 * 7–8 of the diagram's bottom and moves up.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 8;

export interface BreakthroughState {
  /** 0 empty, 1 = seat 0 (White, moves up), 2 = seat 1 (Black, moves down). */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1; reason: 'home' | 'captured' } | null;
}

/** Row step of each color (index by color 1/2). */
export const FORWARD = [0, -1, 1] as const;

export function createBreakthroughState(): BreakthroughState {
  const board = new Array<number>(N * N).fill(0);
  for (let p = 0; p < 2 * N; p++) {
    board[p] = 2;
    board[N * N - 1 - p] = 1;
  }
  return { board, toMove: 0, history: [], result: null };
}

/** Moves of `color` on `board` as [from, to] pairs (captures included). */
export function movesOf(board: readonly number[], color: number): [number, number][] {
  const out: [number, number][] = [];
  const dr = FORWARD[color]!;
  for (let from = 0; from < N * N; from++) {
    if (board[from] !== color) continue;
    const r = Math.floor(from / N) + dr;
    if (r < 0 || r >= N) continue;
    const c = from % N;
    for (const dc of [-1, 0, 1]) {
      const cc = c + dc;
      if (cc < 0 || cc >= N) continue;
      const to = r * N + cc;
      const v = board[to];
      if (v === 0 || (dc !== 0 && v === 3 - color)) out.push([from, to]);
    }
  }
  return out;
}

export function legalBreakthroughActions(s: BreakthroughState): string[] {
  if (s.result) return [];
  return movesOf(s.board, s.toMove + 1).map(([f, t]) => `${f}-${t}`);
}

export function applyBreakthroughAction(s: BreakthroughState, a: string): BreakthroughState {
  if (s.result || !legalBreakthroughActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove + 1;
  const [from, to] = a.split('-').map(Number) as [number, number];
  const board = s.board.slice();
  board[from] = 0;
  board[to] = me;
  const toMove = (1 - s.toMove) as 0 | 1;
  const history = [...s.history, a];
  const goal = me === 1 ? 0 : N - 1;
  let result: BreakthroughState['result'] = null;
  if (Math.floor(to / N) === goal) result = { winner: s.toMove, reason: 'home' };
  else if (!board.includes(3 - me)) result = { winner: s.toMove, reason: 'captured' };
  return { board, toMove, history, result };
}

export function replayBreakthrough(history: readonly string[]): BreakthroughState {
  return history.reduce((s, a) => applyBreakthroughAction(s, a), createBreakthroughState());
}

export function isValidBreakthroughState(data: unknown): data is BreakthroughState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayBreakthrough(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
