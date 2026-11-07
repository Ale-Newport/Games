/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSudokuEnv, sudokuAgents } from '../shared/sudoku/ai';
import type { SudokuState } from '../shared/sudoku/play';
import { JIGSAW } from './engine';
import { RULES_VERSION } from './rules-meta';

export const jigsawEnv = createSudokuEnv(JIGSAW, 'jigsaw-sudoku', RULES_VERSION);

export const bundle: AiBundle<SudokuState, string> = {
  env: jigsawEnv as unknown as AiBundle<SudokuState, string>['env'],
  agents: sudokuAgents(JIGSAW),
  exactOracleId: 'solver',
};
export default bundle;
