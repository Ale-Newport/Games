/** The AI environment: one board per episode (config `{ difficulty }`), cleared or blown up. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { MINES_AGENTS, createMinesEnv } from '../shared/minesweeper/ai';
import type { MinesState } from '../shared/minesweeper/engine';
import { SPECS } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const noGuessEnv = createMinesEnv(
  'minesweeper-no-guess',
  RULESET_ID,
  RULES_VERSION,
  SPECS,
  true,
);

export const bundle: AiBundle<MinesState, string> = {
  env: noGuessEnv as unknown as AiBundle<MinesState, string>['env'],
  agents: MINES_AGENTS,
};
export default bundle;
