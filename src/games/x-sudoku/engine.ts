/**
 * X-Sudoku (#105): Classic Sudoku plus the two main diagonals — every row, column, 3×3 box and
 * both diagonals hold 1–9 once. Puzzles are generated from a seed with a unique solution, graded
 * by the techniques they need (see `../shared/sudoku/logic.ts`, where the diagonals are units like
 * any other):
 *
 * - Easy: singles only, 32 clues.
 * - Medium: singles only, 22–28 clues.
 * - Hard: needs locked candidates or pairs.
 * - Expert: needs triples, X-Wing, Y-Wing or Swordfish.
 */
import type { SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

export const X_SUDOKU: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 9, boxRows: 3, boxCols: 3, diagonals: true },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 32, maxClues: 32, symmetric: true },
    medium: { minLevel: 1, maxLevel: 1, minClues: 22, maxClues: 28, symmetric: true },
    hard: { minLevel: 2, maxLevel: 2, minClues: 20, maxClues: 28, symmetric: true },
    expert: {
      minLevel: 3,
      maxLevel: 3,
      minClues: 20,
      maxClues: 28,
      symmetric: true,
      attempts: 150,
    },
  },
};

/** Cells on either main diagonal. */
export const onDiagonal = (cell: number) => {
  const r = Math.floor(cell / 9);
  const c = cell % 9;
  return r === c || r + c === 8;
};

export {
  eraseCell,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  toggleNote,
  type SudokuState,
} from '../shared/sudoku/play';
