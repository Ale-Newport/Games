/** The AI environment: one game per episode, two seats. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidPig, legalActions, newPig, type PigGame } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function pigOutcome(g: PigGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.winner === 0 ? [1, -1] : [-1, 1],
    winners: [g.winner],
    draw: false,
    scores: [g.scores[0], g.scores[1]],
    reason: 'reached-100',
  };
}

export const pigEnv: GameEnvironment<PigGame, string, PigGame, undefined> = {
  id: 'pig',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    // Dice come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => newPig(seed >>> 0),
  reset: (seed) => newPig(seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: pigOutcome,
  getReward: (g, seat) => pigOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidPig(parsed)) throw new Error('Invalid Pig state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<PigGame, string> = {
  env: pigEnv as unknown as AiBundle<PigGame, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'optimal',
};
export default bundle;
