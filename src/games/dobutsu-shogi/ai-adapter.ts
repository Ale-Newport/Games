import type { AiBundle } from '../../ai/protocols/bundle';
import { createShogiEnvironment } from '../shared/shogi/environment';
import type { ShogiState } from '../shared/shogi/game';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const animalEnv = createShogiEnvironment({
  id: 'dobutsu-shogi',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  variant: VARIANT,
});

export const bundle: AiBundle<ShogiState, string> = { env: animalEnv, agents: AGENT_PRESETS };
export default bundle;
