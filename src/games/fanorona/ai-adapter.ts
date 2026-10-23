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
  DIRS,
  ROWS,
  applyFanoronaAction,
  step,
  createFanoronaState,
  isValidFanoronaState,
  legalFanoronaActions,
  type FanoronaState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function fanoronaOutcome(s: FanoronaState): Outcome | null {
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

/** Index: (from·8 + direction)·3 + (0 paika, 1 approach, 2 withdrawal); "stop" is the last index. */
export const fanoronaCodec = {
  size: ROWS * COLS * 8 * 3 + 1,
  encode(a: string): number {
    if (a === 'stop') return ROWS * COLS * 8 * 3;
    const kind = a.endsWith('A') ? 1 : a.endsWith('W') ? 2 : 0;
    const [f, t] = a.replace(/[AW]$/, '').split('-').map(Number) as [number, number];
    const d = DIRS.findIndex((_, i) => step(f, i) === t);
    return (f * 8 + d) * 3 + kind;
  },
  decode(i: number): string {
    if (i === ROWS * COLS * 8 * 3) return 'stop';
    const kind = ['', 'A', 'W'][i % 3]!;
    const f = Math.floor(i / 24);
    const d = Math.floor(i / 3) % 8;
    return `${f}-${step(f, d)}${kind}`;
  },
};

export const fanoronaEnv: GameEnvironment<FanoronaState, string> = {
  id: 'fanorona',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: fanoronaCodec.size,
    observationShape: [2, ROWS, COLS],
  },
  createInitialState: () => createFanoronaState(),
  reset: () => createFanoronaState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalFanoronaActions(s),
  applyAction: (s, a) => applyFanoronaAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: fanoronaOutcome,
  getReward: (s, p) => fanoronaOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidFanoronaState(parsed)) throw new Error('Invalid fanorona state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) =>
    `${s.board.join('')}|${s.toMove}|${s.chain ? `${s.chain.at}.${s.chain.lastDir}.${s.chain.visited.join(',')}` : '-'}`,
  encodeAction: fanoronaCodec.encode,
  decodeAction: (i) => fanoronaCodec.decode(i),
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

export const bundle: AiBundle<FanoronaState, string> = { env: fanoronaEnv, agents: AGENT_PRESETS };
export default bundle;
