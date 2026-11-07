import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  COLS,
  ROWS,
  applyYoteAction,
  createYoteState,
  isValidYoteState,
  legalYoteActions,
  type YoteState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function yoteOutcome(s: YoteState): Outcome | null {
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

/** Index: place p → p; move f → t → 30 + 30f + t; bonus removal q → 930 + q; from the hand → 960. */
export const yoteCodec = {
  size: 30 + 900 + 30 + 1,
  encode(a: string): number {
    if (a === 'xh') return 960;
    if (a.startsWith('x')) return 930 + Number(a.slice(1));
    if (a.startsWith('+')) return Number(a.slice(1));
    const [f, t] = a.split('-').map(Number) as [number, number];
    return 30 + 30 * f + t;
  },
  decode(i: number): string {
    if (i === 960) return 'xh';
    if (i >= 930) return `x${i - 930}`;
    if (i < 30) return `+${i}`;
    return `${Math.floor((i - 30) / 30)}-${(i - 30) % 30}`;
  },
};

export const yoteEnv: GameEnvironment<YoteState, string> = {
  id: 'yote',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: yoteCodec.size,
    observationShape: [2, ROWS, COLS],
  },
  createInitialState: () => createYoteState(),
  reset: () => createYoteState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalYoteActions(s),
  applyAction: (s, a) => applyYoteAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: yoteOutcome,
  getReward: (s, p) => yoteOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidYoteState(parsed)) throw new Error('Invalid yote state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}|${s.bonus ? 'b' : '-'}|${s.hands.join(',')}`,
  encodeAction: yoteCodec.encode,
  decodeAction: (i) => yoteCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    const mine = player === 0 ? 1 : 2;
    const data = new Array<number>(2 * ROWS * COLS).fill(0);
    s.board.forEach((v, p) => {
      if (v === mine) data[p] = 1;
      else if (v !== 0) data[ROWS * COLS + p] = 1;
    });
    return { shape: [2, ROWS, COLS], data };
  },
};

export const bundle: AiBundle<YoteState, string> = {
  env: yoteEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
