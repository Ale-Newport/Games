/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, slitherActions } from './ai';
import {
  CROSS,
  LINE,
  isValidSlitherState,
  newSlither,
  setEdges,
  type SlitherState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface SlitherConfig {
  difficulty?: string;
}

export function slitherOutcome(s: SlitherState): Outcome | null {
  if (!s.solved && slitherActions(s).length) return null;
  const right = s.edges.filter((v, e) => v && (v === LINE) === s.puzzle.solution[e]).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [right],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const slitherEnv: GameEnvironment<SlitherState, string, SlitherState, SlitherConfig> = {
  id: 'slitherlink',
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
  createInitialState: (config, seed) => newSlither(config?.difficulty ?? 'easy', seed >>> 0),
  reset: (seed) => newSlither('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => slitherActions(s),
  applyAction: (s, a) => {
    if (!slitherActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [edge, mark] = a.split(':') as [string, string];
    return setEdges(s, [{ edge: Number(edge), value: mark === 'l' ? LINE : CROSS }]);
  },
  getCurrentPlayer: (s) => (slitherOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => slitherOutcome(s) !== null,
  getOutcome: slitherOutcome,
  getReward: (s) => slitherOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSlitherState(parsed)) throw new Error('Invalid slitherlink state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<SlitherState, string> = {
  env: slitherEnv as unknown as AiBundle<SlitherState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
