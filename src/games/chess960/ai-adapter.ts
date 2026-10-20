import type { AiBundle } from '../../ai/protocols/bundle';
import { createChessEnvironment } from '../shared/chess/environment';
import type { ChessState } from '../shared/chess/game';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

/** `reset(seed)` starts from position `seed mod 960`. */
export const chess960Env = createChessEnvironment({
  id: 'chess960',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  variant: VARIANT,
});

export const bundle: AiBundle<ChessState, string> = { env: chess960Env, agents: AGENT_PRESETS };
export default bundle;
