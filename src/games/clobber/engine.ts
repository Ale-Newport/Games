/**
 * Clobber on a 6×6 board that starts completely filled with stones in a checkerboard pattern.
 * A move takes one of your stones onto an orthogonally adjacent opponent stone, which is removed
 * ("clobbered"); the moving stone takes its place and its old cell becomes empty. Moves never
 * go onto empty cells. The player who cannot move loses, so there are no draws.
 *
 * Actions: "14-15" (from-to; cells row·6 + col, a6 top-left). White (seat 0) owns the light
 * squares' stones (a6 is White).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 6;

export interface ClobberState {
  /** 0 empty, 1 = seat 0 (White), 2 = seat 1 (Black). */
  board: number[];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

export function createClobberState(first: 0 | 1 = 0): ClobberState {
  const board = Array.from({ length: N * N }, (_, p) =>
    (Math.floor(p / N) + (p % N)) % 2 === 0 ? 1 : 2,
  );
  return { board, first, toMove: first, history: [], result: null };
}

const steps = (p: number): number[] => {
  const r = Math.floor(p / N);
  const c = p % N;
  const out: number[] = [];
  if (r > 0) out.push(p - N);
  if (r < N - 1) out.push(p + N);
  if (c > 0) out.push(p - 1);
  if (c < N - 1) out.push(p + 1);
  return out;
};

export function movesOf(board: readonly number[], color: number): [number, number][] {
  const out: [number, number][] = [];
  for (let p = 0; p < N * N; p++) {
    if (board[p] !== color) continue;
    for (const q of steps(p)) if (board[q] === 3 - color) out.push([p, q]);
  }
  return out;
}

export function legalClobberActions(s: ClobberState): string[] {
  if (s.result) return [];
  return movesOf(s.board, s.toMove + 1).map(([p, q]) => `${p}-${q}`);
}

export function applyClobberAction(s: ClobberState, a: string): ClobberState {
  if (s.result || !legalClobberActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const [from, to] = a.split('-').map(Number) as [number, number];
  const board = s.board.slice();
  board[to] = board[from]!;
  board[from] = 0;
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  return {
    ...s,
    board,
    toMove,
    history: [...s.history, a],
    result: movesOf(board, toMove + 1).length === 0 ? { winner: me } : null,
  };
}

export function replayClobber(first: 0 | 1, history: readonly string[]): ClobberState {
  return history.reduce((s, a) => applyClobberAction(s, a), createClobberState(first));
}

export function isValidClobberState(data: unknown): data is ClobberState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayClobber(data.first, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
