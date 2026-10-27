/**
 * Killer Sudoku (#106): a 9×9 sudoku with no given digits. Instead the grid is split into cages
 * (dashed outlines), each showing the sum of its digits; digits never repeat inside a cage. Cages
 * are drawn over a random solution and split where a second solution differs until the puzzle has
 * exactly one solution (see `../shared/sudoku/killer.ts`); a puzzle is kept when the technique
 * solver — singles, cage combinations, the 45 rule and the classic techniques — solves it at the
 * difficulty's level:
 *
 * - Easy: cages of 2–3 cells, solved with singles and cage combinations.
 * - Medium: cages of 2–4 cells, may need the 45 rule or pairs.
 * - Hard: cages of 3–6 cells, needs the 45 rule or harder.
 */
import { cageIndex, type Cage } from '../shared/sudoku/killer';
import type { SudokuState, SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

export const KILLER: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 9, boxRows: 3, boxCols: 3 },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 0, maxClues: 0, cages: { min: 2, max: 3 } },
    medium: {
      minLevel: 1,
      maxLevel: 2,
      minClues: 0,
      maxClues: 0,
      cages: { min: 2, max: 4 },
      attempts: 40,
    },
    hard: {
      minLevel: 2,
      maxLevel: 3,
      minClues: 0,
      maxClues: 0,
      cages: { min: 3, max: 6 },
      attempts: 60,
    },
  },
};

/** Cages whose digits repeat or whose sum is already wrong (or overshot). */
export function badCages(s: SudokuState): Set<number> {
  const out = new Set<number>();
  (s.cages ?? []).forEach((cage: Cage, i) => {
    const digits = cage.cells.map((c) => s.values[c]!).filter((v) => v);
    const sum = digits.reduce((a, b) => a + b, 0);
    const full = digits.length === cage.cells.length;
    if (new Set(digits).size < digits.length || sum > cage.sum || (full && sum !== cage.sum))
      out.add(i);
  });
  return out;
}

export { cageIndex };
export {
  eraseCell,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  toggleNote,
  type SudokuState,
} from '../shared/sudoku/play';
