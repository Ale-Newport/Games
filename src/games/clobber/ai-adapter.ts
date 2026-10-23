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
  applyClobberAction,
  createClobberState,
  isValidClobberState,
  legalClobberActions,
  type ClobberState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function clobberOutcome(s: ClobberState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'no-move',
  };
}

/** Index: from·4 + direction (0 up, 1 down, 2 left, 3 right). */
export const clobberCodec = {
  size: N * N * 4,
  encode(a: string): number {
    const [f, t] = a.split('-').map(Number) as [number, number];
    const d = t === f - N ? 0 : t === f + N ? 1 : t === f - 1 ? 2 : 3;
    return f * 4 + d;
  },
  decode(i: number): string {
    const f = Math.floor(i / 4);
    const t = [f - N, f + N, f - 1, f + 1][i % 4]!;
    return `${f}-${t}`;
  },
};

export const clobberEnv: GameEnvironment<ClobberState, string> = {
  id: 'clobber',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: clobberCodec.size,
    observationShape: [2, N, N],
  },
  createInitialState: () => createClobberState(),
  reset: () => createClobberState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalClobberActions(s),
  applyAction: (s, a) => applyClobberAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: clobberOutcome,
  getReward: (s, p) => clobberOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidClobberState(parsed)) throw new Error('Invalid clobber state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
  encodeAction: clobberCodec.encode,
  decodeAction: (i) => clobberCodec.decode(i),
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

export const bundle: AiBundle<ClobberState, string> = {
  env: clobberEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
