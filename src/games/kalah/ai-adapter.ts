import type { AiBundle } from '../../ai/protocols/bundle';
import type { MancalaState } from '../shared/mancala/engine';
import { createMancalaEnv } from '../shared/mancala/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const kalahEnv = createMancalaEnv(VARIANT, {
  id: 'kalah',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<MancalaState, string> = { env: kalahEnv, agents: AGENT_PRESETS };
export default bundle;
