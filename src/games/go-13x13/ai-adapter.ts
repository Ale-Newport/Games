import type { AiBundle } from '../../ai/protocols/bundle';
import type { GoState } from '../shared/go/engine';
import { createGoEnvironment } from '../shared/go/environment';
import { AGENT_PRESETS } from './ai';
import { RULES, RULES_VERSION, RULESET_ID } from './rules';

export const go13Env = createGoEnvironment({
  id: 'go-13x13',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: RULES,
});

export const bundle: AiBundle<GoState, number> = { env: go13Env, agents: AGENT_PRESETS };
export default bundle;
