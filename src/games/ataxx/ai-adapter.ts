import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyAtaxxAction,
  createAtaxxState,
  isValidAtaxxState,
  legalAtaxxActions,
  type AtaxxState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function ataxxOutcome(s: AtaxxState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return {
      returns: [0, 0],
      winners: [],
      draw: true,
      reason: s.result.reason,
      scores: s.result.counts,
    };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'count',
    scores: s.result.counts,
  };
}

/** Index: clone onto t → t; jump f → t → 49 + 49f + t; pass → 49 + 49². */
export const ataxxCodec = {
  size: 49 + 49 * 49 + 1,
  encode(a: string): number {
    if (a === 'pass') return 49 + 49 * 49;
    if (a.startsWith('+')) return Number(a.slice(1));
    const [f, t] = a.split('-').map(Number);
    return 49 + f! * 49 + t!;
  },
  decode(i: number): string {
    if (i === 49 + 49 * 49) return 'pass';
    if (i < 49) return `+${i}`;
    return `${Math.floor((i - 49) / 49)}-${(i - 49) % 49}`;
  },
};

export const ataxxEnv: GameEnvironment<AtaxxState, string> = {
  id: 'ataxx',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: ataxxCodec.size,
    observationShape: [2, 7, 7],
  },
  createInitialState: () => createAtaxxState(),
  reset: () => createAtaxxState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalAtaxxActions(s),
  applyAction: (s, a) => applyAtaxxAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: ataxxOutcome,
  getReward: (s, p) => ataxxOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidAtaxxState(parsed)) throw new Error('Invalid ataxx state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => s.keys[s.keys.length - 1]!,
  encodeAction: ataxxCodec.encode,
  decodeAction: (i) => ataxxCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    const mine = player === 0 ? 1 : 2;
    const data = new Array<number>(98).fill(0);
    s.board.forEach((v, p) => {
      if (v === mine) data[p] = 1;
      else if (v !== 0) data[49 + p] = 1;
    });
    return { shape: [2, 7, 7], data };
  },
};

export const bundle: AiBundle<AtaxxState, string> = { env: ataxxEnv, agents: AGENT_PRESETS };
export default bundle;
