/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { SUDOKU_16 } from './engine';
import { RULES_VERSION } from './rules-meta';

export const sudoku16Env = createSudokuEnv(SUDOKU_16, 'sudoku-16x16', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: sudoku16Env as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(SUDOKU_16),
  exactOracleId: 'solver',
};
export default bundle;
