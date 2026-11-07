/**
 * The AI environment plays one hand per episode (player 0 acts first) from the match's opening
 * stacks; the return is the hand's net result in chips (up to ±13).
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyLeducAction,
  createLeduc,
  isValidLeducState,
  legalLeducActions,
  type LeducState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function leducOutcome(s: LeducState): Outcome | null {
  if (!s.result) return null;
  const { winner, won } = s.result;
  if (winner === null) return { returns: [0, 0], winners: [], draw: true, reason: 'split' };
  const returns = winner === 0 ? [won, -won] : [-won, won];
  return {
    returns,
    winners: [winner],
    draw: false,
    reason: s.result.showdown ? 'showdown' : 'fold',
  };
}

export const leducEnv: GameEnvironment<LeducState, string> = {
  id: 'leduc-poker',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
    actionSpaceSize: 5,
  },
  createInitialState: (_config, seed) => createLeduc(seed >>> 0),
  reset: (seed) => createLeduc(seed >>> 0),
  // A player sees their own card; the opponent's only after a showdown.

  // A player sees their own card, the public card in round two, and the other card only at a
  // showdown.
  getObservation: (s, player) => ({
    ...s,
    cards: s.cards.map((c, i) =>
      i === player || s.result?.showdown || (i === 2 && s.round === 1) ? c : -1,
    ) as [number, number, number],
  }),
  getLegalActions: (s, player) =>
    s.result || (player !== undefined && player !== s.toAct) ? [] : legalLeducActions(s),
  applyAction: applyLeducAction,
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.result !== null,
  getOutcome: leducOutcome,
  getReward: (s, p) => leducOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidLeducState(parsed)) throw new Error('Invalid Leduc poker state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  encodeAction: (a) => ['check', 'bet', 'call', 'raise', 'fold'].indexOf(a),
  decodeAction: (i) => ['check', 'bet', 'call', 'raise', 'fold'][i]!,
  actionToString: (a) => a,
};

export const bundle: AiBundle<LeducState, string> = {
  env: leducEnv,
  agents: AGENT_PRESETS,
  exactOracleId: 'hard',
};
export default bundle;
