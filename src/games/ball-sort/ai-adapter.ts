/** The AI environment: one shuffle per episode (config `{ level }`), sorted, stuck or out of moves. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createSortEnv, sortAgents } from '../shared/sorting/ai';
import type { SortState } from '../shared/sorting/play';
import { SPECS, rulesFor } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const ballEnv = createSortEnv('ball-sort', RULESET_ID, RULES_VERSION, SPECS, rulesFor);

export const bundle: AiBundle<SortState, string> = {
  env: ballEnv as unknown as AiBundle<SortState, string>['env'],
  agents: sortAgents(rulesFor, SPECS),
  exactOracleId: 'solver',
};
export default bundle;
