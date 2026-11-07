import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS, canfieldKey, maskCanfield } from './ai';
import {
  applyCanfieldMove,
  dealCanfield,
  homeCount,
  isValidCanfieldState,
  legalCanfieldMoves,
  type CanfieldState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function canfieldOutcome(s: CanfieldState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : homeCount(s) / 52],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export const canfieldEnv: GameEnvironment<CanfieldState, string> = {
  id: 'canfield',
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
  createInitialState: (_config, seed) => dealCanfield(seed >>> 0),
  reset: (seed) => dealCanfield(seed >>> 0),
  getObservation: (s) => maskCanfield(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== 0 ? [] : legalCanfieldMoves(s),
  applyAction: (s, a) => applyCanfieldMove(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
  isTerminal: (s) => s.result !== null,
  getOutcome: canfieldOutcome,
  getReward: (s) => canfieldOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidCanfieldState(parsed)) throw new Error('Invalid canfield state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: canfieldKey,
  actionToString: (a) => a,
};

export const bundle: AiBundle<CanfieldState, string> = { env: canfieldEnv, agents: AGENT_PRESETS };
export default bundle;
