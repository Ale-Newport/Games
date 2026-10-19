import type { AiBundle } from '../../ai/protocols/bundle';
import type { MnkState } from '../shared/mnk/engine';
import { createMnkEnvironment } from '../shared/mnk/environment';
import { AGENT_PRESETS } from './ai';
import { GOMOKU, RULES_VERSION, RULESET_ID } from './rules';

export const gomokuEnv = createMnkEnvironment({
  id: 'gomoku',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: GOMOKU,
});

export const bundle: AiBundle<MnkState, number> = { env: gomokuEnv, agents: AGENT_PRESETS };
export default bundle;
