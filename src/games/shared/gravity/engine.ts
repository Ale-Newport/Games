/**
 * Rules engine for gravity line games: players drop discs into columns; a disc falls to the lowest
 * empty cell; the first to line up k discs (horizontally, vertically or diagonally) wins; a full
 * board is a draw. Used by Four in a Row (#005, 7×6, k = 4) and Connect Five Gravity (#006, 9×7,
 * k = 5). Pure and immutable. Row 0 is the top row.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { lineThrough, type Cell } from '../mnk/engine';

export type { Cell } from '../mnk/engine';
export type Seat = 0 | 1;

export interface GravityRules {
  rows: number;
  cols: number;
  k: number;
}

export type GravityResult =
  | { kind: 'win'; winner: Seat; line: number[]; reason: 'line' }
  | { kind: 'draw'; reason: 'board-full' };

export interface GravityState {
  board: Cell[];
  /** Discs in each column. */
  heights: number[];
  toMove: Seat;
  firstPlayer: Seat;
  /** Columns played, in order. */
  history: number[];
  result: GravityResult | null;
}

export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

export function createGravityState(rules: GravityRules, firstPlayer: Seat = 0): GravityState {
  return {
    board: new Array<Cell>(rules.rows * rules.cols).fill(0),
    heights: new Array<number>(rules.cols).fill(0),
    toMove: firstPlayer,
    firstPlayer,
    history: [],
    result: null,
  };
}

export function legalColumns(rules: GravityRules, s: GravityState): number[] {
  if (s.result) return [];
  const cols: number[] = [];
  for (let c = 0; c < rules.cols; c++) if (s.heights[c]! < rules.rows) cols.push(c);
  return cols;
}

export function isLegalColumn(rules: GravityRules, s: GravityState, col: number): boolean {
  return (
    !s.result &&
    Number.isInteger(col) &&
    col >= 0 &&
    col < rules.cols &&
    s.heights[col]! < rules.rows
  );
}

/** Board index where a disc dropped in `col` would land, or -1 if the column is full. */
export function landingIndex(rules: GravityRules, s: GravityState, col: number): number {
  const h = s.heights[col]!;
  return h >= rules.rows ? -1 : (rules.rows - 1 - h) * rules.cols + col;
}

export function dropDisc(rules: GravityRules, s: GravityState, col: number): GravityState {
  if (!isLegalColumn(rules, s, col))
    throw new IllegalActionError(s.result ? 'The game is over' : `Column ${col} is not playable`);
  const index = landingIndex(rules, s, col);
  const board = s.board.slice();
  const heights = s.heights.slice();
  const mover = s.toMove;
  board[index] = mover === 0 ? 1 : 2;
  heights[col]!++;
  const history = [...s.history, col];
  const line = lineThrough(rules, board, index);
  let result: GravityResult | null = null;
  if (line) result = { kind: 'win', winner: mover, line, reason: 'line' };
  else if (history.length === rules.rows * rules.cols)
    result = { kind: 'draw', reason: 'board-full' };
  return { board, heights, toMove: other(mover), firstPlayer: s.firstPlayer, history, result };
}

export function gravityFromHistory(
  rules: GravityRules,
  history: readonly number[],
  firstPlayer: Seat = 0,
): GravityState {
  let s = createGravityState(rules, firstPlayer);
  for (const col of history) s = dropDisc(rules, s, col);
  return s;
}

export function undoDrops(rules: GravityRules, s: GravityState, count: number): GravityState {
  return gravityFromHistory(
    rules,
    s.history.slice(0, Math.max(0, s.history.length - count)),
    s.firstPlayer,
  );
}

/** Index of the disc placed by the last move (or -1). */
export function lastDropIndex(rules: GravityRules, s: GravityState): number {
  const col = s.history[s.history.length - 1];
  if (col === undefined) return -1;
  return (rules.rows - s.heights[col]!) * rules.cols + col;
}

export function isValidGravityState(rules: GravityRules, data: unknown): data is GravityState {
  if (
    !isRecord(data) ||
    !Array.isArray(data.history) ||
    (data.firstPlayer !== 0 && data.firstPlayer !== 1)
  )
    return false;
  try {
    const rebuilt = gravityFromHistory(rules, data.history as number[], data.firstPlayer);
    const { board, heights, toMove, firstPlayer, history, result } =
      data as unknown as GravityState;
    return (
      JSON.stringify(rebuilt) ===
      JSON.stringify({ board, heights, toMove, firstPlayer, history, result })
    );
  } catch {
    return false;
  }
}
