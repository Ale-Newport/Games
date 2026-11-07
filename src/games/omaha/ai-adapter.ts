import type { AiBundle } from '../../ai/protocols/bundle';
import type { PokerState } from '../shared/poker/engine';
import { createPokerEnv } from '../shared/poker/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

/** One pot-limit hand per episode (heads-up by default, up to six seats); returns in big blinds. */
export const omahaEnv = createPokerEnv(VARIANT, {
  id: 'omaha',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<PokerState, string> = {
  env: omahaEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
