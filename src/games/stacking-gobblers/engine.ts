/**
 * Nesting tic-tac-toe (catalog entry #035, shown under a generic name): a 3×3 board and six
 * pieces per player in three sizes (two each). A turn places a piece from the reserve, or moves one
 * of your visible pieces, onto an empty cell or onto a strictly smaller piece, which it covers.
 * Three of your visible pieces in a line win. Lifting a piece can uncover an opponent's line: if
 * after the move the opponent shows a line, the opponent wins (even if the mover shows one too).
 *
 * Actions: "R2>4" (place a size-2 piece from the reserve on cell 4) or "3>4" (move the top piece
 * of cell 3 onto cell 4). Sizes: 1 small, 2 medium, 3 large.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

/** A piece code: owner·4 + size (owner 0 → 1–3, owner 1 → 5–7). */
export type Piece = number;
export const ownerOf = (p: Piece) => (p >= 4 ? 1 : 0);
export const sizeOf = (p: Piece) => p & 3;

export interface GobbleState {
  /** Stack of pieces per cell, bottom first. */
  board: Piece[][];
  /** Pieces left in reserve per seat, by size (index 1–3). */
  reserve: [number[], number[]];
  toMove: 0 | 1;
  history: string[];
  keys: string[];
  result:
    | { kind: 'win'; winner: 0 | 1; line: number[] }
    | { kind: 'draw'; reason: 'repetition' | 'limit' }
    | null;
}

export const LINES3 = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export const PLY_LIMIT = 120;

const top = (stack: readonly Piece[]) => stack[stack.length - 1];
const keyOf = (s: Pick<GobbleState, 'board' | 'reserve' | 'toMove'>) =>
  `${s.board.map((c) => c.join('')).join('/')}|${s.reserve.map((r) => r.join('')).join('/')}|${s.toMove}`;

export function createGobbleState(): GobbleState {
  const s = {
    board: Array.from({ length: 9 }, () => [] as Piece[]),
    reserve: [
      [0, 2, 2, 2],
      [0, 2, 2, 2],
    ] as [number[], number[]],
    toMove: 0 as const,
  };
  return { ...s, history: [], keys: [keyOf(s)], result: null };
}

/** The line shown by `seat` (visible top pieces), if any. */
export function lineOf(board: readonly Piece[][], seat: 0 | 1): number[] | null {
  for (const line of LINES3) {
    if (
      line.every((c) => {
        const t = top(board[c]!);
        return t !== undefined && ownerOf(t) === seat;
      })
    )
      return [...line];
  }
  return null;
}

export function legalGobbleActions(s: GobbleState): string[] {
  if (s.result) return [];
  const me = s.toMove;
  const out: string[] = [];
  const fits = (size: number, cell: number) => {
    const t = top(s.board[cell]!);
    return t === undefined || sizeOf(t) < size;
  };
  for (let size = 1; size <= 3; size++) {
    if (!s.reserve[me][size]) continue;
    for (let c = 0; c < 9; c++) if (fits(size, c)) out.push(`R${size}>${c}`);
  }
  for (let from = 0; from < 9; from++) {
    const t = top(s.board[from]!);
    if (t === undefined || ownerOf(t) !== me) continue;
    for (let c = 0; c < 9; c++) if (c !== from && fits(sizeOf(t), c)) out.push(`${from}>${c}`);
  }
  return out;
}

export function applyGobbleAction(s: GobbleState, a: string): GobbleState {
  if (s.result || !legalGobbleActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove;
  const board = s.board.map((c) => c.slice());
  const reserve: [number[], number[]] = [s.reserve[0].slice(), s.reserve[1].slice()];
  const [src, dst] = a.split('>');
  const to = Number(dst);
  if (src!.startsWith('R')) {
    const size = Number(src!.slice(1));
    reserve[me][size]!--;
    board[to]!.push(me * 4 + size);
  } else {
    const piece = board[Number(src)]!.pop()!;
    board[to]!.push(piece);
  }
  const toMove = (1 - me) as 0 | 1;
  const next = { board, reserve, toMove };
  const keys = [...s.keys, keyOf(next)];
  const history = [...s.history, a];
  let result: GobbleState['result'] = null;
  const theirs = lineOf(board, toMove);
  const mine = lineOf(board, me);
  if (theirs) result = { kind: 'win', winner: toMove, line: theirs };
  else if (mine) result = { kind: 'win', winner: me, line: mine };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    result = { kind: 'draw', reason: 'repetition' };
  else if (history.length >= PLY_LIMIT) result = { kind: 'draw', reason: 'limit' };
  return { ...next, history, keys, result };
}

export function replayGobble(history: readonly string[]): GobbleState {
  return history.reduce((s, a) => applyGobbleAction(s, a), createGobbleState());
}

export function isValidGobbleState(data: unknown): data is GobbleState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayGobble(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
