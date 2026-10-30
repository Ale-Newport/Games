/** The AI environment: one match per episode (config `{ matchTo }`, 1 by default), two seats. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidNarde, legalActions, newNarde, type NardeMatch } from './match';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface NardeConfig {
  matchTo?: number;
}

export function nardeOutcome(s: NardeMatch): Outcome | null {
  if (s.phase !== 'match-over') return null;
  const winner = s.score[0] >= s.matchTo ? 0 : 1;
  return {
    returns: winner === 0 ? [1, -1] : [-1, 1],
    winners: [winner],
    draw: false,
    scores: [s.score[0], s.score[1]],
    reason: s.lastWin?.mars ? 'mars' : 'oin',
  };
}

const lengthOf = (config?: NardeConfig) =>
  [1, 3, 5].includes(config?.matchTo ?? 1) ? (config?.matchTo ?? 1) : 1;

export const nardeEnv: GameEnvironment<NardeMatch, string, NardeMatch, NardeConfig> = {
  id: 'narde',
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
  createInitialState: (config, seed) => newNarde(lengthOf(config), seed >>> 0),
  reset: (seed) => newNarde(1, seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => legalActions(s),
  applyAction: (s, a) => {
    if (!legalActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(s, a);
  },
  getCurrentPlayer: (s) => (s.phase === 'match-over' ? NO_PLAYER : s.turn),
  isTerminal: (s) => s.phase === 'match-over',
  getOutcome: nardeOutcome,
  getReward: (s, seat) => nardeOutcome(s)?.returns[seat] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidNarde(parsed)) throw new Error('Invalid narde state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<NardeMatch, string> = {
  env: nardeEnv as unknown as AiBundle<NardeMatch, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
