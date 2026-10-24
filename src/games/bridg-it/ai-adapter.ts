import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  S,
  applyGaleAction,
  createGaleState,
  isValidGaleState,
  legalGaleActions,
  type GaleState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function galeOutcome(s: GaleState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

export const galeEnv: GameEnvironment<GaleState, string> = {
  id: 'bridg-it',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: S * S,
    observationShape: [2, S, S],
  },
  createInitialState: () => createGaleState(),
  reset: () => createGaleState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalGaleActions(s),
  applyAction: (s, a) => applyGaleAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: galeOutcome,
  getReward: (s, p) => galeOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidGaleState(parsed)) throw new Error('Invalid gale state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.bridges.join('')}|${s.toMove}`,
  encodeAction: (a) => Number(a),
  decodeAction: (i) => String(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // Planes: the observer's bridges, then the opponent's.
    const data = new Array<number>(2 * S * S).fill(0);
    s.bridges.forEach((x, p) => {
      if (x !== 0) data[(x - 1 === player ? 0 : S * S) + p] = 1;
    });
    return { shape: [2, S, S], data };
  },
};

export const bundle: AiBundle<GaleState, string> = { env: galeEnv, agents: AGENT_PRESETS };
export default bundle;
