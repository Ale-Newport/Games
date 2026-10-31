/** The AI environment: one game per episode, 1–4 seats (config `{ players }`, 2 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidFarkle, legalActions, newFarkle, type FarkleGame } from './match';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface FarkleConfig {
  players?: number;
}

export function farkleOutcome(g: FarkleGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.scores.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: [...g.scores],
    reason: 'target-reached',
  };
}

export const farkleEnv: GameEnvironment<FarkleGame, string, FarkleGame, FarkleConfig> = {
  id: 'farkle',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 4,
    // Dice come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) =>
    newFarkle([1, 2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newFarkle(2, seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: farkleOutcome,
  getReward: (g, seat) => farkleOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidFarkle(parsed)) throw new Error('Invalid Farkle state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<FarkleGame, string> = {
  env: farkleEnv as unknown as AiBundle<FarkleGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
