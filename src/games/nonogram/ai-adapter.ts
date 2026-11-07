/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or not. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, nonoActions } from './ai';
import { EMPTY, FILLED, isValidNonoState, newNonogram, setCells, type NonoState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface NonoConfig {
  difficulty?: string;
}

export function nonoOutcome(s: NonoState): Outcome | null {
  if (!s.solved && nonoActions(s).length) return null;
  const right = s.grid.filter((c, i) => c && (c === FILLED) === s.puzzle.solution[i]).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [right],
    reason: s.solved ? 'solved' : 'wrong',
  };
}

export const nonogramEnv: GameEnvironment<NonoState, string, NonoState, NonoConfig> = {
  id: 'nonogram',
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
  createInitialState: (config, seed) => newNonogram(config?.difficulty ?? 'easy', seed >>> 0),
  reset: (seed) => newNonogram('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => nonoActions(s),
  applyAction: (s, a) => {
    if (!nonoActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [cell, v] = a.split(':') as [string, string];
    return setCells(s, [Number(cell)], v === 'f' ? FILLED : EMPTY);
  },
  getCurrentPlayer: (s) => (nonoOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => nonoOutcome(s) !== null,
  getOutcome: nonoOutcome,
  getReward: (s) => nonoOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidNonoState(parsed)) throw new Error('Invalid nonogram state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<NonoState, string> = {
  env: nonogramEnv as unknown as AiBundle<NonoState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
