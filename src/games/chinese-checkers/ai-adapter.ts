import type { AiBundle } from '../../ai/protocols/bundle';
import type { JumpRaceState } from '../shared/jump-race/engine';
import { createJumpRaceEnv } from '../shared/jump-race/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const chineseCheckersEnv = createJumpRaceEnv(VARIANT, {
  id: 'chinese-checkers',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<JumpRaceState, string> = {
  env: chineseCheckersEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
