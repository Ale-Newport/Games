/**
 * Immutable chess game layer over `Position`: variants, results, draw rules, SAN, Chess960 starts.
 * Actions are strings: coordinate moves ("e2e4", promotions "e7e8q") and "O-O" / "O-O-O".
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { parseFen, pieceLetter, squareName, toFen } from './fen';
import type { Position } from './position';
import {
  BISHOP,
  EMPTY,
  FLAG_CASTLE,
  KING,
  KNIGHT,
  PAWN,
  pieceColor,
  pieceType,
  type Color,
  type Move,
  type VariantRules,
} from './position';

export type ChessGoal = 'checkmate' | 'antichess' | 'king-of-the-hill' | 'three-check';

export interface ChessVariant {
  id: string;
  rules: VariantRules;
  goal: ChessGoal;
  /** Fixed start FEN, or a Chess960 start chosen by the seed. */
  start: { fen: string } | { chess960: true };
}

export type ChessResult =
  | {
      kind: 'win';
      winner: Color;
      reason: 'checkmate' | 'no-pieces-or-moves' | 'hill' | 'three-check';
    }
  | { kind: 'draw'; reason: 'stalemate' | 'fifty-move' | 'repetition' | 'insufficient-material' };

export interface ChessState {
  startFen: string;
  fen: string;
  history: string[];
  san: string[];
  /** Repetition keys since the last pawn move or capture (current position included). */
  keys: string[];
  /** Checks given by each color (Three-Check). */
  checks: [number, number];
  result: ChessResult | null;
}

const KRN = [
  'NN---',
  'N-N--',
  'N--N-',
  'N---N',
  '-NN--',
  '-N-N-',
  '-N--N',
  '--NN-',
  '--N-N',
  '---NN',
];

/** Back rank of Chess960 start position `n` (0–959, Scharnagl numbering; 518 = RNBQKBNR). */
export function chess960BackRank(n: number): string {
  const rank: (string | null)[] = new Array(8).fill(null);
  let x = n;
  rank[2 * (x % 4) + 1] = 'B';
  x = Math.floor(x / 4);
  rank[2 * (x % 4)] = 'B';
  x = Math.floor(x / 4);
  const free = () => rank.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  rank[free()[x % 6]!] = 'Q';
  x = Math.floor(x / 6);
  const pattern = KRN[x]!;
  const five = free();
  [...pattern].forEach((ch, k) => ch === 'N' && (rank[five[k]!] = 'N'));
  const three = free();
  rank[three[0]!] = 'R';
  rank[three[1]!] = 'K';
  rank[three[2]!] = 'R';
  return rank.join('');
}

export function chess960Fen(n: number): string {
  const back = chess960BackRank(n);
  return `${back.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${back} w KQkq - 0 1`;
}

export function startFenFor(v: ChessVariant, seed: number): string {
  if ('fen' in v.start) return v.start.fen;
  return chess960Fen(((seed % 960) + 960) % 960);
}

export function moveAction(pos: Position, m: Move): string {
  if (m.flags & FLAG_CASTLE) return m.castleSide === 0 ? 'O-O' : 'O-O-O';
  return `${squareName(pos, m.from)}${squareName(pos, m.to)}${m.promo ? pieceLetter(m.promo).toLowerCase() : ''}`;
}

export const positionOf = (v: ChessVariant, s: ChessState) => parseFen(v.rules, s.fen);

function repetitionKey(pos: Position, legal?: Move[]): string {
  const [placement, side, castling] = toFen(pos).split(' ');
  // The en passant square only matters when a capture there is actually legal.
  const epLegal =
    pos.ep >= 0 &&
    (legal ?? pos.legalMoves()).some(
      (m) => m.to === pos.ep && pieceType(m.piece) === PAWN && m.captured !== EMPTY,
    );
  return `${placement} ${side} ${castling} ${epLegal ? squareName(pos, pos.ep) : '-'}`;
}

