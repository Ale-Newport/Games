/**
 * Alquerque on the 5 × 5 board of points: orthogonal lines everywhere, diagonals through every
 * other point (row + column even). Each side has 12 pieces; only the center starts empty. White
 * (seat 0) starts at the bottom and moves first.
 *
 * A non-capturing move steps one point along a line, forward or sideways — never backward.
 * A capture jumps along a line over an adjacent enemy piece into the empty point beyond (in any
 * direction, backward included) and removes it. Capturing is compulsory, and so is continuing:
 * while the jumping piece can capture again it must (each further jump is another action by the
 * same player). A player with no pieces or no legal move loses; threefold repetition or 200 plies
 * without a capture is a draw.
 *
 * Actions: "f-t" (points row·5 + col, row 0 at the top).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 5;
export const QUIET_LIMIT = 200;

export interface AlquerqueState {
  /** 0 empty, 1 = seat 0 (White, bottom), 2 = seat 1 (Black, top). */
  board: number[];
  toMove: 0 | 1;
  /** The piece that must keep jumping, while a capture chain continues. */
  chain: number | null;
  movers: (0 | 1)[];
  history: string[];
  keys: string[];
  quiet: number;
  result: { winner: 0 | 1 | null; reason: 'wiped' | 'stuck' | 'repetition' | 'quiet' } | null;
}

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

export function stepFrom(p: number, d: number): number {
  const r = Math.floor(p / N);
  const c = p % N;
  if (d >= 4 && (r + c) % 2 !== 0) return -1;
  const rr = r + DIRS[d]![0];
  const cc = c + DIRS[d]![1];
  return rr >= 0 && rr < N && cc >= 0 && cc < N ? rr * N + cc : -1;
}

const keyOf = (s: Pick<AlquerqueState, 'board' | 'toMove'>) => `${s.board.join('')}|${s.toMove}`;

export function createAlquerqueState(): AlquerqueState {
  const board = new Array<number>(N * N).fill(0);
  for (let p = 0; p < 10; p++) board[p] = 2;
  for (let p = 15; p < 25; p++) board[p] = 1;
  // Middle row: each side's two pieces on its own right.
  board[10] = 2;
  board[11] = 2;
  board[13] = 1;
  board[14] = 1;
  const s: AlquerqueState = {
    board,
    toMove: 0,
    chain: null,
    movers: [],
    history: [],
    keys: [],
    quiet: 0,
    result: null,
  };
  s.keys = [keyOf(s)];
  return s;
}

/** Row direction that counts as backward for a color (White moves up the board). */
const backward = (color: number) => (color === 1 ? 1 : -1);

function captures(board: readonly number[], from: number): number[] {
  const me = board[from]!;
  const out: number[] = [];
  for (let d = 0; d < 8; d++) {
    const over = stepFrom(from, d);
    if (over < 0 || board[over] !== 3 - me) continue;
    const to = stepFrom(over, d);
    if (to >= 0 && board[to] === 0) out.push(to);
  }
  return out;
}

export function movesOf(s: Pick<AlquerqueState, 'board' | 'toMove' | 'chain'>): [number, number][] {
  if (s.chain !== null) return captures(s.board, s.chain).map((t) => [s.chain!, t]);
  const me = s.toMove + 1;
  const jumps: [number, number][] = [];
  const steps: [number, number][] = [];
  s.board.forEach((x, p) => {
    if (x !== me) return;
    for (const t of captures(s.board, p)) jumps.push([p, t]);
    for (let d = 0; d < 8; d++) {
      const t = stepFrom(p, d);
      if (t < 0 || s.board[t] !== 0) continue;
      if (Math.sign(Math.floor(t / N) - Math.floor(p / N)) === backward(me)) continue;
      steps.push([p, t]);
    }
  });
  return jumps.length ? jumps : steps;
}

export function legalAlquerqueActions(s: AlquerqueState): string[] {
  if (s.result) return [];
  return movesOf(s).map(([f, t]) => `${f}-${t}`);
}

export function applyAlquerqueAction(s: AlquerqueState, a: string): AlquerqueState {
  if (s.result || !legalAlquerqueActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const [from, to] = a.split('-').map(Number) as [number, number];
  const board = s.board.slice();
  const me = s.toMove;
  const isJump = captures(s.board, from).includes(to);
  board[to] = board[from]!;
  board[from] = 0;
  if (isJump) {
    const d = [0, 1, 2, 3, 4, 5, 6, 7].find(
      (dd) => stepFrom(stepFrom(from, dd), dd) === to && stepFrom(from, dd) >= 0,
    )!;
    board[stepFrom(from, d)] = 0;
  }
  const movers = [...s.movers, me];
  const history = [...s.history, a];
  if (isJump && captures(board, to).length > 0 && board.some((x) => x === 2 - me)) {
    return { ...s, board, chain: to, movers, history, quiet: 0 };
  }
  const toMove = (1 - me) as 0 | 1;
  const quiet = isJump ? 0 : s.quiet + 1;
  const base = { board, toMove };
  const keys = [...s.keys, keyOf(base)];
  const next: AlquerqueState = {
    board,
    toMove,
    chain: null,
    movers,
    history,
    keys,
    quiet,
    result: null,
  };
  if (!board.includes(toMove + 1)) next.result = { winner: me, reason: 'wiped' };
  else if (movesOf(next).length === 0) next.result = { winner: me, reason: 'stuck' };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    next.result = { winner: null, reason: 'repetition' };
  else if (quiet >= QUIET_LIMIT) next.result = { winner: null, reason: 'quiet' };
  return next;
}

export function replayAlquerque(history: readonly string[]): AlquerqueState {
  return history.reduce((s, a) => applyAlquerqueAction(s, a), createAlquerqueState());
}

export function isValidAlquerqueState(data: unknown): data is AlquerqueState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayAlquerque(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
