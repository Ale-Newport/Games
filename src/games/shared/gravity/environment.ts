/** GameEnvironment and two-player rules bindings for gravity line games (#005, #006). */
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import {
  createGravityState,
  dropDisc,
  isLegalColumn,
  isValidGravityState,
  legalColumns,
  other,
  undoDrops,
  type GravityRules,
  type GravityState,
  type Seat,
} from './engine';

export interface GravityConfig {
  firstPlayer?: Seat;
}

export function gravityOutcome(s: GravityState): Outcome | null {
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

export function createGravityEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  rules: GravityRules;
}): GameEnvironment<GravityState, number, GravityState, GravityConfig> {
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
      actionSpaceSize: rules.cols,
      observationShape: [3, rules.rows, rules.cols],
    },
    createInitialState: (config) => createGravityState(rules, config?.firstPlayer ?? 0),
    reset: (_seed) => createGravityState(rules, 0),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalColumns(rules, s),
    applyAction: (s, col) => dropDisc(rules, s, col),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: gravityOutcome,
    getReward: (s, player) => gravityOutcome(s)?.returns[player] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidGravityState(rules, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join('')}${s.toMove}`,
    encodeAction: (col) => col,
    decodeAction: (index, s) => {
      if (!isLegalColumn(rules, s, index)) throw new Error(`Column ${index} is not legal`);
      return index;
    },
    getObservationTensor: (s, player) => {
      const own = player === 0 ? 1 : 2;
      const opp = player === 0 ? 2 : 1;
      return {
        shape: [3, rules.rows, rules.cols],
        data: [
          ...s.board.map((c) => (c === own ? 1 : 0)),
          ...s.board.map((c) => (c === opp ? 1 : 0)),
          ...new Array<number>(cells).fill(s.toMove === 0 ? 1 : 0),
        ],
      };
    },
    actionToString: (col) => `c${col + 1}`,
  };
}

export function gravityTwoPlayerRules(rules: GravityRules): TwoPlayerRules<GravityState, number> {
  return {
    create: (firstPlayer) => createGravityState(rules, firstPlayer),
    apply: (s, col) => dropDisc(rules, s, col),
    isLegal: (s, col) => isLegalColumn(rules, s, col),
    undo: (s, plies) => undoDrops(rules, s, plies),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => (ply % 2 === 0 ? s.firstPlayer : other(s.firstPlayer)),
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is GravityState => isValidGravityState(rules, data),
  };
}