export function createChessState(v: ChessVariant, seed = 0): ChessState {
  const startFen = startFenFor(v, seed);
  const pos = parseFen(v.rules, startFen);
  return {
    startFen,
    fen: toFen(pos),
    history: [],
    san: [],
    keys: [repetitionKey(pos)],
    checks: [0, 0],
    result: null,
  };
}

export function legalActions(v: ChessVariant, s: ChessState): string[] {
  if (s.result) return [];
  const pos = positionOf(v, s);
  return pos.legalMoves().map((m) => moveAction(pos, m));
}

export function isLegalAction(v: ChessVariant, s: ChessState, action: unknown): action is string {
  return typeof action === 'string' && legalActions(v, s).includes(action);
}

/** Dead positions (FIDE): K vs K, K+minor vs K, K+B vs K+B (or more) with all bishops on one color. */
export function insufficientMaterial(pos: Position): boolean {
  const minors: { type: number; color: number }[] = [];
  for (const sq of pos.squares()) {
    const p = pos.board[sq]!;
    if (p <= 0 || pieceType(p) === KING) continue;
    const type = pieceType(p);
    if (type !== KNIGHT && type !== BISHOP) return false;
    minors.push({ type, color: (pos.fileOf(sq) + pos.rankOf(sq)) % 2 });
  }
  if (minors.length <= 1) return true;
  return (
    minors.every((m) => m.type === BISHOP) && minors.every((m) => m.color === minors[0]!.color)
  );
}

/**
 * Whether `color` could still mate by some sequence of legal moves (decides a flag fall: losing on
 * time against a side that cannot mate is a draw). A lone minor piece can only mate when the
 * defender has other pieces that may block its own king.
 */
export function hasMatingMaterial(pos: Position, color: Color): boolean {
  let minors = 0;
  let defenders = 0;
  for (const sq of pos.squares()) {
    const p = pos.board[sq]!;
    if (p <= 0 || pieceType(p) === KING) continue;
    if (pieceColor(p) !== color) {
      defenders++;
      continue;
    }
    if (pieceType(p) === KNIGHT || pieceType(p) === BISHOP) minors++;
    else return true;
  }
  return minors >= 2 || (minors === 1 && defenders > 0);
}

/** SAN without the check suffix; `legal` are the legal moves of `pos` (for disambiguation). */
function sanBase(pos: Position, m: Move, legal: Move[]): string {
  let san: string;
  if (m.flags & FLAG_CASTLE) san = m.castleSide === 0 ? 'O-O' : 'O-O-O';
  else {
    const type = pieceType(m.piece);
    const capture = m.captured !== EMPTY;
    const to = squareName(pos, m.to);
    if (type === PAWN) {
      san = `${capture ? `${'abcdefgh'[pos.fileOf(m.from)]}x` : ''}${to}${m.promo ? `=${pieceLetter(m.promo).toUpperCase()}` : ''}`;
    } else {
      const rivals = legal.filter(
        (o) =>
          o !== m &&
          o.to === m.to &&
          o.piece === m.piece &&
          o.from !== m.from &&
          !(o.flags & FLAG_CASTLE),
      );
      let dis = '';
      if (rivals.length) {
        const sameFile = rivals.some((o) => pos.fileOf(o.from) === pos.fileOf(m.from));
        const sameRank = rivals.some((o) => pos.rankOf(o.from) === pos.rankOf(m.from));
        const file = 'abcdefgh'[pos.fileOf(m.from)]!;
        const rank = String(pos.rankOf(m.from) + 1);
        dis = !sameFile ? file : !sameRank ? rank : file + rank;
      }
      san = `${pieceLetter(m.piece).toUpperCase()}${dis}${capture ? 'x' : ''}${to}`;
    }
  }
  return san;
}

export function sanFor(v: ChessVariant, pos: Position, m: Move): string {
  let san = sanBase(pos, m, pos.legalMoves());
  if (v.goal !== 'antichess') {
    const after = pos.clone();
    after.make(m);
    if (after.inCheck()) san += after.legalMoves().length === 0 ? '#' : '+';
  }
  return san;
}

