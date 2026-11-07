/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { SUDOKU_9 } from './engine';
import { RULES_VERSION } from './rules-meta';

export const sudoku9Env = createSudokuEnv(SUDOKU_9, 'sudoku-9x9', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: sudoku9Env as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(SUDOKU_9),
  exactOracleId: 'solver',
};
export default bundle;
