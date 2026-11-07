/** The AI environment: one match per episode (config `{ matchTo }`, 1 by default), two seats. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, actor, isValidMatch, legalActions, newMatch, type MatchState } from './match';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface BackgammonConfig {
  matchTo?: number;
}

export function backgammonOutcome(s: MatchState): Outcome | null {
  if (s.phase !== 'match-over') return null;
  const winner = s.score[0] >= s.matchTo ? 0 : 1;
  return {
    returns: winner === 0 ? [1, -1] : [-1, 1],
    winners: [winner],
    draw: false,
    scores: [s.score[0], s.score[1]],
    reason: s.lastWin?.dropped
      ? 'dropped'
      : (['single', 'single', 'gammon', 'backgammon'][s.lastWin?.kind ?? 1] ?? 'single'),
  };
}

const lengthOf = (config?: BackgammonConfig) =>
  [1, 3, 5, 7].includes(config?.matchTo ?? 1) ? (config?.matchTo ?? 1) : 1;

export const backgammonEnv: GameEnvironment<MatchState, string, MatchState, BackgammonConfig> = {
  id: 'backgammon',
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
  createInitialState: (config, seed) => newMatch(lengthOf(config), seed >>> 0),
  reset: (seed) => newMatch(1, seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => (s.phase === 'match-over' ? [] : legalActions(s)),
  applyAction: (s, a) => {
    if (!legalActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(s, a);
  },
  getCurrentPlayer: (s) => (s.phase === 'match-over' ? NO_PLAYER : actor(s)),
  isTerminal: (s) => s.phase === 'match-over',
  getOutcome: backgammonOutcome,
  getReward: (s, seat) => backgammonOutcome(s)?.returns[seat] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidMatch(parsed)) throw new Error('Invalid backgammon state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<MatchState, string> = {
  env: backgammonEnv as unknown as AiBundle<MatchState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
