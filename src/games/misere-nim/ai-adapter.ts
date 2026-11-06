import type { AiBundle } from '../../ai/protocols/bundle';
import type { HeapsState } from '../shared/heaps/engine';
import { createHeapsEnv } from '../shared/heaps/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const misereNimEnv = createHeapsEnv(VARIANT, {
  id: 'misere-nim',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<HeapsState, string> = { env: misereNimEnv, agents: AGENT_PRESETS };
export default bundle;
