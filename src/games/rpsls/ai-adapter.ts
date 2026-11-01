/** The AI environment: one match per episode (config `{ target }`: 3, 5 or 10 round wins; 5 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import type { Duel } from '../shared/throws/engine';
import { THROW_AGENTS, duelEnv } from '../shared/throws/environment';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const env = duelEnv('rpsls', RULES_VERSION, RULESET_ID, 5);

export const bundle: AiBundle<Duel, string> = {
  env: env as unknown as AiBundle<Duel, string>['env'],
  agents: THROW_AGENTS,
};
export default bundle;
