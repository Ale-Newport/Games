/**
 * Pure rules engine for the draughts family (#012 English, #013 International, #014 Spanish).
 * One engine, parameterized by a `DraughtsVariant`. Seat 0 starts at the bottom (high row numbers)
 * and moves first. A move is the full path of squares visited (so a multi-capture is one action).
 * Captured pieces stay on the board until the move ends: they cannot be jumped twice and they block.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export type Seat = 0 | 1;
/** 0 empty, 1 man of seat 0, 2 king of seat 0, 3 man of seat 1, 4 king of seat 1. */
export type Piece = 0 | 1 | 2 | 3 | 4;
export type Move = number[];

export interface DraughtsVariant {
  id: string;
  size: 8 | 10;
  rowsOfMen: number;
  /** Playable squares satisfy (row + col) % 2 === playableParity. */
  playableParity: 0 | 1;
  menCaptureBackward: boolean;
  flyingKings: boolean;
  /** Which capture sequences are allowed when several exist. */
  captureRule: 'any' | 'max' | 'max-then-kings';
  /** A man reaching the far row during a capture is crowned and the move ends (English). */
  crownEndsCapture: boolean;
  /** Plies without a capture or a man move before the game is drawn. */
  noProgressPlies: number;
  /** FMJD endgame counts (3 pieces with a king vs a lone king: 16 moves each; fewer: 5 each). */
  fmjdEndgame: boolean;
}

export type DraughtsResult =
  | { kind: 'win'; winner: Seat; reason: 'no-moves' }
  | { kind: 'draw'; reason: 'repetition' | 'no-progress' | 'endgame-count' };

export interface DraughtsState {
  board: Piece[];
  toMove: Seat;
  history: Move[];
  /** Plies since the last capture or man move. */
  noProgress: number;
  /** Position keys since the last irreversible move (for repetition). */
  recent: string[];
  /** Plies played in the current FMJD endgame configuration (0 when not in one). */
  endgamePlies: number;
  result: DraughtsResult | null;
}

export const seatOf = (p: Piece): Seat | null =>
  p === 1 || p === 2 ? 0 : p === 3 || p === 4 ? 1 : null;
export const isKing = (p: Piece) => p === 2 || p === 4;
const kingOf = (seat: Seat): Piece => (seat === 0 ? 2 : 4);
export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);
const DIAGONALS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export const isPlayable = (v: DraughtsVariant, i: number) =>
  (Math.floor(i / v.size) + (i % v.size)) % 2 === v.playableParity;
/** Row direction a seat's men move in. */
const forward = (seat: Seat) => (seat === 0 ? -1 : 1);
const crownRow = (v: DraughtsVariant, seat: Seat) => (seat === 0 ? 0 : v.size - 1);

export function positionKey(s: Pick<DraughtsState, 'board' | 'toMove'>): string {
  return `${s.board.join('')}${s.toMove}`;
}

export function initialState(v: DraughtsVariant): DraughtsState {
  const n = v.size;
  const board = new Array<Piece>(n * n).fill(0);
  for (let i = 0; i < n * n; i++) {
    if (!isPlayable(v, i)) continue;
    const r = Math.floor(i / n);
    if (r < v.rowsOfMen) board[i] = 3;
    else if (r >= n - v.rowsOfMen) board[i] = 1;
  }
  const s: DraughtsState = {
    board,
    toMove: 0,
    history: [],
    noProgress: 0,
    recent: [],
    endgamePlies: 0,
    result: null,
  };
  return { ...s, recent: [positionKey(s)] };
}

interface Capture {
  path: number[];
  captured: number[];
  kingsCaptured: number;
}

