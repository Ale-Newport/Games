/** The AI environment: one scramble per episode (config `{ level }`), solved or out of moves. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { SLIDE_AGENTS, createSlideEnv } from '../shared/sliding/ai';
import type { SlideState } from '../shared/sliding/play';
import { SPECS } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const eightEnv = createSlideEnv('eight-puzzle', RULESET_ID, RULES_VERSION, SPECS);

export const bundle: AiBundle<SlideState, string> = {
  env: eightEnv as unknown as AiBundle<SlideState, string>['env'],
  agents: SLIDE_AGENTS,
  exactOracleId: 'solver',
};
export default bundle;
