/**
 * Sudoku 16×16 (#104): fill the grid so every row, column and 4×4 box holds the sixteen symbols
 * 1–9 and A–G (10–16) once. Puzzles are generated from a seed with a unique solution, graded by the
 * techniques they need (see `../shared/sudoku/logic.ts`):
 *
 * - Easy: singles only, 130 clues.
 * - Medium: singles only, 100–116 clues.
 * - Hard: needs locked candidates or pairs (or harder), at most 116 clues.
 *
 * Uniqueness checks run with a search budget (a check that runs out keeps the clue), which keeps
 * generation under half a second on this grid.
 */
import type { SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

const BUDGET = 200;

export const SUDOKU_16: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 16, boxRows: 4, boxCols: 4 },
  difficulties: {
    easy: {
      minLevel: 1,
      maxLevel: 1,
      minClues: 130,
      maxClues: 130,
      symmetric: true,
      maxNodes: BUDGET,
    },
    medium: {
      minLevel: 1,
      maxLevel: 1,
      minClues: 100,
      maxClues: 116,
      symmetric: true,
      attempts: 6,
      maxNodes: BUDGET,
    },
    hard: {
      minLevel: 2,
      maxLevel: 3,
      minClues: 90,
      maxClues: 116,
      symmetric: true,
      attempts: 6,
      maxNodes: BUDGET,
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
