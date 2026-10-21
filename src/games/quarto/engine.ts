/**
 * Quarto: 16 distinct pieces (4 binary traits: tall, dark, square, hollow) on a 4×4 board. Each
 * turn a player places the piece the opponent chose, then chooses the next piece for the opponent.
 * A line of four (row, column or diagonal) sharing at least one trait wins for the player who
 * completes it; a full board without such a line is a draw.
 *
 * Actions: the opening move is "give:7"; afterwards "5:give:12" (place on cell 5, give piece 12),
 * or just "5" when that placement wins or is the last one (nothing is given then).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const TRAITS = ['tall', 'dark', 'square', 'hollow'] as const;

export interface QuartoState {
  /** Piece id 0–15 per cell, or −1 when empty. */
  board: number[];
  /** Piece the player to move must place (−1 on the opening move). */
  inHand: number;
  toMove: 0 | 1;
  history: string[];
  result: { kind: 'win'; winner: 0 | 1; line: number[] } | { kind: 'draw' } | null;
}

export const LINES: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

/** The winning line through `board`, if any (four pieces sharing a trait). */
export function winningLine(board: readonly number[]): number[] | null {
  for (const line of LINES) {
    const pieces = line.map((c) => board[c]!);
    if (pieces.some((p) => p < 0)) continue;
    const all = pieces.reduce((a, p) => a & p, 15);
    const none = pieces.reduce((a, p) => a | p, 0);
    if (all !== 0 || none !== 15) return [...line];
  }
  return null;
}

export function createQuartoState(): QuartoState {
  return {
    board: new Array<number>(16).fill(-1),
    inHand: -1,
    toMove: 0,
    history: [],
    result: null,
  };
}

/** Pieces not yet on the board and not in hand. */
export function available(s: QuartoState): number[] {
  const used = new Set(s.board.filter((p) => p >= 0));
  if (s.inHand >= 0) used.add(s.inHand);
  return Array.from({ length: 16 }, (_, i) => i).filter((p) => !used.has(p));
}

export function legalQuartoActions(s: QuartoState): string[] {
  if (s.result) return [];
  const pool = available(s);
  if (s.inHand < 0) return pool.map((p) => `give:${p}`);
  const out: string[] = [];
  const board = s.board.slice();
  s.board.forEach((v, c) => {
    if (v >= 0) return;
    board[c] = s.inHand;
    // A winning or final placement ends the game: there is nothing left to give.
    if (pool.length === 0 || winningLine(board)) out.push(String(c));
    else for (const p of pool) out.push(`${c}:give:${p}`);
    board[c] = -1;
  });
  return out;
}

export function parseAction(a: string): { cell: number; give: number } | null {
  const m = /^(?:(\d{1,2})(?::give:(\d{1,2}))?|give:(\d{1,2}))$/.exec(a);
  if (!m) return null;
  if (m[3] !== undefined) return { cell: -1, give: Number(m[3]) };
  return { cell: Number(m[1]), give: m[2] === undefined ? -1 : Number(m[2]) };
}

export function applyQuartoAction(s: QuartoState, a: string): QuartoState {
  if (s.result || !legalQuartoActions(s).includes(a))
    throw new IllegalActionError(`Illegal Quarto action ${a}`);
  const { cell, give } = parseAction(a)!;
  const board = s.board.slice();
  let result: QuartoState['result'] = null;
  if (cell >= 0) {
    board[cell] = s.inHand;
    const line = winningLine(board);
    if (line) result = { kind: 'win', winner: s.toMove, line };
    else if (board.every((p) => p >= 0)) result = { kind: 'draw' };
  }
  return {
    board,
    inHand: give,
    toMove: (1 - s.toMove) as 0 | 1,
    history: [...s.history, a],
    result,
  };
}

export function replayQuarto(history: readonly string[]): QuartoState {
  return history.reduce((s, a) => applyQuartoAction(s, a), createQuartoState());
}

export function isValidQuartoState(data: unknown): data is QuartoState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayQuarto(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
