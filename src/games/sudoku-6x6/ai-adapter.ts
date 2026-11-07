/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { SUDOKU_6 } from './engine';
import { RULES_VERSION } from './rules-meta';

export const sudoku6Env = createSudokuEnv(SUDOKU_6, 'sudoku-6x6', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: sudoku6Env as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(SUDOKU_6),
  exactOracleId: 'solver',
};
export default bundle;
