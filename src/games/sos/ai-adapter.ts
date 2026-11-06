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
  applySosAction,
  createSosState,
  isValidSosState,
  legalSosActions,
  type SosState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function sosOutcome(s: SosState): Outcome | null {
  if (!s.result) return null;
  if (s.result.winner === null)
    return { returns: [0, 0], winners: [], draw: true, reason: 'points', scores: s.scores };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'points',
    scores: s.scores,
  };
}

/** Index: cell·2 + (0 for S, 1 for O). */
export const sosCodec = {
  size: N * N * 2,
  encode: (a: string): number => Number(a.slice(1)) * 2 + (a[0] === 'O' ? 1 : 0),
  decode: (i: number): string => `${i % 2 ? 'O' : 'S'}${Math.floor(i / 2)}`,
};

export const sosEnv: GameEnvironment<SosState, string> = {
  id: 'sos',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: sosCodec.size,
    observationShape: [2, N, N],
  },
  createInitialState: () => createSosState(),
  reset: () => createSosState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalSosActions(s),
  applyAction: (s, a) => applySosAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: sosOutcome,
  getReward: (s, p) => sosOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSosState(parsed)) throw new Error('Invalid sos state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.cells.map((v) => v || '.').join('')}|${s.toMove}|${s.scores.join(',')}`,
  encodeAction: sosCodec.encode,
  decodeAction: (i) => sosCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s) => {
    // Planes: S cells, O cells.
    const data = new Array<number>(2 * N * N).fill(0);
    s.cells.forEach((v, p) => {
      if (v === 'S') data[p] = 1;
      else if (v === 'O') data[N * N + p] = 1;
    });
    return { shape: [2, N, N], data };
  },
};

export const bundle: AiBundle<SosState, string> = { env: sosEnv, agents: AGENT_PRESETS };
export default bundle;
