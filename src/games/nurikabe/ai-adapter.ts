/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, nuriActions } from './ai';
import { LAND, SEA, isValidNuriState, newNurikabe, setMarks, type NuriState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface NuriConfig {
  difficulty?: string;
}

export function nuriOutcome(s: NuriState): Outcome | null {
  if (!s.solved && nuriActions(s).length) return null;
  const right = s.marks.filter(
    (m, c) => m && !s.puzzle.numbers[c] && (m === SEA) === s.puzzle.solution[c],
  ).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [right],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const nurikabeEnv: GameEnvironment<NuriState, string, NuriState, NuriConfig> = {
  id: 'nurikabe',
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
  createInitialState: (config, seed) => newNurikabe(config?.difficulty ?? 'easy', seed >>> 0),
  reset: (seed) => newNurikabe('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => nuriActions(s),
  applyAction: (s, a) => {
    if (!nuriActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [cell, mark] = a.split(':') as [string, string];
    return setMarks(s, [{ cell: Number(cell), mark: mark === 's' ? SEA : LAND }]);
  },
  getCurrentPlayer: (s) => (nuriOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => nuriOutcome(s) !== null,
  getOutcome: nuriOutcome,
  getReward: (s) => nuriOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidNuriState(parsed)) throw new Error('Invalid nurikabe state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<NuriState, string> = {
  env: nurikabeEnv as unknown as AiBundle<NuriState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
