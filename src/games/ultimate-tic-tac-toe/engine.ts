/** Pure rules engine for Ultimate Tic-Tac-Toe (ruleset `ultimate-standard`, see GAME_SPEC.md). */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export type Seat = 0 | 1;
/** 0 empty, 1 X, 2 O. */
export type Mark = 0 | 1 | 2;
/** 0 open, 1 won by X, 2 won by O, 3 drawn. */
export type BoardStatus = 0 | 1 | 2 | 3;

export type UtttResult =
  | { kind: 'win'; winner: Seat; line: number[]; reason: 'global-line' }
  | { kind: 'draw'; reason: 'all-boards-closed' };

export interface UtttState {
  /** 81 cells; index = board * 9 + cell. */
  cells: Mark[];
  boards: BoardStatus[];
  /** Board the mover must play in, or -1 for free choice. */
  forced: number;
  toMove: Seat;
  firstPlayer: Seat;
  history: number[];
  result: UtttResult | null;
}

/** The 8 lines of a 3×3 grid. */
export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const LINES_THROUGH: readonly (readonly (readonly [number, number, number])[])[] = Array.from(
  { length: 9 },
  (_, i) => LINES.filter((l) => l.includes(i)),
);

export const boardOf = (index: number) => Math.floor(index / 9);
export const cellOf = (index: number) => index % 9;
export const markOf = (seat: Seat): Mark => (seat === 0 ? 1 : 2);
export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/** Converts between action indices and the 9×9 visual grid (row, col). */
export function indexToGrid(index: number): [row: number, col: number] {
  const b = boardOf(index);
  const c = cellOf(index);
  return [Math.floor(b / 3) * 3 + Math.floor(c / 3), (b % 3) * 3 + (c % 3)];
}

export function gridToIndex(row: number, col: number): number {
  return (Math.floor(row / 3) * 3 + Math.floor(col / 3)) * 9 + (row % 3) * 3 + (col % 3);
}

export function createState(firstPlayer: Seat = 0): UtttState {
  return {
    cells: new Array<Mark>(81).fill(0),
    boards: new Array<BoardStatus>(9).fill(0),
    forced: -1,
    toMove: firstPlayer,
    firstPlayer,
    history: [],
    result: null,
  };
}

export function playableBoards(s: UtttState): number[] {
  if (s.result) return [];
  if (s.forced >= 0) return [s.forced];
  const open: number[] = [];
  for (let b = 0; b < 9; b++) if (s.boards[b] === 0) open.push(b);
  return open;
}

export function legalMoves(s: UtttState): number[] {
  const moves: number[] = [];
  for (const b of playableBoards(s)) {
    for (let c = 0; c < 9; c++) if (s.cells[b * 9 + c] === 0) moves.push(b * 9 + c);
  }
  return moves;
}

export function isLegal(s: UtttState, index: number): boolean {
  if (s.result || !Number.isInteger(index) || index < 0 || index > 80) return false;
  const b = boardOf(index);
  return s.cells[index] === 0 && s.boards[b] === 0 && (s.forced < 0 || s.forced === b);
}

function lineThrough(
  values: ArrayLike<number>,
  offset: number,
  pos: number,
  mark: number,
): number[] | null {
  for (const line of LINES_THROUGH[pos]!) {
    if (
      values[offset + line[0]] === mark &&
      values[offset + line[1]] === mark &&
      values[offset + line[2]] === mark
    )
      return [...line];
  }
  return null;
}

export function play(s: UtttState, index: number): UtttState {
  if (!isLegal(s, index)) {
    throw new IllegalActionError(s.result ? 'The game is over' : `Move ${index} is not legal here`);
  }
  const mover = s.toMove;
  const mark = markOf(mover);
  const cells = s.cells.slice();
  const boards = s.boards.slice();
  cells[index] = mark;
  const b = boardOf(index);
  let result: UtttResult | null = null;
  if (lineThrough(cells, b * 9, cellOf(index), mark)) {
    boards[b] = mark;
    const global = lineThrough(boards, 0, b, mark);
    if (global) result = { kind: 'win', winner: mover, line: global, reason: 'global-line' };
  } else {
    let full = true;
    for (let c = 0; c < 9; c++) if (cells[b * 9 + c] === 0) full = false;
    if (full) boards[b] = 3;
  }
  if (!result && boards.every((status) => status !== 0))
    result = { kind: 'draw', reason: 'all-boards-closed' };
  const target = cellOf(index);
  const forced = result ? -1 : boards[target] === 0 ? target : -1;
  return {
    cells,
    boards,
    forced,
    toMove: other(mover),
    firstPlayer: s.firstPlayer,
    history: [...s.history, index],
    result,
  };
}

export function replay(history: readonly number[], firstPlayer: Seat = 0): UtttState {
  let s = createState(firstPlayer);
  for (const index of history) s = play(s, index);
  return s;
}

export function undo(s: UtttState, count: number): UtttState {
  return replay(s.history.slice(0, Math.max(0, s.history.length - count)), s.firstPlayer);
}

/** Local boards won by each seat. */
export function boardsWon(s: UtttState): [number, number] {
  return [s.boards.filter((b) => b === 1).length, s.boards.filter((b) => b === 2).length];
}

export function isValidState(data: unknown): data is UtttState {
  if (
    !isRecord(data) ||
    !Array.isArray(data.history) ||
    (data.firstPlayer !== 0 && data.firstPlayer !== 1)
  )
    return false;
  try {
    const rebuilt = replay(data.history as number[], data.firstPlayer);
    const { cells, boards, forced, toMove, firstPlayer, history, result } =
      data as unknown as UtttState;
    return (
      JSON.stringify(rebuilt) ===
      JSON.stringify({ cells, boards, forced, toMove, firstPlayer, history, result })
    );
  } catch {
    return false;
  }
}
