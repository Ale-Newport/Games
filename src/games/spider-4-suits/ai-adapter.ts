import type { AiBundle } from '../../ai/protocols/bundle';
import type { SpiderState } from '../shared/spider/engine';
import { createSpiderEnv, spiderPresets } from '../shared/spider/environment';
import { RULES_VERSION, RULESET_ID, SUITS } from './rules';

export const spiderEnv = createSpiderEnv(SUITS, {
  id: 'spider-4-suits',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const AGENT_PRESETS = spiderPresets(4000);

export const bundle: AiBundle<SpiderState, string> = { env: spiderEnv, agents: AGENT_PRESETS };
export default bundle;