function captureSequences(
  v: DraughtsVariant,
  board: readonly Piece[],
  from: number,
  seat: Seat,
): Capture[] {
  const n = v.size;
  const piece = board[from]!;
  const king = isKing(piece);
  const results: Capture[] = [];
  const dirs = DIAGONALS.filter(([dr]) => king || v.menCaptureBackward || dr === forward(seat));

  const explore = (
    at: number,
    path: number[],
    captured: number[],
    kings: number,
    asKing: boolean,
  ) => {
    const r = Math.floor(at / n);
    const c = at % n;
    let extended = false;
    const steps = asKing ? DIAGONALS : dirs;
    for (const [dr, dc] of steps) {
      let rr = r + dr;
      let cc = c + dc;
      if (asKing && v.flyingKings) {
        // Slide over empty squares (the moving piece's origin counts as empty).
        while (
          rr >= 0 &&
          rr < n &&
          cc >= 0 &&
          cc < n &&
          (board[rr * n + cc] === 0 || rr * n + cc === from)
        ) {
          rr += dr;
          cc += dc;
        }
      }
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      const victim = rr * n + cc;
      const victimSeat = seatOf(board[victim]!);
      if (
        victimSeat === null ||
        victimSeat === seat ||
        captured.includes(victim) ||
        victim === from
      )
        continue;
      let lr = rr + dr;
      let lc = cc + dc;
      while (lr >= 0 && lr < n && lc >= 0 && lc < n) {
        const land = lr * n + lc;
        if (board[land] !== 0 && land !== from) break;
        extended = true;
        const nextCaptured = [...captured, victim];
        const nextKings = kings + (isKing(board[victim]!) ? 1 : 0);
        const crowned = !asKing && Math.floor(land / n) === crownRow(v, seat);
        if (crowned && v.crownEndsCapture) {
          results.push({ path: [...path, land], captured: nextCaptured, kingsCaptured: nextKings });
        } else {
          explore(land, [...path, land], nextCaptured, nextKings, asKing);
        }
        if (!(asKing && v.flyingKings)) break;
        lr += dr;
        lc += dc;
      }
    }
    if (!extended && captured.length > 0) results.push({ path, captured, kingsCaptured: kings });
  };

  explore(from, [from], [], 0, king);
  return results;
}

function quietMoves(v: DraughtsVariant, board: readonly Piece[], from: number, seat: Seat): Move[] {
  const n = v.size;
  const r = Math.floor(from / n);
  const c = from % n;
  const king = isKing(board[from]!);
  const moves: Move[] = [];
  for (const [dr, dc] of DIAGONALS) {
    if (!king && dr !== forward(seat)) continue;
    let rr = r + dr;
    let cc = c + dc;
    while (rr >= 0 && rr < n && cc >= 0 && cc < n && board[rr * n + cc] === 0) {
      moves.push([from, rr * n + cc]);
      if (!(king && v.flyingKings)) break;
      rr += dr;
      cc += dc;
    }
  }
  return moves;
}

interface Generated {
  moves: Move[];
  captures: Map<string, Capture>;
}

function generate(v: DraughtsVariant, board: readonly Piece[], seat: Seat): Generated {
  const all: Capture[] = [];
  for (let i = 0; i < board.length; i++)
    if (seatOf(board[i]!) === seat) all.push(...captureSequences(v, board, i, seat));
  if (all.length > 0) {
    let pool = all;
    if (v.captureRule !== 'any') {
      const most = Math.max(...pool.map((c) => c.captured.length));
      pool = pool.filter((c) => c.captured.length === most);
      if (v.captureRule === 'max-then-kings') {
        const kings = Math.max(...pool.map((c) => c.kingsCaptured));
        pool = pool.filter((c) => c.kingsCaptured === kings);
      }
    }
    const captures = new Map<string, Capture>();
    for (const c of pool) captures.set(c.path.join('-'), c);
    return { moves: [...captures.values()].map((c) => c.path), captures };
  }
  const moves: Move[] = [];
  for (let i = 0; i < board.length; i++)
    if (seatOf(board[i]!) === seat) moves.push(...quietMoves(v, board, i, seat));
  return { moves, captures: new Map() };
}

export function legalMoves(v: DraughtsVariant, s: DraughtsState): Move[] {
  return s.result ? [] : generate(v, s.board, s.toMove).moves;
}

