/**
 * Pure rules engine for Reversi on an even N×N board (#010 8×8, #011 6×6):
 * standard four-disc start, Black moves first, a move must flip at least one line of opposing
 * discs (8 directions), a player with no legal move must pass, the game ends when neither player
 * can move, and the player with more discs wins (equal counts draw).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export type Seat = 0 | 1;
/** 0 empty, 1 black, 2 white. */
export type Disc = 0 | 1 | 2;

export interface ReversiRules {
  size: number;
}

export type ReversiResult =
  { kind: 'win'; winner: Seat; reason: 'disc-count' } | { kind: 'draw'; reason: 'disc-count' };

export interface ReversiState {
  board: Disc[];
  toMove: Seat;
  /** Board indices played, or `size * size` for a pass. */
  history: number[];
  /** Discs flipped by the last move (display only; derived from history). */
  lastFlipped: number[];
  result: ReversiResult | null;
}

const DIRS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export const discOf = (seat: Seat): Disc => (seat === 0 ? 1 : 2);
export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);
export const passAction = (rules: ReversiRules) => rules.size * rules.size;

export function createReversiState(rules: ReversiRules): ReversiState {
  const n = rules.size;
  if (n < 4 || n % 2 !== 0) throw new Error('Reversi needs an even board size ≥ 4');
  const board = new Array<Disc>(n * n).fill(0);
  const a = n / 2 - 1;
  const b = n / 2;
  board[a * n + a] = 2;
  board[a * n + b] = 1;
  board[b * n + a] = 1;
  board[b * n + b] = 2;
  return { board, toMove: 0, history: [], lastFlipped: [], result: null };
}

/** Discs that `seat` would flip by playing index i (empty list = illegal). */
export function flipsFor(
  rules: ReversiRules,
  board: readonly Disc[],
  i: number,
  seat: Seat,
): number[] {
  if (board[i] !== 0) return [];
  const n = rules.size;
  const own = discOf(seat);
  const opp = discOf(other(seat));
  const r = Math.floor(i / n);
  const c = i % n;
  const flips: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let rr = r + dr;
    let cc = c + dc;
    while (rr >= 0 && rr < n && cc >= 0 && cc < n && board[rr * n + cc] === opp) {
      line.push(rr * n + cc);
      rr += dr;
      cc += dc;
    }
    if (line.length && rr >= 0 && rr < n && cc >= 0 && cc < n && board[rr * n + cc] === own)
      flips.push(...line);
  }
  return flips;
}

export function placementMoves(rules: ReversiRules, board: readonly Disc[], seat: Seat): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++)
    if (board[i] === 0 && flipsFor(rules, board, i, seat).length) moves.push(i);
  return moves;
}

/** Legal actions: placements, or only the pass action when the player has none. */
export function legalActions(rules: ReversiRules, s: ReversiState): number[] {
  if (s.result) return [];
  const moves = placementMoves(rules, s.board, s.toMove);
  return moves.length ? moves : [passAction(rules)];
}

export function isLegalAction(rules: ReversiRules, s: ReversiState, a: number): boolean {
  if (s.result || !Number.isInteger(a)) return false;
  if (a === passAction(rules)) return placementMoves(rules, s.board, s.toMove).length === 0;
  return a >= 0 && a < rules.size * rules.size && flipsFor(rules, s.board, a, s.toMove).length > 0;
}

export function countDiscs(board: readonly Disc[]): [number, number] {
  let black = 0;
  let white = 0;
  for (const d of board) {
    if (d === 1) black++;
    else if (d === 2) white++;
  }
  return [black, white];
}

function finish(board: readonly Disc[]): ReversiResult {
  const [b, w] = countDiscs(board);
  return b === w
    ? { kind: 'draw', reason: 'disc-count' }
    : { kind: 'win', winner: b > w ? 0 : 1, reason: 'disc-count' };
}

export function applyReversi(rules: ReversiRules, s: ReversiState, a: number): ReversiState {
  if (!isLegalAction(rules, s, a))
    throw new IllegalActionError(s.result ? 'The game is over' : `Action ${a} is not legal`);
  const mover = s.toMove;
  const board = s.board.slice();
  let flipped: number[] = [];
  if (a !== passAction(rules)) {
    flipped = flipsFor(rules, board, a, mover);
    board[a] = discOf(mover);
    for (const f of flipped) board[f] = discOf(mover);
  }
  const next = other(mover);
  // The game ends when neither side can place a disc.
  const ended =
    placementMoves(rules, board, next).length === 0 &&
    placementMoves(rules, board, mover).length === 0;
  return {
    board,
    toMove: next,
    history: [...s.history, a],
    lastFlipped: flipped.sort((x, y) => x - y),
    result: ended ? finish(board) : null,
  };
}

export function reversiFromHistory(rules: ReversiRules, history: readonly number[]): ReversiState {
  let s = createReversiState(rules);
  for (const a of history) s = applyReversi(rules, s, a);
  return s;
}

export const undoReversi = (rules: ReversiRules, s: ReversiState, plies: number) =>
  reversiFromHistory(rules, s.history.slice(0, Math.max(0, s.history.length - plies)));

export function isValidReversiState(rules: ReversiRules, data: unknown): data is ReversiState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  try {
    return (
      JSON.stringify(reversiFromHistory(rules, data.history as number[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

/** Seat that took action number `ply` — needed because passes do not break alternation. */
export const moverOfPly = (ply: number): Seat => (ply % 2 === 0 ? 0 : 1);
