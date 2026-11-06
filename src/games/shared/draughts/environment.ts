/** GameEnvironment factory, two-player rules binding and evaluation for the draughts family. */
import type { PlayerId } from '../../../ai/protocols/types';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import {
  applyMove,
  initialState,
  isKing,
  isLegalMove,
  isValidDraughtsState,
  legalMoves,
  positionKey,
  seatOf,
  squareNumber,
  undoMoves,
  type DraughtsState,
  type DraughtsVariant,
  type Move,
  type Seat,
} from './engine';

export function draughtsOutcome(s: DraughtsState): Outcome | null {
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

export function createDraughtsEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  variant: DraughtsVariant;
}): GameEnvironment<DraughtsState, Move> {
  const v = meta.variant;
  const n = v.size;
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
      observationShape: [4, n, n],
    },
    createInitialState: () => initialState(v),
    reset: () => initialState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalMoves(v, s),
    applyAction: (s, m) => applyMove(v, s, m),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: draughtsOutcome,
    getReward: (s, p) => draughtsOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidDraughtsState(v, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => positionKey(s),
    getObservationTensor: (s, player) => {
      const plane = (want: (p: number) => boolean) => s.board.map((p) => (want(p) ? 1 : 0));
      const own = (p: number) => seatOf(p as never) === player;
      const opp = (p: number) => seatOf(p as never) !== null && seatOf(p as never) !== player;
      return {
        shape: [4, n, n],
        data: [
          ...plane((p) => own(p) && !isKing(p as never)),
          ...plane((p) => own(p) && isKing(p as never)),
          ...plane((p) => opp(p) && !isKing(p as never)),
          ...plane((p) => opp(p) && isKing(p as never)),
        ],
      };
    },
    actionToString: (m) =>
      m
        .map((i) => squareNumber(v, i))
        .join(
          m.length > 2 || Math.abs(Math.floor(m[0]! / n) - Math.floor(m[1]! / n)) > 1 ? 'x' : '-',
        ),
  };
}

export function draughtsTwoPlayerRules(v: DraughtsVariant): TwoPlayerRules<DraughtsState, Move> {
  return {
    create: () => initialState(v),
    apply: (s, m) => applyMove(v, s, m),
    isLegal: (s, m) => isLegalMove(v, s, m),
    undo: (s, plies) => undoMoves(v, s, plies),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2 === 0 ? 0 : 1),
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is DraughtsState => isValidDraughtsState(v, data),
  };
}

/** Material + advancement + center + back-rank evaluation in [-1, 1] for `player`. */
export function evaluateDraughts(v: DraughtsVariant, s: DraughtsState, player: PlayerId): number {
  const n = v.size;
  const kingValue = v.flyingKings ? 320 : 165;
  let score = 0;
  for (let i = 0; i < s.board.length; i++) {
    const p = s.board[i]!;
    const seat = seatOf(p);
    if (seat === null) continue;
    const r = Math.floor(i / n);
    const c = i % n;
    let value = isKing(p) ? kingValue : 100;
    if (!isKing(p)) {
      const advance = seat === 0 ? n - 1 - r : r;
      value += advance * 4;
      if ((seat === 0 && r === n - 1) || (seat === 1 && r === 0)) value += 6; // back rank guard
    }
    if (c >= 2 && c <= n - 3 && r >= 2 && r <= n - 3) value += 4;
    score += seat === (player as Seat) ? value : -value;
  }
  return Math.tanh(score / 600);
}
