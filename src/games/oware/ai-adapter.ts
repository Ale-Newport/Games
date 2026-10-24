import type { AiBundle } from '../../ai/protocols/bundle';
import type { MancalaState } from '../shared/mancala/engine';
import { createMancalaEnv } from '../shared/mancala/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const owareEnv = createMancalaEnv(VARIANT, {
  id: 'oware',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<MancalaState, string> = { env: owareEnv, agents: AGENT_PRESETS };
export default bundle;
