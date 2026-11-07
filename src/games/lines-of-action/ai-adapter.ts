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
  applyLoaAction,
  createLoaState,
  isValidLoaState,
  legalLoaActions,
  parseMove,
  type LoaState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const CELLS = N * N;

export function loaOutcome(s: LoaState): Outcome | null {
  if (!s.result) return null;
  if (s.result.winner === null)
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

/** Index: from·64 + to. */
export const loaCodec = {
  size: CELLS * CELLS,
  encode: (a: string): number => {
    const [f, t] = parseMove(a);
    return f * CELLS + t;
  },
  decode: (i: number): string => `${Math.floor(i / CELLS)}-${i % CELLS}`,
};

export const linesOfActionEnv: GameEnvironment<LoaState, string> = {
  id: 'lines-of-action',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: loaCodec.size,
    observationShape: [2, N, N],
  },
  createInitialState: () => createLoaState(),
  reset: () => createLoaState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalLoaActions(s),
  applyAction: (s, a) => applyLoaAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: loaOutcome,
  getReward: (s, p) => loaOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidLoaState(parsed)) throw new Error('Invalid lines-of-action state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
  encodeAction: loaCodec.encode,
  decodeAction: (i) => loaCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // Planes: the observer's pieces, then the opponent's.
    const data = new Array<number>(2 * CELLS).fill(0);
    s.board.forEach((x, c) => {
      if (x !== 0) data[(x - 1 === player ? 0 : CELLS) + c] = 1;
    });
    return { shape: [2, N, N], data };
  },
};

export const bundle: AiBundle<LoaState, string> = { env: linesOfActionEnv, agents: AGENT_PRESETS };
export default bundle;
