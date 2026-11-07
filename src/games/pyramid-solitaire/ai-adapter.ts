import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS, maskPyramid, pyramidKey } from './ai';
import {
  applyPyramidMove,
  dealPyramid,
  isValidPyramidState,
  legalPyramidMoves,
  removedCount,
  type PyramidState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function pyramidOutcome(s: PyramidState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : removedCount(s) / 28],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export const pyramidEnv: GameEnvironment<PyramidState, string> = {
  id: 'pyramid-solitaire',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (_config, seed) => dealPyramid(seed >>> 0),
  reset: (seed) => dealPyramid(seed >>> 0),
  getObservation: (s) => maskPyramid(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== 0 ? [] : legalPyramidMoves(s),
  applyAction: (s, a) => applyPyramidMove(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
  isTerminal: (s) => s.result !== null,
  getOutcome: pyramidOutcome,
  getReward: (s) => pyramidOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidPyramidState(parsed)) throw new Error('Invalid pyramid state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: pyramidKey,
  actionToString: (a) => a,
};

export const bundle: AiBundle<PyramidState, string> = { env: pyramidEnv, agents: AGENT_PRESETS };
export default bundle;
