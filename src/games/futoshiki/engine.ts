/**
 * Futoshiki (#110): fill an N×N Latin square (every row and column holds 1–N once) so that every
 * inequality sign between two neighbours holds; a few digits may be given. Puzzles are generated
 * from a seed (see `../shared/sudoku/signs.ts`): a random Latin square, signs on a share of the
 * neighbour pairs, then givens removed while the solution stays unique and the technique solver
 * (inequalities, singles and the classic techniques) solves it at the difficulty's level.
 *
 * Sizes: Easy 4×4, Medium 5×5, Hard 6×6, Expert 7×7.
 */
import type { Sign } from '../shared/sudoku/signs';
import type { SudokuState, SudokuVariant } from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

const spec = (
  size: number,
  noteCols: number,
  signs: number,
  minLevel: number,
  maxLevel: number,
  attempts: number,
) => ({
  shape: { size, boxRows: 0, boxCols: noteCols },
  minLevel,
  maxLevel,
  minClues: 0,
  maxClues: size * size,
  signs,
  attempts,
});

export const FUTOSHIKI: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 4, boxRows: 0, boxCols: 2 },
  difficulties: {
    easy: spec(4, 2, 0.35, 1, 1, 40),
    medium: spec(5, 3, 0.3, 1, 2, 40),
    hard: spec(6, 3, 0.25, 2, 3, 60),
    expert: spec(7, 4, 0.22, 3, 3, 120),
  },
};

/** Signs whose two digits are placed and break it. */
export function brokenSigns(s: SudokuState): Set<number> {
  const out = new Set<number>();
  (s.signs ?? []).forEach((sign: Sign, i) => {
    const a = s.values[sign.less]!;
    const b = s.values[sign.more]!;
    if (a && b && a >= b) out.add(i);
  });
  return out;
}

export {
  eraseCell,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  toggleNote,
  type SudokuState,
} from '../shared/sudoku/play';
