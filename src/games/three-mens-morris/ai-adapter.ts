import type { AiBundle } from '../../ai/protocols/bundle';
import type { MorrisState } from '../shared/morris/engine';
import { createMorrisEnvironment } from '../shared/morris/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const threeEnv = createMorrisEnvironment({
  id: 'three-mens-morris',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  variant: VARIANT,
});

export const bundle: AiBundle<MorrisState, string> = { env: threeEnv, agents: AGENT_PRESETS };
export default bundle;
