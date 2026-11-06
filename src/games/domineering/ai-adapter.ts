import type { AiBundle } from '../../ai/protocols/bundle';
import type { DominoState } from '../shared/dominoes/engine';
import { createDominoEnv } from '../shared/dominoes/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const domineeringEnv = createDominoEnv(VARIANT, {
  id: 'domineering',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<DominoState, string> = { env: domineeringEnv, agents: AGENT_PRESETS };
export default bundle;
