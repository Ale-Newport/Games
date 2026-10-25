import type { AiBundle } from '../../ai/protocols/bundle';
import { upDownPresets } from '../shared/updown/ai';
import type { UpDownState } from '../shared/updown/engine';
import { createUpDownEnv } from '../shared/updown/environment';
import { LAYOUT, RULES_VERSION, RULESET_ID } from './rules';

export const triPeaksEnv = createUpDownEnv(LAYOUT, {
  id: 'tripeaks',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const AGENT_PRESETS = upDownPresets(LAYOUT);

export const bundle: AiBundle<UpDownState, string> = { env: triPeaksEnv, agents: AGENT_PRESETS };
export default bundle;
