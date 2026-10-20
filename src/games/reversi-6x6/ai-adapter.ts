import type { AiBundle } from '../../ai/protocols/bundle';
import type { ReversiState } from '../shared/reversi/engine';
import { createReversiEnvironment } from '../shared/reversi/environment';
import { AGENT_PRESETS } from './ai';
import { R6, RULES_VERSION, RULESET_ID } from './rules';

export const r6Env = createReversiEnvironment({
  id: 'reversi-6x6',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: R6,
});

export const bundle: AiBundle<ReversiState, number> = { env: r6Env, agents: AGENT_PRESETS };
export default bundle;
