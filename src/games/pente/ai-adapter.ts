import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  SIZE,
  createState,
  isLegal,
  isValidState,
  legalMoves,
  play,
  type PenteState,
  type Seat,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface PenteConfig {
  firstPlayer?: Seat;
}

function outcomeOf(s: PenteState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return {
      returns: [0, 0],
      winners: [],
      draw: true,
      reason: s.result.reason,
      scores: s.captures,
    };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
    scores: s.captures,
  };
}

export const penteEnv: GameEnvironment<PenteState, number, PenteState, PenteConfig> = {
  id: 'pente',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: SIZE * SIZE,
    observationShape: [4, SIZE, SIZE],
  },
  createInitialState: (config) => createState(config?.firstPlayer ?? 0),
  reset: (_seed) => createState(0),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalMoves(s),
  applyAction: play,
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: outcomeOf,
  getReward: (s, p) => outcomeOf(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Pente state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  encodeAction: (i) => i,
  decodeAction: (i, s) => {
    if (!isLegal(s, i)) throw new Error(`Point ${i} is not legal`);
    return i;
  },
  getObservationTensor: (s, player) => {
    const own = player === 0 ? 1 : 2;
    const cells = SIZE * SIZE;
    return {
      shape: [4, SIZE, SIZE],
      data: [
        ...s.board.map((v) => (v === own ? 1 : 0)),
        ...s.board.map((v) => (v !== 0 && v !== own ? 1 : 0)),
        ...new Array<number>(cells).fill(s.captures[player as Seat] / 5),
        ...new Array<number>(cells).fill(s.captures[(1 - player) as Seat] / 5),
      ],
    };
  },
};

export const bundle: AiBundle<PenteState, number> = { env: penteEnv, agents: AGENT_PRESETS };
export default bundle;
