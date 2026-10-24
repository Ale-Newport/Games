import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  N,
  applyAmazonsAction,
  createAmazonsState,
  isValidAmazonsState,
  legalAmazonsActions,
  parseMove,
  type AmazonsState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const CELLS = N * N;

export function amazonsOutcome(s: AmazonsState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

/** Index: (from·100 + to)·100 + arrow. */
export const amazonsCodec = {
  size: CELLS * CELLS * CELLS,
  encode: (a: string): number => {
    const [f, t, x] = parseMove(a);
    return (f * CELLS + t) * CELLS + x;
  },
  decode: (i: number): string =>
    `${Math.floor(i / (CELLS * CELLS))}-${Math.floor(i / CELLS) % CELLS}-${i % CELLS}`,
};

export const amazonsEnv: GameEnvironment<AmazonsState, string> = {
  id: 'amazons',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: amazonsCodec.size,
    observationShape: [3, N, N],
  },
  createInitialState: () => createAmazonsState(),
  reset: () => createAmazonsState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalAmazonsActions(s),
  applyAction: (s, a) => applyAmazonsAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: amazonsOutcome,
  getReward: (s, p) => amazonsOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidAmazonsState(parsed)) throw new Error('Invalid amazons state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
  encodeAction: amazonsCodec.encode,
  decodeAction: (i) => amazonsCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // Planes: the observer's amazons, the opponent's, burned squares.
    const data = new Array<number>(3 * CELLS).fill(0);
    s.board.forEach((x, c) => {
      if (x === 3) data[2 * CELLS + c] = 1;
      else if (x !== 0) data[(x - 1 === player ? 0 : CELLS) + c] = 1;
    });
    return { shape: [3, N, N], data };
  },
};

export const bundle: AiBundle<AmazonsState, string> = { env: amazonsEnv, agents: AGENT_PRESETS };
export default bundle;
