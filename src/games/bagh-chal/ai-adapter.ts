import type { AiBundle } from '../../ai/protocols/bundle';
import type { HuntState } from '../shared/hunt/engine';
import { createHuntEnv } from '../shared/hunt/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const baghChalEnv = createHuntEnv(VARIANT, {
  id: 'bagh-chal',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<HuntState, string> = { env: baghChalEnv, agents: AGENT_PRESETS };
export default bundle;
