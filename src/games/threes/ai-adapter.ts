/** The AI environment: one game per episode (config `{ level }`), until no move is left. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { MOVE_LIMIT, triosActions, triosAgents } from './ai';
import type { Dir } from './engine';
import { isValidTriosState, newTrios, play, triosScore, type TriosGameState } from './play';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface TriosConfig {
  level?: string;
}

export function triosOutcome(s: TriosGameState): Outcome | null {
  if (triosActions(s).length) return null;
  return {
    returns: [s.won ? 1 : 0],
    winners: s.won ? [0] : [],
    draw: false,
    scores: [triosScore(s)],
    reason: s.moves >= MOVE_LIMIT ? 'move-limit' : 'no-moves',
  };
}

export const triosEnv: GameEnvironment<TriosGameState, string, TriosGameState, TriosConfig> = {
  id: 'threes',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    // New tiles come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) => newTrios(config?.level ?? 'classic', seed >>> 0),
  reset: (seed) => newTrios('classic', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => triosActions(s),
  applyAction: (s, a) => {
    if (!(triosActions(s) as string[]).includes(a))
      throw new IllegalActionError(`Illegal action ${a}`);
    return play(s, a as Dir);
  },
  getCurrentPlayer: (s) => (triosOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => triosOutcome(s) !== null,
  getOutcome: triosOutcome,
  getReward: (s) => triosOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidTriosState(parsed)) throw new Error('Invalid trios state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<TriosGameState, string> = {
  env: triosEnv as unknown as AiBundle<TriosGameState, string>['env'],
  agents: triosAgents(),
};
export default bundle;
