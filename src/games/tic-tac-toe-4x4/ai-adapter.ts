import type { AiBundle } from '../../ai/protocols/bundle';
import { createMnkEnvironment } from '../shared/mnk/environment';
import type { MnkState } from '../shared/mnk/engine';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, T4 } from './rules';

export const t4Env = createMnkEnvironment({
  id: 'tic-tac-toe-4x4',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: T4,
});

export const bundle: AiBundle<MnkState, number> = {
  env: t4Env,
  agents: AGENT_PRESETS,
  exactOracleId: 'perfect',
};
export default bundle;
