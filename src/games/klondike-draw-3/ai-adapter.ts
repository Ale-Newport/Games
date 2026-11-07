import type { AiBundle } from '../../ai/protocols/bundle';
import type { KlondikeState } from '../shared/klondike/engine';
import { createKlondikeEnv, klondikePresets } from '../shared/klondike/environment';
import { DRAW, RULES_VERSION, RULESET_ID } from './rules';

export const klondikeDraw3Env = createKlondikeEnv(DRAW, {
  id: 'klondike-draw-3',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const AGENT_PRESETS = klondikePresets(20_000);

export const bundle: AiBundle<KlondikeState, string> = {
  env: klondikeDraw3Env,
  agents: AGENT_PRESETS,
};
export default bundle;
