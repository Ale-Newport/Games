/** The AI environment: one puzzle per episode (config `{ level }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, trailActions } from './ai';
import { agreed, extend, isValidTrailState, newTrail, type TrailState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface TrailConfig {
  level?: string;
}

export function trailOutcome(s: TrailState): Outcome | null {
  if (!s.solved && trailActions(s).length) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [agreed(s)],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const trailEnv: GameEnvironment<TrailState, string, TrailState, TrailConfig> = {
  id: 'zip',
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
  createInitialState: (config, seed) => newTrail(config?.level ?? 'easy', seed >>> 0),
  reset: (seed) => newTrail('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => trailActions(s),
  applyAction: (s, a) => {
    if (!trailActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return extend(s, Number(a.slice(2)));
  },
  getCurrentPlayer: (s) => (trailOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => trailOutcome(s) !== null,
  getOutcome: trailOutcome,
  getReward: (s) => trailOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidTrailState(parsed)) throw new Error('Invalid number trail state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<TrailState, string> = {
  env: trailEnv as unknown as AiBundle<TrailState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
