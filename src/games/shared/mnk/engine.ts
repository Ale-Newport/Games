/**
 * Rules engine for m,n,k-games: players alternately claim empty cells on an m×n board; the first
 * to form k (or more) in a straight line wins — or loses, in misère play. Used by Tic-Tac-Toe
 * (#001), Tic-Tac-Toe 4×4 (#002) and Misère Tic-Tac-Toe (#004). Pure and immutable.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { LINE_DIRECTIONS, inBounds, toIndex, toRowCol } from '../../../core/game-engine/grid';

export interface MnkRules {
  rows: number;
  cols: number;
  k: number;
  /** Completing a line loses instead of winning. */
  misere?: boolean;
}

/** 0 = empty, 1 = seat 0 (X), 2 = seat 1 (O). */
export type Cell = 0 | 1 | 2;
export type Seat = 0 | 1;

export type MnkResult =
  | { kind: 'win'; winner: Seat; line: number[]; reason: 'line' | 'misere-line' }
  | { kind: 'draw'; reason: 'board-full' };

export interface MnkState {
  board: Cell[];
  toMove: Seat;
  firstPlayer: Seat;
  /** Cells claimed, in order. The board is always reproducible from history + firstPlayer. */
  history: number[];
  result: MnkResult | null;
}

export const markOf = (seat: Seat): Cell => (seat === 0 ? 1 : 2);
export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

export function createMnkState(rules: MnkRules, firstPlayer: Seat = 0): MnkState {
  return {
    board: new Array<Cell>(rules.rows * rules.cols).fill(0),
    toMove: firstPlayer,
    firstPlayer,
    history: [],
    result: null,
  };
}

export function legalCells(rules: MnkRules, state: MnkState): number[] {
  if (state.result) return [];
  const cells: number[] = [];
  for (let i = 0; i < rules.rows * rules.cols; i++) if (state.board[i] === 0) cells.push(i);
  return cells;
}

export function isLegalCell(rules: MnkRules, state: MnkState, cell: number): boolean {
  return (
    !state.result &&
    Number.isInteger(cell) &&
    cell >= 0 &&
    cell < rules.rows * rules.cols &&
    state.board[cell] === 0
  );
}

/** The maximal straight run of `cell`'s mark through `cell` that has length ≥ k, if any. */
export function lineThrough(
  rules: MnkRules,
  board: readonly Cell[],
  cell: number,
): number[] | null {
  const mark = board[cell];
  if (!mark) return null;
  const size = { rows: rules.rows, cols: rules.cols };
  const [row, col] = toRowCol(cell, rules.cols);
  for (const [dr, dc] of LINE_DIRECTIONS) {
    const run = [cell];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (inBounds(r, c, size) && board[toIndex(r, c, rules.cols)] === mark) {
        run.push(toIndex(r, c, rules.cols));
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (run.length >= rules.k) return run.sort((a, b) => a - b);
  }
  return null;
}

export function playCell(rules: MnkRules, state: MnkState, cell: number): MnkState {
  if (!isLegalCell(rules, state, cell)) {
    throw new IllegalActionError(
      state.result ? 'The game is over' : `Cell ${cell} is not available`,
    );
  }
  const board = state.board.slice();
  const mover = state.toMove;
  board[cell] = markOf(mover);
  const history = [...state.history, cell];
  const line = lineThrough(rules, board, cell);
  let result: MnkResult | null = null;
  if (line) {
    result = rules.misere
      ? { kind: 'win', winner: other(mover), line, reason: 'misere-line' }
      : { kind: 'win', winner: mover, line, reason: 'line' };
  } else if (history.length === board.length) {
    result = { kind: 'draw', reason: 'board-full' };
  }
  return { board, toMove: other(mover), firstPlayer: state.firstPlayer, history, result };
}

export function stateFromHistory(
  rules: MnkRules,
  history: readonly number[],
  firstPlayer: Seat = 0,
): MnkState {
  let state = createMnkState(rules, firstPlayer);
  for (const cell of history) state = playCell(rules, state, cell);
  return state;
}

/** Removes the last `count` moves (clamped to the history length). */
export function undoMoves(rules: MnkRules, state: MnkState, count: number): MnkState {
  const keep = Math.max(0, state.history.length - count);
  return stateFromHistory(rules, state.history.slice(0, keep), state.firstPlayer);
}

/** Empty cells where `seat` would immediately complete a line (ignores whose turn it is). */
export function completingCells(rules: MnkRules, state: MnkState, seat: Seat): number[] {
  if (state.result) return [];
  const cells: number[] = [];
  const mark = markOf(seat);
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 0) continue;
    const board = state.board.slice();
    board[i] = mark;
    if (lineThrough(rules, board, i)) cells.push(i);
  }
  return cells;
}

/** Structural validation for untrusted data (saves, deserialization). */
export function isValidMnkState(rules: MnkRules, data: unknown): data is MnkState {
  if (typeof data !== 'object' || data === null) return false;
  const s = data as Partial<MnkState>;
  if (!Array.isArray(s.history) || (s.firstPlayer !== 0 && s.firstPlayer !== 1)) return false;
  try {
    const rebuilt = stateFromHistory(rules, s.history, s.firstPlayer);
    return (
      JSON.stringify(rebuilt) ===
      JSON.stringify({
        board: s.board,
        toMove: s.toMove,
        firstPlayer: s.firstPlayer,
        history: s.history,
        result: s.result,
      })
    );
  } catch {
    return false;
  }
}
