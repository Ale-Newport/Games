import type { AiBundle } from '../../ai/protocols/bundle';
import { columnsPresets } from '../shared/columns/ai';
import type { ColumnsState } from '../shared/columns/engine';
import { createColumnsEnv } from '../shared/columns/environment';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const yukonEnv = createColumnsEnv(VARIANT, {
  id: 'yukon',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});
export const AGENT_PRESETS = columnsPresets(VARIANT);
export const bundle: AiBundle<ColumnsState, string> = { env: yukonEnv, agents: AGENT_PRESETS };
export default bundle;
