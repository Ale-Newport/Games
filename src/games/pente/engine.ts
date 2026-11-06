/**
 * Pure rules engine for Pente (ruleset `pente-tournament-19x19`, see GAME_SPEC.md):
 * 19×19, five or more in a row wins, custodial pair captures, five captured pairs win,
 * first stone on the center, tournament rule for the first player's second stone.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { LINE_DIRECTIONS } from '../../core/game-engine/grid';
import { isRecord } from '../../core/persistence/versioned';

export type Seat = 0 | 1;
export type Stone = 0 | 1 | 2;

export const SIZE = 19;
export const CENTER = 9 * SIZE + 9;
export const CAPTURES_TO_WIN = 5;
/** Chebyshev distance the first player's second stone must keep from the center. */
export const TOURNAMENT_DISTANCE = 3;

export type PenteResult =
  | { kind: 'win'; winner: Seat; reason: 'five'; line: number[] }
  | { kind: 'win'; winner: Seat; reason: 'captures'; line: [] }
  | { kind: 'draw'; reason: 'board-full' };

export interface PenteState {
  board: Stone[];
  toMove: Seat;
  firstPlayer: Seat;
  history: number[];
  /** Pairs captured by each seat. */
  captures: [number, number];
  /** Points emptied by the most recent move's captures (for display). */
  lastCaptured: number[];
  result: PenteResult | null;
}

const ALL_DIRS: readonly (readonly [number, number])[] = [
  ...LINE_DIRECTIONS,
  ...LINE_DIRECTIONS.map(([r, c]) => [-r, -c] as const),
];
export const stoneOf = (seat: Seat): Stone => (seat === 0 ? 1 : 2);
export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);
const inside = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export function createState(firstPlayer: Seat = 0): PenteState {
  return {
    board: new Array<Stone>(SIZE * SIZE).fill(0),
    toMove: firstPlayer,
    firstPlayer,
    history: [],
    captures: [0, 0],
    lastCaptured: [],
    result: null,
  };
}

export function chebyshevFromCenter(i: number): number {
  return Math.max(Math.abs(Math.floor(i / SIZE) - 9), Math.abs((i % SIZE) - 9));
}

export function isLegal(s: PenteState, i: number): boolean {
  if (s.result || !Number.isInteger(i) || i < 0 || i >= SIZE * SIZE || s.board[i] !== 0)
    return false;
  if (s.history.length === 0) return i === CENTER;
  // Tournament rule: the first player's second stone is at least 3 points from the center.
  if (s.history.length === 2) return chebyshevFromCenter(i) >= TOURNAMENT_DISTANCE;
  return true;
}

export function legalMoves(s: PenteState): number[] {
  if (s.result) return [];
  const moves: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) if (isLegal(s, i)) moves.push(i);
  return moves;
}

/** Opponent pairs bracketed by a stone of `mover` placed at i (does not modify the board). */
export function capturesAt(board: readonly Stone[], i: number, mover: Seat): number[] {
  const own = stoneOf(mover);
  const opp = stoneOf(other(mover));
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const taken: number[] = [];
  for (const [dr, dc] of ALL_DIRS) {
    const r1 = r + dr,
      c1 = c + dc,
      r2 = r + 2 * dr,
      c2 = c + 2 * dc,
      r3 = r + 3 * dr,
      c3 = c + 3 * dc;
    if (!inside(r3, c3)) continue;
    if (
      board[r1 * SIZE + c1] === opp &&
      board[r2 * SIZE + c2] === opp &&
      board[r3 * SIZE + c3] === own
    ) {
      taken.push(r1 * SIZE + c1, r2 * SIZE + c2);
    }
  }
  return taken;
}

/** The run of `stone` through i of length ≥ 5, if any. */
export function fiveThrough(board: readonly Stone[], i: number): number[] | null {
  const stone = board[i];
  if (!stone) return null;
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  for (const [dr, dc] of LINE_DIRECTIONS) {
    const run = [i];
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (inside(rr, cc) && board[rr * SIZE + cc] === stone) {
        run.push(rr * SIZE + cc);
        rr += dr * s;
        cc += dc * s;
      }
    }
    if (run.length >= 5) return run.sort((a, b) => a - b);
  }
  return null;
}

export function play(s: PenteState, i: number): PenteState {
  if (!isLegal(s, i))
    throw new IllegalActionError(s.result ? 'The game is over' : `Point ${i} is not playable`);
  const mover = s.toMove;
  const board = s.board.slice();
  board[i] = stoneOf(mover);
  const taken = capturesAt(board, i, mover);
  for (const t of taken) board[t] = 0;
  const captures: [number, number] = [s.captures[0], s.captures[1]];
  captures[mover] += taken.length / 2;
  const history = [...s.history, i];
  let result: PenteResult | null = null;
  const five = fiveThrough(board, i);
  if (five) result = { kind: 'win', winner: mover, reason: 'five', line: five };
  else if (captures[mover] >= CAPTURES_TO_WIN)
    result = { kind: 'win', winner: mover, reason: 'captures', line: [] };
  else if (!board.includes(0)) result = { kind: 'draw', reason: 'board-full' };
  return {
    board,
    toMove: other(mover),
    firstPlayer: s.firstPlayer,
    history,
    captures,
    lastCaptured: taken.sort((a, b) => a - b),
    result,
  };
}

export function replay(history: readonly number[], firstPlayer: Seat = 0): PenteState {
  let s = createState(firstPlayer);
  for (const i of history) s = play(s, i);
  return s;
}

export const undo = (s: PenteState, plies: number) =>
  replay(s.history.slice(0, Math.max(0, s.history.length - plies)), s.firstPlayer);

export function isValidState(data: unknown): data is PenteState {
  if (
    !isRecord(data) ||
    !Array.isArray(data.history) ||
    (data.firstPlayer !== 0 && data.firstPlayer !== 1)
  )
    return false;
  try {
    return (
      JSON.stringify(replay(data.history as number[], data.firstPlayer)) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
