import type { AiBundle } from '../../ai/protocols/bundle';
import type { GravityState } from '../shared/gravity/engine';
import { createGravityEnvironment } from '../shared/gravity/environment';
import { AGENT_PRESETS } from './ai';
import { C4, RULES_VERSION, RULESET_ID } from './rules';

export const c4Env = createGravityEnvironment({
  id: 'four-in-a-row',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: C4,
});

export const bundle: AiBundle<GravityState, number> = { env: c4Env, agents: AGENT_PRESETS };
export default bundle;
