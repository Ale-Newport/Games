/** GameEnvironment factory and two-player rules binding for the chess family (#015–#020). */
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import { parseFen } from './fen';
import {
  applyChessAction,
  createChessState,
  hasMatingMaterial,
  isLegalAction,
  isValidChessState,
  legalActions,
  positionOf,
  replayChess,
  sideToMove,
  type ChessState,
  type ChessVariant,
} from './game';
import { pieceColor, pieceType } from './position';

const PROMOS = ['', 'n', 'b', 'r', 'q', 'k'];

export function chessOutcome(s: ChessState): Outcome | null {
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

/**
 * Action index: `((from * S + to) * 6 + promo)` for coordinate moves (S = squares, promo 0 = none,
 * then n b r q k), and `S² · 6` / `S² · 6 + 1` for O-O / O-O-O.
 */
export function chessActionCodec(v: ChessVariant) {
  const W = v.rules.width;
  const S = W * v.rules.height;
  const square = (name: string) => name.charCodeAt(0) - 97 + (Number(name.slice(1)) - 1) * W;
  const name = (i: number) => `${String.fromCharCode(97 + (i % W))}${Math.floor(i / W) + 1}`;
  const castleBase = S * S * 6;
  return {
    size: castleBase + 2,
    encode(action: string): number {
      if (action === 'O-O') return castleBase;
      if (action === 'O-O-O') return castleBase + 1;
      const m = /^([a-z]\d+)([a-z]\d+)([nbrqk]?)$/.exec(action);
      if (!m) throw new Error(`Malformed chess action ${action}`);
      return (square(m[1]!) * S + square(m[2]!)) * 6 + PROMOS.indexOf(m[3]!);
    },
    decode(index: number): string {
      if (index === castleBase) return 'O-O';
      if (index === castleBase + 1) return 'O-O-O';
      const promo = index % 6;
      const pair = Math.floor(index / 6);
      return `${name(Math.floor(pair / S))}${name(pair % S)}${PROMOS[promo]}`;
    },
  };
}

export function createChessEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  variant: ChessVariant;
}): GameEnvironment<ChessState, string> {
  const v = meta.variant;
  const W = v.rules.width;
  const H = v.rules.height;
  const codec = chessActionCodec(v);
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
      actionSpaceSize: codec.size,
      observationShape: [12, H, W],
    },
    createInitialState: (_config, seed) => createChessState(v, seed),
    reset: (seed) => createChessState(v, seed),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== sideToMove(s) ? [] : legalActions(v, s),
    applyAction: (s, a) => applyChessAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : sideToMove(s)),
    isTerminal: (s) => s.result !== null,
    getOutcome: chessOutcome,
    getReward: (s, p) => chessOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidChessState(v, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    // Placement, side, castling, en passant and (Three-Check) check counts; move counters excluded.
    stateKey: (s) => `${s.fen.split(' ').slice(0, 4).join(' ')} ${s.checks.join('+')}`,
    encodeAction: codec.encode,
    decodeAction: (index) => codec.decode(index),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
      // Planes: own pawn..king, then opponent pawn..king; rank 1 first.
      const pos = positionOf(v, s);
      const data = new Array<number>(12 * H * W).fill(0);
      for (let r = 0; r < H; r++)
        for (let f = 0; f < W; f++) {
          const p = pos.board[pos.sq(f, r)]!;
          if (p <= 0) continue;
          const plane = (pieceColor(p) === player ? 0 : 6) + pieceType(p) - 1;
          data[plane * H * W + r * W + f] = 1;
        }
      return { shape: [12, H, W], data };
    },
  };
}

export function chessTwoPlayerRules(
  v: ChessVariant,
  seed: () => number = () => 0,
): TwoPlayerRules<ChessState, string> {
  return {
    create: () => createChessState(v, seed()),
    restart: (s) => replayChess(v, s.startFen, []),
    apply: (s, a) => applyChessAction(v, s, a),
    isLegal: (s, a) => isLegalAction(v, s, a),
    undo: (s, plies) => replayChess(v, s.startFen, s.history.slice(0, -plies)),
    toMove: sideToMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => ((ply + (s.startFen.split(' ')[1] === 'b' ? 1 : 0)) % 2) as 0 | 1,
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is ChessState => isValidChessState(v, data),
  };
}

/** Whether `seat` could still deliver mate (used when the other side's flag falls). */
export function chessCanWinOnTime(v: ChessVariant, s: ChessState, seat: 0 | 1): boolean {
  // In the variants whose goal is not mate, any remaining material can still win.
  if (v.goal !== 'checkmate') return true;
  return hasMatingMaterial(parseFen(v.rules, s.fen), seat);
}
