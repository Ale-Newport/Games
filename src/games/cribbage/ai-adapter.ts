/**
 * The AI environment plays one hand per episode (throw, pegging and the show); each seat's return
 * is its points in the hand minus the other's, in tens.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyCribbageAction,
  createCribbage,
  cribOptions,
  isValidCribbageState,
  legalCribbageActions,
  type CribbageState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const ended = (s: CribbageState) => s.phase === 'show' || s.phase === 'done';

export function cribbageOutcome(s: CribbageState): Outcome | null {
  if (!ended(s)) return null;
  const [a, b] = s.scores;
  return {
    returns: [(a - b) / 10, (b - a) / 10],
    winners: a === b ? [] : [a > b ? 0 : 1],
    draw: a === b,
    scores: [a, b],
    reason: 'hand',
  };
}

export const cribbageEnv: GameEnvironment<CribbageState, string> = {
  id: 'cribbage',
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
  createInitialState: (_config, seed) => createCribbage(seed >>> 0),
  reset: (seed) => createCribbage(seed >>> 0),
  getObservation: (s, player) => ({
    ...s,
    cut: -1,
    hands: s.hands.map((h, i) => (i === player ? h : h.map(() => -1))),
    kept: s.kept.map((h, i) => (i === player || ended(s) ? h : h.map(() => -1))),
    crib: ended(s) ? s.crib : s.crib.map(() => -1),
  }),
  getLegalActions: (s, player) =>
    ended(s) || (player !== undefined && player !== s.toAct)
      ? []
      : s.phase === 'crib'
        ? cribOptions(s.hands[s.toAct]!)
        : legalCribbageActions(s),
  applyAction: applyCribbageAction,
  getCurrentPlayer: (s) => (ended(s) ? NO_PLAYER : s.toAct),
  isTerminal: ended,
  getOutcome: cribbageOutcome,
  getReward: (s, p) => cribbageOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidCribbageState(parsed)) throw new Error('Invalid cribbage state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<CribbageState, string> = { env: cribbageEnv, agents: AGENT_PRESETS };
export default bundle;
