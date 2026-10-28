/** The AI environment: one puzzle per episode (config `{ level }`), solved or out of moves. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, MOVE_LIMIT, blockers, jamActions } from './ai';
import { isValidJamState, move, newJam, type JamState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface JamConfig {
  level?: string;
}

export function jamOutcome(s: JamState): Outcome | null {
  if (!s.solved && s.moves < MOVE_LIMIT) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.moves : -blockers(s)],
    reason: s.solved ? 'freed' : 'move-limit',
  };
}

export const jamEnv: GameEnvironment<JamState, string, JamState, JamConfig> = {
  id: 'traffic-jam',
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
  createInitialState: (config, seed) => newJam(config?.level ?? 'easy', seed >>> 0),
  reset: (seed) => newJam('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => jamActions(s),
  applyAction: (s, a) => {
    if (!jamActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [i, to] = a.split(':').map(Number) as [number, number];
    return move(s, i, to);
  },
  getCurrentPlayer: (s) => (jamOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => jamOutcome(s) !== null,
  getOutcome: jamOutcome,
  getReward: (s) => jamOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidJamState(parsed)) throw new Error('Invalid traffic jam state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<JamState, string> = {
  env: jamEnv as unknown as AiBundle<JamState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
