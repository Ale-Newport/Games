/** GameEnvironment factory and two-player rules binding for Reversi (#010, #011). */
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import {
  applyReversi,
  countDiscs,
  createReversiState,
  isLegalAction,
  isValidReversiState,
  legalActions,
  moverOfPly,
  passAction,
  undoReversi,
  type ReversiRules,
  type ReversiState,
} from './engine';

export function reversiOutcome(s: ReversiState): Outcome | null {
  if (!s.result) return null;
  const scores = countDiscs(s.board);
  if (s.result.kind === 'draw')
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason, scores };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
    scores,
  };
}

export function createReversiEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  rules: ReversiRules;
}): GameEnvironment<ReversiState, number> {
  const { rules } = meta;
  const n = rules.size;
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
      actionSpaceSize: n * n + 1,
      observationShape: [3, n, n],
    },
    createInitialState: () => createReversiState(rules),
    reset: () => createReversiState(rules),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalActions(rules, s),
    applyAction: (s, a) => applyReversi(rules, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: reversiOutcome,
    getReward: (s, p) => reversiOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidReversiState(rules, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join('')}${s.toMove}`,
    encodeAction: (a) => a,
    decodeAction: (a, s) => {
      if (!isLegalAction(rules, s, a)) throw new Error(`Action ${a} is not legal`);
      return a;
    },
    getObservationTensor: (s, player) => {
      const own = player === 0 ? 1 : 2;
      const legal = new Set(s.result ? [] : legalActions(rules, s));
      return {
        shape: [3, n, n],
        data: [
          ...s.board.map((d) => (d === own ? 1 : 0)),
          ...s.board.map((d) => (d !== 0 && d !== own ? 1 : 0)),
          ...s.board.map((_, i) => (legal.has(i) ? 1 : 0)),
        ],
      };
    },
    actionToString: (a) =>
      a === passAction(rules) ? 'pass' : `${'abcdefghijklmnop'[a % n]}${Math.floor(a / n) + 1}`,
  };
}

export function reversiTwoPlayerRules(rules: ReversiRules): TwoPlayerRules<ReversiState, number> {
  return {
    create: () => createReversiState(rules),
    apply: (s, a) => applyReversi(rules, s, a),
    isLegal: (s, a) => isLegalAction(rules, s, a),
    undo: (s, plies) => undoReversi(rules, s, plies),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => moverOfPly(ply),
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is ReversiState => isValidReversiState(rules, data),
  };
}
