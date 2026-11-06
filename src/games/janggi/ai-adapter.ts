import type { AiBundle } from '../../ai/protocols/bundle';
import type { JanggiState } from '../shared/xiangqi/janggi';
import { createJanggiEnvironment } from '../shared/xiangqi/janggi-environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID } from './rules';

/** `reset(seed)` uses setups `seed mod 4` (Cho) and `(seed >> 2) mod 4` (Han). */
export const janggiEnv = createJanggiEnvironment({
  id: 'janggi',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<JanggiState, string> = { env: janggiEnv, agents: AGENT_PRESETS };
export default bundle;
