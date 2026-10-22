import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyTeekoAction,
  createTeekoState,
  isValidTeekoState,
  legalTeekoActions,
  type TeekoState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function teekoOutcome(s: TeekoState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'shape',
  };
}

/** Index: drop on p → p; move f → t → 25 + 25f + t. */
export const teekoCodec = {
  size: 25 + 625,
  encode(a: string): number {
    const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(a);
    if (!m) throw new Error(`Malformed Teeko action ${a}`);
    return m[2] === undefined ? Number(m[1]) : 25 + Number(m[1]) * 25 + Number(m[2]);
  },
  decode: (i: number) => (i < 25 ? String(i) : `${Math.floor((i - 25) / 25)}-${(i - 25) % 25}`),
};

export const teekoEnv: GameEnvironment<TeekoState, string> = {
  id: 'teeko',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: teekoCodec.size,
    observationShape: [2, 5, 5],
  },
  createInitialState: () => createTeekoState(),
  reset: () => createTeekoState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalTeekoActions(s),
  applyAction: (s, a) => applyTeekoAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: teekoOutcome,
  getReward: (s, p) => teekoOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidTeekoState(parsed)) throw new Error('Invalid teeko state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => s.keys[s.keys.length - 1]!,
  encodeAction: teekoCodec.encode,
  decodeAction: (i) => teekoCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    const mine = player === 0 ? 1 : 2;
    const data = new Array<number>(50).fill(0);
    s.board.forEach((v, p) => {
      if (v === mine) data[p] = 1;
      else if (v !== 0) data[25 + p] = 1;
    });
    return { shape: [2, 5, 5], data };
  },
};

export const bundle: AiBundle<TeekoState, string> = { env: teekoEnv, agents: AGENT_PRESETS };
export default bundle;
