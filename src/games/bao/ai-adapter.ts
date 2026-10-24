import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  RING,
  applyBaoAction,
  createBaoState,
  isValidBaoState,
  legalBaoActions,
  type BaoState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function baoOutcome(s: BaoState): Outcome | null {
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

/** Index: ring index·2 + (0 clockwise "+", 1 counter-clockwise "−"). */
export const baoCodec = {
  size: RING * 2,
  encode: (a: string): number => Number(a.slice(0, -1)) * 2 + (a.endsWith('+') ? 0 : 1),
  decode: (i: number): string => `${Math.floor(i / 2)}${i % 2 ? '-' : '+'}`,
};

export const baoEnv: GameEnvironment<BaoState, string> = {
  id: 'bao',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: baoCodec.size,
    observationShape: [2, RING],
  },
  createInitialState: () => createBaoState(),
  reset: () => createBaoState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalBaoActions(s),
  applyAction: (s, a) => applyBaoAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: baoOutcome,
  getReward: (s, p) => baoOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidBaoState(parsed)) throw new Error('Invalid bao state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.pits.join(',')}|${s.toMove}`,
  encodeAction: baoCodec.encode,
  decodeAction: (i) => baoCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // The observer's ring, then the opponent's, seeds scaled by the 64 in play.
    const mine = s.pits.slice((player as number) * RING, ((player as number) + 1) * RING);
    const theirs = s.pits.slice((1 - (player as number)) * RING, (2 - (player as number)) * RING);
    return { shape: [2, RING], data: [...mine, ...theirs].map((x) => x / 64) };
  },
};

export const bundle: AiBundle<BaoState, string> = { env: baoEnv, agents: AGENT_PRESETS };
export default bundle;
