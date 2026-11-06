import type { AiBundle } from '../../ai/protocols/bundle';
import type { MnkState } from '../shared/mnk/engine';
import { createMnkEnvironment } from '../shared/mnk/environment';
import { AGENT_PRESETS } from './ai';
import { MISERE, RULES_VERSION, RULESET_ID } from './rules';

export const misereEnv = createMnkEnvironment({
  id: 'misere-tic-tac-toe',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: MISERE,
});

export const bundle: AiBundle<MnkState, number> = {
  env: misereEnv,
  agents: AGENT_PRESETS,
  exactOracleId: 'perfect',
};
export default bundle;
