import type { AiBundle } from '../../ai/protocols/bundle';
import type { DraughtsState, Move } from '../shared/draughts/engine';
import { createDraughtsEnvironment } from '../shared/draughts/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const internationalEnv = createDraughtsEnvironment({
  id: 'international-draughts',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  variant: VARIANT,
});

export const bundle: AiBundle<DraughtsState, Move> = {
  env: internationalEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
