import type { AiBundle } from '../../ai/protocols/bundle';
import type { TaflState } from '../shared/tafl/engine';
import { createTaflEnv } from '../shared/tafl/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const tablutEnv = createTaflEnv(VARIANT, {
  id: 'tablut',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<TaflState, string> = { env: tablutEnv, agents: AGENT_PRESETS };
export default bundle;
