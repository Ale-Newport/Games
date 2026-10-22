import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  MAX_COLS,
  MAX_ROWS,
  applyChompAction,
  createChompState,
  isValidChompState,
  legalChompActions,
  sizeFor,
  type ChompState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function chompOutcome(s: ChompState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'poison',
  };
}

/** Index: row·MAX_COLS + column. */
export const chompCodec = {
  size: MAX_ROWS * MAX_COLS,
  encode(a: string): number {
    const [r, c] = a.split(',').map(Number) as [number, number];
    return r * MAX_COLS + c;
  },
  decode: (i: number): string => `${Math.floor(i / MAX_COLS)},${i % MAX_COLS}`,
};

export const chompEnv: GameEnvironment<ChompState, string> = {
  id: 'chomp',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: chompCodec.size,
    observationShape: [MAX_ROWS, MAX_COLS],
  },
  // The seed picks the bar size (rounds in the app draw it at random).
  createInitialState: (_c, seed) => createChompState(sizeFor(seed)),
  reset: (seed) => createChompState(sizeFor(seed)),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalChompActions(s),
  applyAction: (s, a) => applyChompAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: chompOutcome,
  getReward: (s, p) => chompOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidChompState(parsed)) throw new Error('Invalid chomp state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.rows.join(',')}|${s.toMove}`,
  encodeAction: chompCodec.encode,
  decodeAction: (i) => chompCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s) => {
    // 1 where a square remains (the poison is always at [0, 0]).
    const data = new Array<number>(MAX_ROWS * MAX_COLS).fill(0);
    s.rows.forEach((len, r) => {
      for (let c = 0; c < len; c++) data[r * MAX_COLS + c] = 1;
    });
    return { shape: [MAX_ROWS, MAX_COLS], data };
  },
};

export const bundle: AiBundle<ChompState, string> = { env: chompEnv, agents: AGENT_PRESETS };
export default bundle;
