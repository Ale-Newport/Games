import type { AiBundle } from '../../ai/protocols/bundle';
import type { HeapsState } from '../shared/heaps/engine';
import { createHeapsEnv } from '../shared/heaps/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const nimEnv = createHeapsEnv(VARIANT, {
  id: 'nim',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<HeapsState, string> = { env: nimEnv, agents: AGENT_PRESETS };
export default bundle;
