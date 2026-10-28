/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, hashiActions } from './ai';
import { isValidHashiState, newHashi, setBridge, type HashiState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface HashiConfig {
  difficulty?: string;
}

export function hashiOutcome(s: HashiState): Outcome | null {
  if (!s.solved && hashiActions(s).length) return null;
  const right = s.bridges.filter((b, q) => b && b === s.puzzle.solution[q]).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [right],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const hashiEnv: GameEnvironment<HashiState, string, HashiState, HashiConfig> = {
  id: 'hashiwokakero',
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
  createInitialState: (config, seed) => newHashi(config?.difficulty ?? 'easy', seed >>> 0),
  reset: (seed) => newHashi('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => hashiActions(s),
  applyAction: (s, a) => {
    if (!hashiActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [q, n] = a.split(':').map(Number) as [number, number];
    return setBridge(s, q, n);
  },
  getCurrentPlayer: (s) => (hashiOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => hashiOutcome(s) !== null,
  getOutcome: hashiOutcome,
  getReward: (s) => hashiOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidHashiState(parsed)) throw new Error('Invalid hashiwokakero state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<HashiState, string> = {
  env: hashiEnv as unknown as AiBundle<HashiState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
