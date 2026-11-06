import type { AiBundle } from '../../ai/protocols/bundle';
import type { HexState } from '../shared/hex/engine';
import { createHexEnvironment } from '../shared/hex/environment';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, SIZE } from './rules';

export const hex11Env = createHexEnvironment({
  id: 'hex-11x11',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  size: SIZE,
});

export const bundle: AiBundle<HexState, number> = { env: hex11Env, agents: AGENT_PRESETS };
export default bundle;
