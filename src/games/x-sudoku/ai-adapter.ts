/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { X_SUDOKU } from './engine';
import { RULES_VERSION } from './rules-meta';

export const xSudokuEnv = createSudokuEnv(X_SUDOKU, 'x-sudoku', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: xSudokuEnv as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(X_SUDOKU),
  exactOracleId: 'solver',
};
export default bundle;
