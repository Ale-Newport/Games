/**
 * The AI environment plays one round per episode: a fixed bet of 10 is placed when the state is
 * created, and the return is the round's net result in bets (−2 … +3, e.g. +1.5 for a blackjack).
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyBlackjackAction,
  createBlackjack,
  isValidBlackjackState,
  legalBlackjackActions,
  roundNet,
  type BlackjackState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const UNIT = 10;

const startRound = (seed: number) =>
  applyBlackjackAction(createBlackjack(seed >>> 0), `bet:${UNIT}`);

export function blackjackOutcome(s: BlackjackState): Outcome | null {
  if (s.phase !== 'settled') return null;
  const net = roundNet(s) / UNIT;
  return {
    returns: [net],
    winners: net > 0 ? [0] : [],
    draw: net === 0,
    reason: s.hands[0]!.outcome!,
  };
}

export const blackjackEnv: GameEnvironment<BlackjackState, string> = {
  id: 'blackjack',
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
  createInitialState: (_config, seed) => startRound(seed),
  reset: (seed) => startRound(seed),
  // The shoe and the dealer's hole card are hidden until revealed.
  getObservation: (s) => ({
    ...s,
    shoe: [],
    dealer: s.revealed ? s.dealer.slice() : s.dealer.slice(0, 1),
  }),
  getLegalActions: (s, player) =>
    s.phase === 'settled' || (player !== undefined && player !== 0) ? [] : legalBlackjackActions(s),
  applyAction: (s, a) => applyBlackjackAction(s, a),
  getCurrentPlayer: (s) => (s.phase === 'settled' ? NO_PLAYER : 0),
  isTerminal: (s) => s.phase === 'settled',
  getOutcome: blackjackOutcome,
  getReward: (s) => blackjackOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidBlackjackState(parsed)) throw new Error('Invalid blackjack state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<BlackjackState, string> = {
  env: blackjackEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