const HILL = ['d4', 'e4', 'd5', 'e5'];

export function applyChessAction(v: ChessVariant, s: ChessState, action: string): ChessState {
  return advance(v, positionOf(v, s), s, action);
}

/** Plays `action` on `pos` (mutated to the new position) and returns the next state. */
function advance(v: ChessVariant, pos: Position, s: ChessState, action: string): ChessState {
  if (s.result) throw new IllegalActionError('The game is over');
  const before = pos.legalMoves();
  const move = before.find((m) => moveAction(pos, m) === action);
  if (!move) throw new IllegalActionError(`Move ${action} is not legal`);
  const mover = pos.side;
  let san = sanBase(pos, move, before);
  pos.make(move);
  const legal = pos.legalMoves();
  const givesCheck = v.goal !== 'antichess' && pos.inCheck();
  if (givesCheck) san += legal.length === 0 ? '#' : '+';
  const irreversible = pieceType(move.piece) === PAWN || move.captured !== EMPTY;
  const key = repetitionKey(pos, legal);
  const keys = irreversible ? [key] : [...s.keys, key];
  const checks: [number, number] = [s.checks[0], s.checks[1]];
  if (givesCheck) checks[mover]++;
  let result: ChessResult | null = null;
  if (v.goal === 'antichess') {
    if (legal.length === 0)
      result = { kind: 'win', winner: pos.side, reason: 'no-pieces-or-moves' };
  } else if (v.goal === 'king-of-the-hill' && HILL.includes(squareName(pos, pos.kings[mover]))) {
    result = { kind: 'win', winner: mover, reason: 'hill' };
  } else if (v.goal === 'three-check' && checks[mover] >= 3) {
    result = { kind: 'win', winner: mover, reason: 'three-check' };
  } else if (legal.length === 0) {
    result = pos.inCheck()
      ? { kind: 'win', winner: mover, reason: 'checkmate' }
      : { kind: 'draw', reason: 'stalemate' };
  }
  if (!result) {
    if (keys.filter((k) => k === key).length >= 3) result = { kind: 'draw', reason: 'repetition' };
    else if (pos.halfmove >= 100) result = { kind: 'draw', reason: 'fifty-move' };
    else if (v.goal !== 'antichess' && insufficientMaterial(pos))
      result = { kind: 'draw', reason: 'insufficient-material' };
  }
  return {
    startFen: s.startFen,
    fen: toFen(pos),
    history: [...s.history, action],
    san: [...s.san, san],
    keys,
    checks,
    result,
  };
}

/** Recent replays, so that validating consecutive states of one game stays linear. */
const replayCache: { variant: string; startFen: string; state: ChessState }[] = [];

export function replayChess(
  v: ChessVariant,
  startFen: string,
  history: readonly string[],
): ChessState {
  let cached: ChessState | null = null;
  for (const e of replayCache) {
    const h = e.state.history;
    if (e.variant !== v.id || e.startFen !== startFen || h.length > history.length) continue;
    if ((cached?.history.length ?? -1) >= h.length) continue;
    if (h.every((a, i) => a === history[i])) cached = e.state;
  }
  const pos = parseFen(v.rules, cached?.fen ?? startFen);
  let s: ChessState = cached ?? {
    startFen,
    fen: toFen(pos),
    history: [],
    san: [],
    keys: [repetitionKey(pos)],
    checks: [0, 0],
    result: null,
  };
  for (let i = s.history.length; i < history.length; i++) s = advance(v, pos, s, history[i]!);
  replayCache.unshift({ variant: v.id, startFen, state: s });
  if (replayCache.length > 12) replayCache.pop();
  return s;
}

export function isValidChessState(v: ChessVariant, data: unknown): data is ChessState {
  if (!isRecord(data) || typeof data.startFen !== 'string' || !Array.isArray(data.history))
    return false;
  try {
    return (
      JSON.stringify(replayChess(v, data.startFen, data.history as string[])) ===
      JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const sideToMove = (s: ChessState): Color => (s.fen.split(' ')[1] === 'b' ? 1 : 0);
