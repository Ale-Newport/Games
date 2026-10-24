/**
 * Game of the Amazons on a 10 × 10 board. Each player has four amazons that move like chess queens
 * (any distance in a straight line or diagonal, never through anything). A turn is one amazon move
 * followed by an arrow shot from the amazon's new square, again like a queen; the arrow burns the
 * square where it lands for the rest of the game. Nothing is captured. The player who cannot make a
 * full turn on their move loses (so the last player to move wins — no draws).
 *
 * White (seat 0) starts at a4, d1, g1, j4 and Black at a7, d10, g10, j7. Rounds may alternate who
 * opens. Cells: index = y·10 + x, y = 0 being the top row (rank 10).
 * Actions: "from-to-arrow" (cell indices).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 10;
export const EMPTY = 0;
export const ARROW = 3;

export interface AmazonsState {
  /** 0 empty, 1 White amazon, 2 Black amazon, 3 burned square. */
  board: number[];
  toMove: 0 | 1;
  first: 0 | 1;
  history: string[];
  result: { winner: 0 | 1; reason: 'stuck' } | null;
}

export const START: readonly [readonly number[], readonly number[]] = [
  [60, 93, 96, 69],
  [30, 3, 6, 39],
];

const DX = [1, -1, 0, 0, 1, -1, 1, -1];
const DY = [0, 0, 1, -1, 1, -1, -1, 1];

export const cellName = (c: number) => `${'abcdefghij'[c % N]}${N - Math.floor(c / N)}`;

export function createAmazonsState(first: 0 | 1 = 0): AmazonsState {
  const board = new Array<number>(N * N).fill(EMPTY);
  START.forEach((cells, seat) => cells.forEach((c) => (board[c] = seat + 1)));
  return { board, toMove: first, first, history: [], result: null };
}

/** Squares a queen on `from` reaches over empty squares. */
export function queenTargets(board: ArrayLike<number>, from: number, out: number[] = []): number[] {
  const x0 = from % N;
  const y0 = (from - x0) / N;
  for (let d = 0; d < 8; d++) {
    let x = x0 + DX[d]!;
    let y = y0 + DY[d]!;
    while (x >= 0 && x < N && y >= 0 && y < N && board[y * N + x] === EMPTY) {
      out.push(y * N + x);
      x += DX[d]!;
      y += DY[d]!;
    }
  }
  return out;
}

export const parseMove = (a: string) => a.split('-').map(Number) as [number, number, number];

/** Every full turn (move + arrow) for the player to move, as [from, to, arrow] triples. */
export function turnsFor(board: number[], seat: 0 | 1): [number, number, number][] {
  const out: [number, number, number][] = [];
  const me = seat + 1;
  for (let f = 0; f < N * N; f++) {
    if (board[f] !== me) continue;
    const tos = queenTargets(board, f);
    board[f] = EMPTY;
    for (const t of tos) {
      board[t] = me;
      for (const a of queenTargets(board, t)) out.push([f, t, a]);
      board[t] = EMPTY;
    }
    board[f] = me;
  }
  return out;
}

export function legalAmazonsActions(s: AmazonsState): string[] {
  if (s.result) return [];
  return turnsFor(s.board.slice(), s.toMove).map(([f, t, a]) => `${f}-${t}-${a}`);
}

export function hasTurn(board: readonly number[], seat: 0 | 1): boolean {
  // An amazon that can move can always shoot back to the square it left.
  for (let c = 0; c < N * N; c++)
    if (board[c] === seat + 1 && queenTargets(board, c).length > 0) return true;
  return false;
}

export function isLegalTurn(s: AmazonsState, f: number, t: number, a: number): boolean {
  if (s.result || s.board[f] !== s.toMove + 1) return false;
  if (!queenTargets(s.board, f).includes(t)) return false;
  const b = s.board.slice();
  b[f] = EMPTY;
  b[t] = s.toMove + 1;
  return queenTargets(b, t).includes(a);
}

export function applyAmazonsAction(s: AmazonsState, a: string): AmazonsState {
  if (typeof a !== 'string' || !/^\d+-\d+-\d+$/.test(a))
    throw new IllegalActionError(`Illegal move ${String(a)}`);
  const [f, t, x] = parseMove(a);
  if (!isLegalTurn(s, f, t, x)) throw new IllegalActionError(`Illegal move ${a}`);
  const board = s.board.slice();
  board[t] = board[f]!;
  board[f] = EMPTY;
  board[x] = ARROW;
  const toMove = (1 - s.toMove) as 0 | 1;
  return {
    board,
    toMove,
    first: s.first,
    history: [...s.history, a],
    result: hasTurn(board, toMove) ? null : { winner: s.toMove, reason: 'stuck' },
  };
}

export function replayAmazons(history: readonly string[], first: 0 | 1 = 0): AmazonsState {
  return history.reduce((s, a) => applyAmazonsAction(s, a), createAmazonsState(first));
}

export function isValidAmazonsState(data: unknown): data is AmazonsState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  try {
    const replayed = replayAmazons(data.history as string[], data.first);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}
