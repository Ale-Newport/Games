/**
 * Calcudoku (#109, the KenKen-style arithmetic puzzle): fill an N×N Latin square (every row and
 * column holds 1–N once) where each outlined cage shows a target and an operation: the sum (+),
 * the product (×), or for two cells the difference (−) or quotient (÷) of larger by smaller; a
 * one-cell cage states its digit. Digits may repeat in a cage when in different rows and columns.
 *
 * Puzzles are generated from a seed (see `../shared/sudoku/calc.ts`): a random Latin square,
 * random cages with operations, and — while a second solution exists — a new operation or a split
 * for the cage where they differ; kept when the technique solver (cage arithmetic, singles and the
 * classic techniques) solves it at the difficulty's level, preferring few one-cell cages.
 *
 * Sizes: Easy 4×4, Medium 5×5, Hard 6×6, Expert 7×7. Several sizes and ages in one game.
 */
import type { CalcCage } from '../shared/sudoku/calc';
import { cageValue } from '../shared/sudoku/calc';
import type { SudokuState, SudokuVariant } from '../shared/sudoku/play';

export {
  eraseCell,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  toggleNote,
  type SudokuState,
} from '../shared/sudoku/play';
import { RULESET_ID } from './rules-meta';

const spec = (
  size: number,
  noteCols: number,
  max: number,
  minLevel: number,
  maxLevel: number,
  singles: number,
) => ({
  shape: { size, boxRows: 0, boxCols: noteCols },
  minLevel,
  maxLevel,
  minClues: 0,
  maxClues: 0,
  calc: { min: 2, max, singles },
  attempts: 60,
});

export const CALC: SudokuVariant = {
  id: RULESET_ID,
  shape: { size: 4, boxRows: 0, boxCols: 2 },
  difficulties: {
    easy: spec(4, 2, 3, 1, 1, 0),
    medium: spec(5, 3, 3, 1, 2, 0),
    hard: spec(6, 3, 4, 1, 3, 1),
    expert: spec(7, 4, 4, 2, 3, 1),
  },
};

export const OP_SYMBOL: Record<CalcCage['op'], string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '=': '',
};

export const cageLabel = (cage: CalcCage) => `${cage.target}${OP_SYMBOL[cage.op]}`;

/** Cages whose digits, once all placed, miss the target. */
export function badCalc(s: SudokuState): Set<number> {
  const out = new Set<number>();
  (s.calc ?? []).forEach((cage, i) => {
    const digits = cage.cells.map((c) => s.values[c]!);
    if (digits.every((d) => d) && cageValue(cage.op, digits) !== cage.target) out.add(i);
  });
  return out;
}
