/** The AI environment: one puzzle per episode (config `{ level }`), solved or out of moves. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, MOVE_LIMIT, distanceToExit, klotskiActions } from './ai';
import {
  LEVELS,
  isValidKlotskiState,
  newKlotski,
  relocate,
  type KlotskiState,
  type Level,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface KlotskiConfig {
  level?: string;
}

export function klotskiOutcome(s: KlotskiState): Outcome | null {
  if (!s.solved && s.steps.length < MOVE_LIMIT) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.moves : -distanceToExit(s.board) * 100],
    reason: s.solved ? 'escaped' : 'move-limit',
  };
}

const levelOf = (config?: KlotskiConfig): Level =>
  (LEVELS as readonly string[]).includes(config?.level ?? '') ? (config!.level as Level) : 'easy';

export const klotskiEnv: GameEnvironment<KlotskiState, string, KlotskiState, KlotskiConfig> = {
  id: 'klotski',
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
  createInitialState: (config, seed) => newKlotski(levelOf(config), seed >>> 0),
  reset: (seed) => newKlotski('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => klotskiActions(s),
  applyAction: (s, a) => {
    if (!klotskiActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [from, to] = a.split(':').map(Number) as [number, number];
    return relocate(s, from, to);
  },
  getCurrentPlayer: (s) => (klotskiOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => klotskiOutcome(s) !== null,
  getOutcome: klotskiOutcome,
  getReward: (s) => klotskiOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidKlotskiState(parsed)) throw new Error('Invalid sliding blocks state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<KlotskiState, string> = {
  env: klotskiEnv as unknown as AiBundle<KlotskiState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
