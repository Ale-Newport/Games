/** The AI environment: one tower per episode (config `{ level }`), moved or out of moves. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, MOVE_LIMIT, hanoiActions } from './ai';
import { isValidHanoiState, moveDisk, newHanoi, specOf, type HanoiState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface HanoiConfig {
  level?: string;
}

export function hanoiOutcome(s: HanoiState): Outcome | null {
  if (!s.solved && s.moves < MOVE_LIMIT) return null;
  const home = s.position.filter((p) => p === specOf(s).pegs - 1).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.moves : home - specOf(s).disks],
    reason: s.solved ? 'moved' : 'move-limit',
  };
}

export const hanoiEnv: GameEnvironment<HanoiState, string, HanoiState, HanoiConfig> = {
  id: 'towers-of-hanoi',
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
  createInitialState: (config) => newHanoi(config?.level ?? 'three'),
  reset: () => newHanoi('three'),
  getObservation: (s) => s,
  getLegalActions: (s) => hanoiActions(s),
  applyAction: (s, a) => {
    if (!hanoiActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [x, y] = a.split('>').map(Number) as [number, number];
    return moveDisk(s, x, y);
  },
  getCurrentPlayer: (s) => (hanoiOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => hanoiOutcome(s) !== null,
  getOutcome: hanoiOutcome,
  getReward: (s) => hanoiOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidHanoiState(parsed)) throw new Error('Invalid hanoi state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<HanoiState, string> = {
  env: hanoiEnv as unknown as AiBundle<HanoiState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
