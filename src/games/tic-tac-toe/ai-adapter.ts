import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  RULES_VERSION,
  RULESET_ID,
  isLegal,
  isValidState,
  legalMoves,
  newRound,
  play,
  type Seat,
  type TttState,
} from './rules';

export interface TttConfig {
  firstPlayer?: Seat;
}

function outcomeOf(s: TttState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

export const tttEnv: GameEnvironment<TttState, number, TttState, TttConfig> = {
  id: 'tic-tac-toe',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: 9,
    observationShape: [3, 3, 3],
  },
  createInitialState: (config) => newRound(config?.firstPlayer ?? 0),
  reset: (_seed) => newRound(0),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalMoves(s),
  applyAction: (s, cell) => play(s, cell),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: outcomeOf,
  getReward: (s, player) => outcomeOf(s)?.returns[player] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Tic-Tac-Toe state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}${s.toMove}`,
  encodeAction: (cell) => cell,
  decodeAction: (index, s) => {
    if (!isLegal(s, index)) throw new Error(`Action ${index} is not legal`);
    return index;
  },
  getObservationTensor: (s, player) => {
    const own = player === 0 ? 1 : 2;
    const opp = player === 0 ? 2 : 1;
    const data = [
      ...s.board.map((c) => (c === own ? 1 : 0)),
      ...s.board.map((c) => (c === opp ? 1 : 0)),
      ...new Array<number>(9).fill(s.toMove === 0 ? 1 : 0),
    ];
    return { shape: [3, 3, 3], data };
  },
  actionToString: (cell) => `r${Math.floor(cell / 3) + 1}c${(cell % 3) + 1}`,
};

export const bundle: AiBundle<TttState, number> = {
  env: tttEnv,
  agents: AGENT_PRESETS,
  exactOracleId: 'perfect',
};
export default bundle;
