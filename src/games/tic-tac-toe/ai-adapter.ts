import type { AiBundle } from '../../ai/protocols/bundle';
import { createMnkEnvironment, type MnkConfig } from '../shared/mnk/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, TTT, type TttState } from './rules';

export type TttConfig = MnkConfig;

export const tttEnv = createMnkEnvironment({
  id: 'tic-tac-toe',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: TTT,
});

export const bundle: AiBundle<TttState, number> = {
  env: tttEnv,
  agents: AGENT_PRESETS,
  exactOracleId: 'perfect',
};
export default bundle;
