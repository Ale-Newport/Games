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
  applyKonaneAction,
  createKonaneState,
  isValidKonaneState,
  legalKonaneActions,
  type KonaneState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function konaneOutcome(s: KonaneState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'no-move',
  };
}

/**
 * Index: removal of cell p → p; jump from f landing k·2 cells away in direction d (0 up, 1 down,
 * 2 left, 3 right; k = 1, 2) → 36 + (f·4 + d)·2 + (k − 1). On 6×6 a stone jumps at most twice.
 */
export const konaneCodec = {
  size: N * N + N * N * 4 * 2,
  encode(a: string): number {
    if (a.startsWith('x')) return Number(a.slice(1));
    const [f, t] = a.split('-').map(Number) as [number, number];
    const vertical = Math.abs(t - f) >= N;
    const dist = vertical ? Math.abs(t - f) / N : Math.abs(t - f);
    const d = vertical ? (t < f ? 0 : 1) : t < f ? 2 : 3;
    return N * N + (f * 4 + d) * 2 + (dist / 2 - 1);
  },
  decode(i: number): string {
    if (i < N * N) return `x${i}`;
    const j = i - N * N;
    const k = (j % 2) + 1;
    const f = Math.floor(j / 8);
    const d = Math.floor(j / 2) % 4;
    const delta = [-N, N, -1, 1][d]! * 2 * k;
    return `${f}-${f + delta}`;
  },
};

export const konaneEnv: GameEnvironment<KonaneState, string> = {
  id: 'konane',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: konaneCodec.size,
    observationShape: [2, N, N],
  },
  createInitialState: () => createKonaneState(),
  reset: () => createKonaneState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalKonaneActions(s),
  applyAction: (s, a) => applyKonaneAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: konaneOutcome,
  getReward: (s, p) => konaneOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidKonaneState(parsed)) throw new Error('Invalid konane state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
  encodeAction: konaneCodec.encode,
  decodeAction: (i) => konaneCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    const mine = player === 0 ? 1 : 2;
    const data = new Array<number>(2 * N * N).fill(0);
    s.board.forEach((v, p) => {
      if (v === mine) data[p] = 1;
      else if (v !== 0) data[N * N + p] = 1;
    });
    return { shape: [2, N, N], data };
  },
};

export const bundle: AiBundle<KonaneState, string> = {
  env: konaneEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
