/**
 * Mini Sudoku 4×4 (#102): fill the grid so every row, column and 2×2 box holds 1–4 once. A first
 * sudoku for children and beginners. Puzzles are generated from a seed with a unique solution;
 * all need singles only, so the difficulty is the number of clues:
 *
 * - Easy: 8 clues.
 * - Medium: 6 clues.
 * - Hard: 4–5 clues (four is the fewest any 4×4 sudoku can have).
 */
import type { SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

export const SUDOKU_4: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 4, boxRows: 2, boxCols: 2 },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 8, maxClues: 8 },
    medium: { minLevel: 1, maxLevel: 1, minClues: 6, maxClues: 6 },
    hard: { minLevel: 1, maxLevel: 1, minClues: 4, maxClues: 5 },
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
