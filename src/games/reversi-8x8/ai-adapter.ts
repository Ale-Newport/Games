import type { AiBundle } from '../../ai/protocols/bundle';
import type { ReversiState } from '../shared/reversi/engine';
import { createReversiEnvironment } from '../shared/reversi/environment';
import { AGENT_PRESETS } from './ai';
import { R8, RULES_VERSION, RULESET_ID } from './rules';

export const r8Env = createReversiEnvironment({
  id: 'reversi-8x8',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: R8,
});

export const bundle: AiBundle<ReversiState, number> = { env: r8Env, agents: AGENT_PRESETS };
export default bundle;
