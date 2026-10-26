/**
 * The AI environment plays one hand per episode; the return is the hand's points for the winner
 * (and their opposite for the loser) in units of 25, and zero for a void hand.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyGinAction,
  createGin,
  isValidGinState,
  legalGinActions,
  type GinState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function ginOutcome(s: GinState): Outcome | null {
  if (s.phase !== 'done' || !s.result) return null;
  const { winner, points, kind } = s.result;
  if (winner === null) return { returns: [0, 0], winners: [], draw: true, reason: kind };
  const returns = winner === 0 ? [points / 25, -points / 25] : [-points / 25, points / 25];
  return { returns, winners: [winner], draw: false, reason: kind };
}

export const ginEnv: GameEnvironment<GinState, string> = {
  id: 'gin-rummy',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => createGin(seed >>> 0),
  reset: (seed) => createGin(seed >>> 0),
  // A player sees their hand, the pile and the public picks; the other hand and the stock are hidden.
  getObservation: (s, player) => ({
    ...s,
    stock: s.stock.map(() => -1),
    hands: s.hands.map((h, i) => (i === player || s.phase === 'done' ? h : h.map(() => -1))),
  }),
  getLegalActions: (s, player) =>
    s.phase === 'done' || (player !== undefined && player !== s.toAct) ? [] : legalGinActions(s),
  applyAction: applyGinAction,
  getCurrentPlayer: (s) => (s.phase === 'done' ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.phase === 'done',
  getOutcome: ginOutcome,
  getReward: (s, p) => ginOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidGinState(parsed)) throw new Error('Invalid gin rummy state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<GinState, string> = { env: ginEnv, agents: AGENT_PRESETS };
export default bundle;
