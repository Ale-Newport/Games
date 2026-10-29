/** The AI environment: one level per episode (config `{ tier, index }`), solved or out of moves. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, MOVE_LIMIT, sokobanActions } from './ai';
import {
  isValidSokobanState,
  levelCount,
  newSokoban,
  stepPlayer,
  type Dir,
  type SokobanState,
  type Tier,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface SokobanConfig {
  tier?: Tier;
  index?: number;
}

export function sokobanOutcome(s: SokobanState): Outcome | null {
  if (!s.solved && s.moves < MOVE_LIMIT) return null;
  const onGoal = s.boxes.filter((b) => s.warehouse.goals.includes(b)).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.pushes : onGoal - s.boxes.length],
    reason: s.solved ? 'solved' : 'move-limit',
  };
}

export const sokobanEnv: GameEnvironment<SokobanState, string, SokobanState, SokobanConfig> = {
  id: 'sokoban',
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
  createInitialState: (config, seed) => {
    const tier = config?.tier ?? 'easy';
    return newSokoban(tier, config?.index ?? (seed >>> 0) % levelCount(tier));
  },
  reset: (seed) => newSokoban('easy', (seed >>> 0) % levelCount('easy')),
  getObservation: (s) => s,
  getLegalActions: (s) => sokobanActions(s),
  applyAction: (s, a) => {
    if (!sokobanActions(s).includes(a as Dir)) throw new IllegalActionError(`Illegal action ${a}`);
    return stepPlayer(s, a as Dir);
  },
  getCurrentPlayer: (s) => (sokobanOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => sokobanOutcome(s) !== null,
  getOutcome: sokobanOutcome,
  getReward: (s) => sokobanOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSokobanState(parsed)) throw new Error('Invalid sokoban state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<SokobanState, string> = {
  env: sokobanEnv as unknown as AiBundle<SokobanState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
