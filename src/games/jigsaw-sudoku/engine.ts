/**
 * Jigsaw Sudoku (#107): a 9×9 sudoku whose nine regions are irregular shapes of nine cells instead
 * of 3×3 boxes; every row, column and region holds 1–9 once. Each puzzle gets its own regions (the
 * standard boxes reshaped by random swaps that keep every region connected; see
 * `../shared/sudoku/jigsaw.ts`), then clues are removed from a random solution while it stays
 * unique, graded by the techniques it needs:
 *
 * - Easy: singles only, 36 clues.
 * - Medium: singles only, 26–32 clues.
 * - Hard: needs locked candidates or pairs.
 * - Expert: needs triples, X-Wing, Y-Wing or Swordfish.
 */
import type { SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

export const JIGSAW: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 9, boxRows: 3, boxCols: 3 },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 36, maxClues: 36, jigsaw: true },
    medium: { minLevel: 1, maxLevel: 1, minClues: 26, maxClues: 32, jigsaw: true },
    hard: { minLevel: 2, maxLevel: 2, minClues: 22, maxClues: 32, jigsaw: true, attempts: 80 },
    expert: { minLevel: 3, maxLevel: 3, minClues: 20, maxClues: 32, jigsaw: true, attempts: 200 },
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
