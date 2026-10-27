/**
 * Sudoku 6×6 (#103): fill the grid so every row, column and 2×3 box holds 1–6 once. Puzzles are
 * generated from a seed with a unique solution, graded by the techniques they need (see
 * `../shared/sudoku/logic.ts`):
 *
 * - Easy: singles only, 14 clues.
 * - Medium: singles only, 9–12 clues.
 * - Hard: needs locked candidates, pairs or harder.
 */
import type { SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

export const SUDOKU_6: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 6, boxRows: 2, boxCols: 3 },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 14, maxClues: 14 },
    medium: { minLevel: 1, maxLevel: 1, minClues: 9, maxClues: 12 },
    hard: { minLevel: 2, maxLevel: 3, minClues: 8, maxClues: 12, attempts: 500 },
  },
};

export {
  eraseCell,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  toggleNote,
  type SudokuState,
} from '../shared/sudoku/play';
