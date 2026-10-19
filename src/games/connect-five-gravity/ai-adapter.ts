import type { AiBundle } from '../../ai/protocols/bundle';
import type { GravityState } from '../shared/gravity/engine';
import { createGravityEnvironment } from '../shared/gravity/environment';
import { AGENT_PRESETS } from './ai';
import { C5, RULES_VERSION, RULESET_ID } from './rules';

export const c5Env = createGravityEnvironment({
  id: 'connect-five-gravity',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: C5,
});

export const bundle: AiBundle<GravityState, number> = { env: c5Env, agents: AGENT_PRESETS };
export default bundle;
