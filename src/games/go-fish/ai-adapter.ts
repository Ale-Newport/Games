/**
 * The AI environment plays a whole game per episode (two players by default, up to four via the
 * config); each seat's return is its books minus the others' average, in units of 13 books.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyFishAction,
  createFish,
  isValidFishState,
  legalFishActions,
  type FishState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface FishConfig {
  players?: number;
}

export function fishOutcome(s: FishState): Outcome | null {
  if (!s.over) return null;
  const counts = s.books.map((b) => b.length);
  const total = counts.reduce((a, b) => a + b, 0);
  const n = s.players;
  const returns = counts.map((c) => (c - (total - c) / (n - 1)) / 13);
  return {
    returns,
    winners: s.winners,
    draw: s.winners.length === n,
    scores: counts,
    reason: 'books',
  };
}

export const fishEnv: GameEnvironment<FishState, string, FishState, FishConfig> = {
  id: 'go-fish',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (config, seed) => createFish(seed >>> 0, config?.players ?? 2),
  reset: (seed) => createFish(seed >>> 0, 2),
  getObservation: (s, player) => ({
    ...s,
    pond: s.pond.map(() => -1),
    hands: s.hands.map((h, i) => (i === player || s.over ? h : h.map(() => -1))),
  }),
  getLegalActions: (s, player) =>
    s.over || (player !== undefined && player !== s.toAct) ? [] : legalFishActions(s),
  applyAction: applyFishAction,
  getCurrentPlayer: (s) => (s.over ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.over,
  getOutcome: fishOutcome,
  getReward: (s, p) => fishOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidFishState(parsed)) throw new Error('Invalid go fish state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<FishState, string> = {
  env: fishEnv as unknown as AiBundle<FishState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
