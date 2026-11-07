/**
 * The AI environment plays one hand per episode (bidding and play): four seats in two
 * partnerships; each seat's return is its side's hand score minus the other side's, in hundreds.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applySpadesAction,
  createSpades,
  isValidSpadesState,
  legalSpadesActions,
  teamOf,
  type SpadesState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function spadesOutcome(s: SpadesState): Outcome | null {
  if (s.phase !== 'done' || !s.result) return null;
  const [a, b] = s.result.points;
  const returns = [0, 1, 2, 3].map((seat) => (teamOf(seat) === 0 ? a - b : b - a) / 100);
  const winners = a === b ? [] : [0, 1, 2, 3].filter((seat) => teamOf(seat) === (a > b ? 0 : 1));
  return { returns, winners, draw: a === b, scores: [a, b, a, b], reason: 'hand' };
}

export const spadesEnv: GameEnvironment<SpadesState, string> = {
  id: 'spades',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 4,
    maxPlayers: 4,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => createSpades(seed >>> 0),
  reset: (seed) => createSpades(seed >>> 0),
  getObservation: (s, player) => ({
    ...s,
    hands: s.hands.map((h, i) => (i === player ? h : h.map(() => -1))),
  }),
  getLegalActions: (s, player) =>
    s.phase === 'done' || (player !== undefined && player !== s.toAct) ? [] : legalSpadesActions(s),
  applyAction: applySpadesAction,
  getCurrentPlayer: (s) => (s.phase === 'done' ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.phase === 'done',
  getOutcome: spadesOutcome,
  getReward: (s, p) => spadesOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSpadesState(parsed)) throw new Error('Invalid Spades state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<SpadesState, string> = { env: spadesEnv, agents: AGENT_PRESETS };
export default bundle;
