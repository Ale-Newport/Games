import type { AiBundle } from '../../ai/protocols/bundle';
import { createChessEnvironment } from '../shared/chess/environment';
import type { ChessState } from '../shared/chess/game';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID, VARIANT } from './rules';

export const gardnerEnv = createChessEnvironment({
  id: 'gardner-minichess',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  variant: VARIANT,
});

export const bundle: AiBundle<ChessState, string> = { env: gardnerEnv, agents: AGENT_PRESETS };
export default bundle;