export function isLegalMove(v: DraughtsVariant, s: DraughtsState, move: unknown): move is Move {
  if (s.result || !Array.isArray(move)) return false;
  const key = move.join('-');
  return legalMoves(v, s).some((m) => m.join('-') === key);
}

/** Squares whose pieces a legal move captures (for UI highlighting). */
export function capturedBy(v: DraughtsVariant, s: DraughtsState, move: Move): number[] {
  return generate(v, s.board, s.toMove).captures.get(move.join('-'))?.captured ?? [];
}

function fmjdEndgameLimit(board: readonly Piece[]): number {
  const count = (seat: Seat) => board.filter((p) => seatOf(p) === seat).length;
  const kings = (seat: Seat) => board.filter((p) => seatOf(p) === seat && isKing(p)).length;
  for (const [strong, weak] of [
    [0, 1],
    [1, 0],
  ] as const) {
    if (count(weak) === 1 && kings(weak) === 1 && kings(strong) >= 1) {
      if (count(strong) === 3) return 32;
      if (count(strong) <= 2) return 10;
    }
  }
  return 0;
}

export function applyMove(v: DraughtsVariant, s: DraughtsState, move: Move): DraughtsState {
  if (s.result) throw new IllegalActionError('The game is over');
  const gen = generate(v, s.board, s.toMove);
  const key = Array.isArray(move) ? move.join('-') : '';
  if (!gen.moves.some((m) => m.join('-') === key))
    throw new IllegalActionError(`Move ${key} is not legal`);
  const n = v.size;
  const seat = s.toMove;
  const board = s.board.slice();
  const from = move[0]!;
  const to = move[move.length - 1]!;
  const moving = board[from]!;
  const captured = gen.captures.get(key)?.captured ?? [];
  board[from] = 0;
  for (const c of captured) board[c] = 0;
  const crowned = !isKing(moving) && Math.floor(to / n) === crownRow(v, seat);
  board[to] = crowned ? kingOf(seat) : moving;
  const irreversible = captured.length > 0 || !isKing(moving);
  const noProgress = irreversible ? 0 : s.noProgress + 1;
  const next: DraughtsState = {
    board,
    toMove: other(seat),
    history: [...s.history, move.slice()],
    noProgress,
    recent: [],
    endgamePlies: 0,
    result: null,
  };
  const keyNow = positionKey(next);
  next.recent = irreversible ? [keyNow] : [...s.recent, keyNow];
  const limit = v.fmjdEndgame ? fmjdEndgameLimit(board) : 0;
  const prevLimit = v.fmjdEndgame ? fmjdEndgameLimit(s.board) : 0;
  next.endgamePlies =
    limit === 0 ? 0 : limit === prevLimit && captured.length === 0 ? s.endgamePlies + 1 : 1;

  if (generate(v, board, next.toMove).moves.length === 0)
    next.result = { kind: 'win', winner: seat, reason: 'no-moves' };
  else if (next.recent.filter((k) => k === keyNow).length >= 3)
    next.result = { kind: 'draw', reason: 'repetition' };
  else if (noProgress >= v.noProgressPlies) next.result = { kind: 'draw', reason: 'no-progress' };
  else if (limit > 0 && next.endgamePlies >= limit)
    next.result = { kind: 'draw', reason: 'endgame-count' };
  return next;
}

export function replayMoves(v: DraughtsVariant, history: readonly Move[]): DraughtsState {
  let s = initialState(v);
  for (const m of history) s = applyMove(v, s, m);
  return s;
}

export const undoMoves = (v: DraughtsVariant, s: DraughtsState, plies: number) =>
  replayMoves(v, s.history.slice(0, Math.max(0, s.history.length - plies)));

export function isValidDraughtsState(v: DraughtsVariant, data: unknown): data is DraughtsState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  try {
    return JSON.stringify(replayMoves(v, data.history as Move[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}

/** Squares numbered 1..N²/2 in the standard draughts notation (row by row from seat 1's side). */
export function squareNumber(v: DraughtsVariant, i: number): number {
  let k = 0;
  for (let j = 0; j <= i; j++) if (isPlayable(v, j)) k++;
  return k;
}
