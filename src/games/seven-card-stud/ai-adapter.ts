import type { AiBundle } from '../../ai/protocols/bundle';
import type { PokerState } from '../shared/poker/engine';
import { createPokerEnv } from '../shared/poker/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

/** One fixed-limit hand per episode (heads-up by default, up to six seats); returns in big blinds. */
export const studEnv = createPokerEnv(VARIANT, {
  id: 'seven-card-stud',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<PokerState, string> = {
  env: studEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
