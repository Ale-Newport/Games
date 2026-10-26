/**
 * The AI environment plays one hand per episode (two players by default, up to four via the
 * config); the hand's winner gets its points and the others lose their own hand's points, in
 * tens.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyEightsAction,
  createEights,
  isValidEightsState,
  legalEightsActions,
  penalty,
  type EightsState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface EightsConfig {
  players?: number;
}

export function eightsOutcome(s: EightsState): Outcome | null {
  if (!s.result) return null;
  const { winner, points } = s.result;
  const returns = s.hands.map((h, p) =>
    p === winner ? points / 10 : -h.reduce((a, c) => a + penalty(c), 0) / 10,
  );
  return { returns, winners: [winner], draw: false, reason: s.result.blocked ? 'blocked' : 'out' };
}

export const eightsEnv: GameEnvironment<EightsState, string, EightsState, EightsConfig> = {
  id: 'crazy-eights',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (config, seed) => createEights(seed >>> 0, config?.players ?? 2),
  reset: (seed) => createEights(seed >>> 0, 2),
  getObservation: (s, player) => ({
    ...s,
    stock: s.stock.map(() => -1),
    hands: s.hands.map((h, i) => (i === player || s.result ? h : h.map(() => -1))),
  }),
  getLegalActions: (s, player) =>
    s.result || (player !== undefined && player !== s.toAct) ? [] : legalEightsActions(s),
  applyAction: applyEightsAction,
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.result !== null,
  getOutcome: eightsOutcome,
  getReward: (s, p) => eightsOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidEightsState(parsed)) throw new Error('Invalid crazy eights state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<EightsState, string> = {
  env: eightsEnv as unknown as AiBundle<EightsState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
