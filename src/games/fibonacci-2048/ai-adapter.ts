/** The AI environment: one game per episode (config `{ level }`), until no move is left. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createMergeEnv, mergeAgents } from '../shared/merge/ai';
import type { MergeGameState } from '../shared/merge/play';
import { LEVELS } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const fibonacciEnv = createMergeEnv('fibonacci-2048', RULESET_ID, RULES_VERSION, LEVELS);

export const bundle: AiBundle<MergeGameState, string> = {
  env: fibonacciEnv as unknown as AiBundle<MergeGameState, string>['env'],
  agents: mergeAgents(LEVELS),
};
export default bundle;
