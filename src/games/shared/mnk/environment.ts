/** GameEnvironment over the m,n,k engine, shared by #001, #002 and #004 adapters. */
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import {
  createMnkState,
  isLegalCell,
  isValidMnkState,
  legalCells,
  playCell,
  type MnkRules,
  type MnkState,
  type Seat,
} from './engine';

export interface MnkConfig {
  firstPlayer?: Seat;
}

export function mnkOutcome(s: MnkState): Outcome | null {
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

export function createMnkEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  rules: MnkRules;
}): GameEnvironment<MnkState, number, MnkState, MnkConfig> {
  const { rules } = meta;
  const cells = rules.rows * rules.cols;
  return {
    id: meta.id,
    version: meta.version,
    rulesetId: meta.rulesetId,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 2,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: true,
      actionSpaceSize: cells,
      observationShape: [3, rules.rows, rules.cols],
    },
    createInitialState: (config) => createMnkState(rules, config?.firstPlayer ?? 0),
    reset: (_seed) => createMnkState(rules, 0),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalCells(rules, s),
    applyAction: (s, cell) => playCell(rules, s, cell),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: mnkOutcome,
    getReward: (s, player) => mnkOutcome(s)?.returns[player] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidMnkState(rules, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join('')}${s.toMove}`,
    encodeAction: (cell) => cell,
    decodeAction: (index, s) => {
      if (!isLegalCell(rules, s, index)) throw new Error(`Action ${index} is not legal`);
      return index;
    },
    getObservationTensor: (s, player) => {
      const own = player === 0 ? 1 : 2;
      const opp = player === 0 ? 2 : 1;
      const data = [
        ...s.board.map((c) => (c === own ? 1 : 0)),
        ...s.board.map((c) => (c === opp ? 1 : 0)),
        ...new Array<number>(cells).fill(s.toMove === 0 ? 1 : 0),
      ];
      return { shape: [3, rules.rows, rules.cols], data };
    },
    actionToString: (cell) => `r${Math.floor(cell / rules.cols) + 1}c${(cell % rules.cols) + 1}`,
  };
}
