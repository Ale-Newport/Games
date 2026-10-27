/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, kakuroActions } from './ai';
import { isValidKakuroState, newKakuro, placeDigit, type KakuroState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface KakuroConfig {
  difficulty?: string;
}

export function kakuroOutcome(s: KakuroState): Outcome | null {
  if (!s.solved && kakuroActions(s).length) return null;
  const correct = s.values.filter(
    (v, c) => v && !s.puzzle.given[c] && v === s.puzzle.solution[c],
  ).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [correct],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const kakuroEnv: GameEnvironment<KakuroState, string, KakuroState, KakuroConfig> = {
  id: 'kakuro',
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
  createInitialState: (config, seed) => newKakuro(config?.difficulty ?? 'easy', seed >>> 0),
  reset: (seed) => newKakuro('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => kakuroActions(s),
  applyAction: (s, a) => {
    if (!kakuroActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [cell, digit] = a.split(':').map(Number) as [number, number];
    return placeDigit(s, cell, digit);
  },
  getCurrentPlayer: (s) => (kakuroOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => kakuroOutcome(s) !== null,
  getOutcome: kakuroOutcome,
  getReward: (s) => kakuroOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidKakuroState(parsed)) throw new Error('Invalid kakuro state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<KakuroState, string> = {
  env: kakuroEnv as unknown as AiBundle<KakuroState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
