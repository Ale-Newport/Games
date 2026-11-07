/** The AI environment: one board per episode (config `{ difficulty }`), cleared or blown up. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { MINES_AGENTS, createMinesEnv } from '../shared/minesweeper/ai';
import type { MinesState } from '../shared/minesweeper/engine';
import { SPECS } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const minesEnv = createMinesEnv('minesweeper', RULESET_ID, RULES_VERSION, SPECS, false);

export const bundle: AiBundle<MinesState, string> = {
  env: minesEnv as unknown as AiBundle<MinesState, string>['env'],
  agents: MINES_AGENTS,
};
export default bundle;
