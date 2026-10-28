/** The AI environment: one puzzle per episode (config `{ level }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, markOf, queensActions } from './ai';
import { QUEEN, isValidQueensState, newQueens, setMarks, type QueensState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface QueensConfig {
  level?: string;
}

export function queensOutcome(s: QueensState): Outcome | null {
  if (!s.solved && queensActions(s).length) return null;
  const right = s.puzzle.solution.filter((k, r) => s.marks[r * s.puzzle.size + k] === QUEEN).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [right],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const queensEnv: GameEnvironment<QueensState, string, QueensState, QueensConfig> = {
  id: 'queens',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) => newQueens(config?.level ?? 'easy', seed >>> 0),
  reset: (seed) => newQueens('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => queensActions(s),
  applyAction: (s, a) => {
    if (!queensActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return setMarks(s, [{ cell: Number(a.split(':')[0]), mark: markOf(a) }]);
  },
  getCurrentPlayer: (s) => (queensOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => queensOutcome(s) !== null,
  getOutcome: queensOutcome,
  getReward: (s) => queensOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidQueensState(parsed)) throw new Error('Invalid queens state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<QueensState, string> = {
  env: queensEnv as unknown as AiBundle<QueensState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
