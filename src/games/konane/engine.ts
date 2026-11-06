/**
 * Konane on a 6×6 board filled with stones in a checkerboard. Black (seat 0) opens by removing one
 * of its stones from the middle of the board or from a corner; White then removes one of its own
 * stones next to that hole. After that a move jumps one of your stones orthogonally over an
 * adjacent enemy stone into the empty cell just beyond, removing the jumped stone; the same stone
 * may keep jumping in the same direction, over one enemy stone at a time, as far as you choose.
 * The player who cannot move loses, so there are no draws.
 *
 * Actions: "x14" (opening removal of the stone on cell 14) or "14-26" (jump from 14, landing on 26;
 * a landing two, four or more cells away is a multiple jump). Cells are row·6 + col, a6 top-left.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 6;

export interface KonaneState {
  /** 0 empty, 1 = seat 0 (Black), 2 = seat 1 (White). */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

/** Black on the squares of a6's color. */
export function createKonaneState(): KonaneState {
  const board = Array.from({ length: N * N }, (_, p) =>
    (Math.floor(p / N) + (p % N)) % 2 === 0 ? 1 : 2,
  );
  return { board, toMove: 0, history: [], result: null };
}

const CENTER = [14, 15, 20, 21];
const CORNERS = [0, N - 1, N * (N - 1), N * N - 1];
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

const neighbors = (p: number) =>
  DIRS.map(([dr, dc]) => [Math.floor(p / N) + dr, (p % N) + dc] as const)
    .filter(([r, c]) => r >= 0 && r < N && c >= 0 && c < N)
    .map(([r, c]) => r * N + c);

/** Jumps for `color`: [from, to] for every landing cell reachable in a straight line. */
export function jumpsOf(board: readonly number[], color: number): [number, number][] {
  const out: [number, number][] = [];
  for (let p = 0; p < N * N; p++) {
    if (board[p] !== color) continue;
    const r0 = Math.floor(p / N);
    const c0 = p % N;
    for (const [dr, dc] of DIRS) {
      let r = r0;
      let c = c0;
      for (;;) {
        const over = [r + dr, c + dc] as const;
        const land = [r + 2 * dr, c + 2 * dc] as const;
        if (land[0] < 0 || land[0] >= N || land[1] < 0 || land[1] >= N) break;
        if (board[over[0] * N + over[1]] !== 3 - color || board[land[0] * N + land[1]] !== 0) break;
        out.push([p, land[0] * N + land[1]]);
        [r, c] = land;
      }
    }
  }
  return out;
}

export function legalKonaneActions(s: KonaneState): string[] {
  if (s.result) return [];
  const ply = s.history.length;
  if (ply === 0) return [...CENTER, ...CORNERS].filter((p) => s.board[p] === 1).map((p) => `x${p}`);
  if (ply === 1) {
    const hole = s.board.indexOf(0);
    return neighbors(hole)
      .filter((p) => s.board[p] === 2)
      .map((p) => `x${p}`);
  }
  return jumpsOf(s.board, s.toMove + 1).map(([p, q]) => `${p}-${q}`);
}

export function applyKonaneAction(s: KonaneState, a: string): KonaneState {
  if (s.result || !legalKonaneActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const board = s.board.slice();
  if (a.startsWith('x')) board[Number(a.slice(1))] = 0;
  else {
    const [from, to] = a.split('-').map(Number) as [number, number];
    const step = Math.abs(to - from) < N ? Math.sign(to - from) : Math.sign(to - from) * N;
    // Each hop removes the stone just past the current square.
    for (let p = from; p !== to; p += 2 * step) board[p + step] = 0;
    board[to] = board[from]!;
    board[from] = 0;
  }
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  const history = [...s.history, a];
  const next: KonaneState = { board, toMove, history, result: null };
  if (history.length >= 2 && jumpsOf(board, toMove + 1).length === 0) next.result = { winner: me };
  return next;
}

export function replayKonane(history: readonly string[]): KonaneState {
  return history.reduce((s, a) => applyKonaneAction(s, a), createKonaneState());
}

export function isValidKonaneState(data: unknown): data is KonaneState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayKonane(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
