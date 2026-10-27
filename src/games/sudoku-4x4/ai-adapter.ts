/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { SUDOKU_4 } from './engine';
import { RULES_VERSION } from './rules-meta';

export const sudoku4Env = createSudokuEnv(SUDOKU_4, 'sudoku-4x4', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: sudoku4Env as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(SUDOKU_4),
  exactOracleId: 'solver',
};
export default bundle;
