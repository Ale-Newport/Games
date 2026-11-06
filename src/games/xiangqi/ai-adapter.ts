import type { AiBundle } from '../../ai/protocols/bundle';
import { createXiangqiEnvironment } from '../shared/xiangqi/environment';
import type { XiangqiState } from '../shared/xiangqi/game';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID } from './rules';

export const xiangqiEnv = createXiangqiEnvironment({
  id: 'xiangqi',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const bundle: AiBundle<XiangqiState, string> = { env: xiangqiEnv, agents: AGENT_PRESETS };
export default bundle;
