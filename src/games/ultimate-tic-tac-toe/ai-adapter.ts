import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  createState,
  gridToIndex,
  isLegal,
  isValidState,
  legalMoves,
  play,
  type Seat,
  type UtttState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface UtttConfig {
  firstPlayer?: Seat;
}

function outcomeOf(s: UtttState): Outcome | null {
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

export const utttEnv: GameEnvironment<UtttState, number, UtttState, UtttConfig> = {
  id: 'ultimate-tic-tac-toe',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: 81,
    observationShape: [4, 9, 9],
  },
  createInitialState: (config) => createState(config?.firstPlayer ?? 0),
  reset: (_seed) => createState(0),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalMoves(s),
  applyAction: (s, index) => play(s, index),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: outcomeOf,
  getReward: (s, player) => outcomeOf(s)?.returns[player] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Ultimate Tic-Tac-Toe state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.cells.join('')}${s.forced}${s.toMove}`,
  encodeAction: (index) => index,
  decodeAction: (index, s) => {
    if (!isLegal(s, index)) throw new Error(`Action ${index} is not legal`);
    return index;
  },
  getObservationTensor: (s, player) => {
    const own = player === 0 ? 1 : 2;
    const legal = new Set(s.result ? [] : legalMoves(s));
    const plane = (f: (i: number) => number) =>
      Array.from({ length: 81 }, (_, k) => f(gridToIndex(Math.floor(k / 9), k % 9)));
    return {
      shape: [4, 9, 9],
      data: [
        ...plane((i) => (s.cells[i] === own ? 1 : 0)),
        ...plane((i) => (s.cells[i] !== 0 && s.cells[i] !== own ? 1 : 0)),
        ...plane((i) => (legal.has(i) ? 1 : 0)),
        ...new Array<number>(81).fill(s.toMove === 0 ? 1 : 0),
      ],
    };
  },
  actionToString: (index) => `b${Math.floor(index / 9) + 1}c${(index % 9) + 1}`,
};

export const bundle: AiBundle<UtttState, number> = { env: utttEnv, agents: AGENT_PRESETS };
export default bundle;
