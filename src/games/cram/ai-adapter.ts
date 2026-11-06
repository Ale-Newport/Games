import type { AiBundle } from '../../ai/protocols/bundle';
import type { DominoState } from '../shared/dominoes/engine';
import { createDominoEnv } from '../shared/dominoes/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const cramEnv = createDominoEnv(VARIANT, {
  id: 'cram',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<DominoState, string> = { env: cramEnv, agents: AGENT_PRESETS };
export default bundle;
