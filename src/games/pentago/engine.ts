/**
 * Pentago: a 6×6 board made of four 3×3 quadrants. A turn places a marble on an empty cell and
 * then twists one quadrant a quarter turn (clockwise "R" or counter-clockwise "L"). Five in a row
 * (row, column or diagonal) wins; it may already exist after the placement (no twist needed). If a
 * twist completes five for both players it is a draw, as is a full board.
 *
 * Actions: "14:2R" (place on cell 14, twist quadrant 2 clockwise) or "14" (placement wins).
 * Quadrants: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export interface PentagoState {
  /** 0 empty, 1 = seat 0 (White, first), 2 = seat 1 (Black); index = row·6 + col. */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  result: { kind: 'win'; winner: 0 | 1; line: number[] } | { kind: 'draw' } | null;
}

/** All lines of five (each row/column has two, plus the diagonals of length 5 and 6). */
export const LINES5: readonly (readonly number[])[] = (() => {
  const out: number[][] = [];
  const at = (r: number, c: number) => r * 6 + c;
  for (let r = 0; r < 6; r++)
    for (let s = 0; s < 2; s++) {
      out.push([0, 1, 2, 3, 4].map((k) => at(r, s + k)));
      out.push([0, 1, 2, 3, 4].map((k) => at(s + k, r)));
    }
  for (const [r0, c0] of [
    [0, 0],
    [1, 1],
    [0, 1],
    [1, 0],
  ] as const) {
    out.push([0, 1, 2, 3, 4].map((k) => at(r0 + k, c0 + k)));
    out.push([0, 1, 2, 3, 4].map((k) => at(r0 + k, 5 - c0 - k)));
  }
  return out;
})();

export function fiveFor(board: readonly number[], color: number): number[] | null {
  for (const line of LINES5) if (line.every((p) => board[p] === color)) return [...line];
  return null;
}

/** Twists quadrant `q` a quarter turn (clockwise when `cw`). */
export function twist(board: readonly number[], q: number, cw: boolean): number[] {
  const out = board.slice();
  const r0 = q < 2 ? 0 : 3;
  const c0 = q % 2 === 0 ? 0 : 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      // Clockwise: (r, c) → (c, 2 − r).
      const [nr, nc] = cw ? [c, 2 - r] : [2 - c, r];
      out[(r0 + nr) * 6 + c0 + nc] = board[(r0 + r) * 6 + c0 + c]!;
    }
  return out;
}

export function createPentagoState(): PentagoState {
  return { board: new Array<number>(36).fill(0), toMove: 0, history: [], result: null };
}

const TWISTS = ['0R', '0L', '1R', '1L', '2R', '2L', '3R', '3L'];

export function legalPentagoActions(s: PentagoState): string[] {
  if (s.result) return [];
  const color = s.toMove + 1;
  const out: string[] = [];
  s.board.forEach((v, p) => {
    if (v !== 0) return;
    const placed = s.board.slice();
    placed[p] = color;
    if (fiveFor(placed, color)) out.push(String(p));
    else for (const t of TWISTS) out.push(`${p}:${t}`);
  });
  return out;
}

export function applyPentagoAction(s: PentagoState, a: string): PentagoState {
  if (s.result || !legalPentagoActions(s).includes(a))
    throw new IllegalActionError(`Illegal Pentago action ${a}`);
  const [cellText, tw] = a.split(':');
  const color = s.toMove + 1;
  let board = s.board.slice();
  board[Number(cellText)] = color;
  let result: PentagoState['result'] = null;
  const early = fiveFor(board, color);
  if (early) result = { kind: 'win', winner: s.toMove, line: early };
  else {
    board = twist(board, Number(tw![0]), tw![1] === 'R');
    const mine = fiveFor(board, color);
    const theirs = fiveFor(board, 3 - color);
    if (mine && theirs) result = { kind: 'draw' };
    else if (mine) result = { kind: 'win', winner: s.toMove, line: mine };
    else if (theirs) result = { kind: 'win', winner: (1 - s.toMove) as 0 | 1, line: theirs };
    else if (board.every((v) => v !== 0)) result = { kind: 'draw' };
  }
  return { board, toMove: (1 - s.toMove) as 0 | 1, history: [...s.history, a], result };
}

export function replayPentago(history: readonly string[]): PentagoState {
  return history.reduce((s, a) => applyPentagoAction(s, a), createPentagoState());
}

export function isValidPentagoState(data: unknown): data is PentagoState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayPentago(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
