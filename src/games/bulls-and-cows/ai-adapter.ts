/**
 * The AI environment is the duel: each seat cracks the number the other side holds, in turns; the
 * second seat gets one last guess after the first cracks it. A seat sees its own number, never the
 * one it must crack (until the end). Actions are numbers written as digits (`0123`).
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, bullsActions, parseCode } from './ai';
import {
  isCode,
  isValidBullsState,
  makeGuess,
  newBulls,
  variantOf,
  type BullsState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface BullsConfig {
  variant?: string;
}

export function bullsOutcome(s: BullsState): Outcome | null {
  if (s.status !== 'done') return null;
  const scores = s.guesses.map((g) => g.length);
  if (s.winner === null)
    return { returns: [0, 0], winners: [], draw: true, scores, reason: 'draw' };
  return {
    returns: s.winner === 0 ? [1, -1] : [-1, 1],
    winners: [s.winner],
    draw: false,
    scores,
    reason: 'cracked',
  };
}

export const bullsEnv: GameEnvironment<BullsState, string, BullsState, BullsConfig> = {
  id: 'bulls-and-cows',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (config, seed) => newBulls(config?.variant ?? 'four', 'duel', seed >>> 0),
  reset: (seed) => newBulls('four', 'duel', seed >>> 0),
  getObservation: (s, player) =>
    s.status === 'done'
      ? s
      : {
          ...s,
          secrets: s.secrets.map((x, i) => (i === player ? x.map(() => -1) : x)),
        },
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.turn ? [] : bullsActions(s),
  applyAction: (s, a) => {
    if (s.status !== 'playing' || !/^\d+$/.test(a) || !isCode(variantOf(s), parseCode(a)))
      throw new IllegalActionError(`Illegal action ${a}`);
    return makeGuess(s, parseCode(a));
  },
  getCurrentPlayer: (s) => (s.status === 'done' ? NO_PLAYER : s.turn),
  isTerminal: (s) => s.status === 'done',
  getOutcome: bullsOutcome,
  getReward: (s, p) => bullsOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidBullsState(parsed)) throw new Error('Invalid bulls and cows state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<BullsState, string> = {
  env: bullsEnv as unknown as AiBundle<BullsState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
