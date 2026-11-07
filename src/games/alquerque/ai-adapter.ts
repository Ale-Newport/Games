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
  applyAlquerqueAction,
  createAlquerqueState,
  isValidAlquerqueState,
  legalAlquerqueActions,
  type AlquerqueState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function alquerqueOutcome(s: AlquerqueState): Outcome | null {
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

/** Index: from·25 + to. */
export const alquerqueCodec = {
  size: N * N * N * N,
  encode(a: string): number {
    const [f, t] = a.split('-').map(Number) as [number, number];
    return f * N * N + t;
  },
  decode: (i: number): string => `${Math.floor(i / (N * N))}-${i % (N * N)}`,
};

export const alquerqueEnv: GameEnvironment<AlquerqueState, string> = {
  id: 'alquerque',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: alquerqueCodec.size,
    observationShape: [2, N, N],
  },
  createInitialState: () => createAlquerqueState(),
  reset: () => createAlquerqueState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalAlquerqueActions(s),
  applyAction: (s, a) => applyAlquerqueAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: alquerqueOutcome,
  getReward: (s, p) => alquerqueOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidAlquerqueState(parsed)) throw new Error('Invalid alquerque state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}|${s.chain ?? '-'}`,
  encodeAction: alquerqueCodec.encode,
  decodeAction: (i) => alquerqueCodec.decode(i),
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

export const bundle: AiBundle<AlquerqueState, string> = {
  env: alquerqueEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
