/**
 * Classic Minesweeper (#116): the three standard boards; mines are placed after the first reveal,
 * away from it, and the numbers may sometimes leave a guess. Rules and state live in
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
