/** Shared helpers for rectangular grids stored as flat row-major arrays. */

export interface GridSize {
  rows: number;
  cols: number;
}

export const toIndex = (row: number, col: number, cols: number): number => row * cols + col;

export const toRowCol = (index: number, cols: number): [row: number, col: number] => [
  Math.floor(index / cols),
  index % cols,
];

export const inBounds = (row: number, col: number, size: GridSize): boolean =>
  row >= 0 && row < size.rows && col >= 0 && col < size.cols;

/** The four line directions (E, S, SE, SW) used by line-of-k detection. */
export const LINE_DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/** Every straight line of exactly `length` cells in the grid, as index lists. */
export function allLines(size: GridSize, length: number): number[][] {
  const lines: number[][] = [];
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      for (const [dr, dc] of LINE_DIRECTIONS) {
        const endRow = row + dr * (length - 1);
        const endCol = col + dc * (length - 1);
        if (!inBounds(endRow, endCol, size)) continue;
        const line: number[] = [];
        for (let step = 0; step < length; step++) {
          line.push(toIndex(row + dr * step, col + dc * step, size.cols));
        }
        lines.push(line);
      }
    }
  }
  return lines;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Moves a cursor within a grid; clamps at edges unless `wrap` is set. */
export function moveCursor(
  index: number,
  direction: Direction,
  size: GridSize,
  wrap = false,
): number {
  let [row, col] = toRowCol(index, size.cols);
  if (direction === 'up') row -= 1;
  if (direction === 'down') row += 1;
  if (direction === 'left') col -= 1;
  if (direction === 'right') col += 1;
  if (wrap) {
    row = (row + size.rows) % size.rows;
    col = (col + size.cols) % size.cols;
  } else {
    row = Math.min(Math.max(row, 0), size.rows - 1);
    col = Math.min(Math.max(col, 0), size.cols - 1);
  }
  return toIndex(row, col, size.cols);
}
