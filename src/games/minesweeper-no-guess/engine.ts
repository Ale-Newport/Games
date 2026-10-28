/**
 * No-Guess Minesweeper (#117): the standard boards, but each layout is redrawn (from the seed and
 * the first cell) until the deduction solver — single numbers, pairs of numbers and the mine count —
 * clears it from the first cell. You never have to guess. Rules and state live in
 * `../shared/minesweeper/engine.ts`.
 */
import type { MinesSpec } from '../shared/minesweeper/engine';

export const SPECS: Record<string, MinesSpec> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export {
  chord,
  isValidMinesState,
  newMines,
  reveal,
  toggleFlag,
  type MinesState,
} from '../shared/minesweeper/engine';
