/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { CALC } from './engine';
import { RULES_VERSION } from './rules-meta';

export const calcEnv = createSudokuEnv(CALC, 'calcudoku', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: calcEnv as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(CALC),
  exactOracleId: 'solver',
};
export default bundle;
