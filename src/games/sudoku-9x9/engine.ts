/**
 * Classic Sudoku 9×9 (#101): fill the grid so every row, column and 3×3 box holds 1–9 once.
 * Puzzles are generated from a seed with a unique solution, graded by the techniques they need
 * (see `../shared/sudoku/logic.ts`):
 *
 * - Easy: singles only, 36+ clues.
 * - Medium: singles only, 26–32 clues.
 * - Hard: needs locked candidates or pairs.
 * - Expert: needs triples, X-Wing, Y-Wing or Swordfish.
 */
import type { SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

export const SUDOKU_9: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 9, boxRows: 3, boxCols: 3 },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 36, maxClues: 40, symmetric: true },
    medium: { minLevel: 1, maxLevel: 1, minClues: 26, maxClues: 32, symmetric: true },
    hard: { minLevel: 2, maxLevel: 2, minClues: 22, maxClues: 32, symmetric: true },
    expert: {
      minLevel: 3,
      maxLevel: 3,
      minClues: 20,
      maxClues: 32,
      symmetric: true,
      attempts: 150,
    },
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
