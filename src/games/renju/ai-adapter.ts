import type { AiBundle } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { MnkState } from '../shared/mnk/engine';
import { createMnkEnvironment, type MnkConfig } from '../shared/mnk/environment';
import { AGENT_PRESETS } from './ai';
import {
  RENJU,
  RULES_VERSION,
  RULESET_ID,
  isLegalRenju,
  isValidRenjuState,
  legalRenju,
  playRenju,
} from './rules';

const base = createMnkEnvironment({
  id: 'renju',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  rules: RENJU,
});

/** The m,n,k environment with Renju legality (opening point, Black's forbidden points). */
export const renjuEnv: GameEnvironment<MnkState, number, MnkState, MnkConfig> = {
  ...base,
  // Black always moves first in Renju; the config's firstPlayer is ignored.
  createInitialState: () => base.createInitialState({ firstPlayer: 0 }, 0),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalRenju(s),
  applyAction: playRenju,
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidRenjuState(parsed)) throw new Error('Invalid Renju state');
    return parsed;
  },
  decodeAction: (index, s) => {
    if (!isLegalRenju(s, index)) throw new Error(`Point ${index} is not legal`);
    return index;
  },
};

export const bundle: AiBundle<MnkState, number> = { env: renjuEnv, agents: AGENT_PRESETS };
export default bundle;
