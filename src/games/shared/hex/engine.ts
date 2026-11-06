/**
 * Hex on an N×N rhombus (#028 7×7, #029 11×11): Red (seat 0, first) joins top and bottom, Blue
 * joins left and right; the swap (pie) rule lets Blue take over Red's first stone, mirrored. No
 * draws are possible. Immutable states, replay validation, winning-chain detection.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export const SWAP = -2;

export interface HexState {
  size: number;
  /** 0 empty, 1 red, 2 blue; index = row·size + col. */
  board: number[];
  toMove: 0 | 1;
  /** Cell indices, or −2 for the swap. */
  history: number[];
  result: { kind: 'win'; winner: 0 | 1; path: number[] } | null;
}

const neighborCache = new Map<number, number[][]>();
export function hexNeighbors(size: number): number[][] {
  let n = neighborCache.get(size);
  if (!n) {
    n = Array.from({ length: size * size }, (_, i) => {
      const r = Math.floor(i / size);
      const c = i % size;
      const out: number[] = [];
      for (const [dr, dc] of [
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
      ] as const) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
      }
      return out;
    });
    neighborCache.set(size, n);
  }
  return n;
}

/** The winning chain of `color` (shortest by BFS), or null when its sides are not joined. */
export function winningPath(board: ArrayLike<number>, size: number, color: 1 | 2): number[] | null {
  const nb = hexNeighbors(size);
  const prev = new Int32Array(size * size).fill(-2);
  const queue: number[] = [];
  for (let k = 0; k < size; k++) {
    const p = color === 1 ? k : k * size; // Red starts on the top row, Blue on the left column
    if (board[p] === color) {
      prev[p] = -1;
      queue.push(p);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head]!;
    const r = Math.floor(p / size);
    const c = p % size;
    if ((color === 1 && r === size - 1) || (color === 2 && c === size - 1)) {
      const path: number[] = [];
      for (let q = p; q >= 0; q = prev[q]!) path.push(q);
      return path.reverse();
    }
    for (const n of nb[p]!) {
      if (board[n] === color && prev[n] === -2) {
        prev[n] = p;
        queue.push(n);
      }
    }
  }
  return null;
}

export function createHexState(size: number): HexState {
  return {
    size,
    board: new Array<number>(size * size).fill(0),
    toMove: 0,
    history: [],
    result: null,
  };
}

/** The swap is available to Blue right after Red's first stone. */
export const canSwap = (s: HexState) =>
  !s.result && s.history.length === 1 && s.history[0] !== SWAP;

export function legalHexActions(s: HexState): number[] {
  if (s.result) return [];
  const out: number[] = [];
  s.board.forEach((v, i) => v === 0 && out.push(i));
  if (canSwap(s)) out.push(SWAP);
  return out;
}

export function isLegalHexAction(s: HexState, a: unknown): a is number {
  if (typeof a !== 'number' || s.result) return false;
  if (a === SWAP) return canSwap(s);
  return Number.isInteger(a) && a >= 0 && a < s.board.length && s.board[a] === 0;
}

export function applyHexAction(s: HexState, a: number): HexState {
  if (!isLegalHexAction(s, a)) throw new IllegalActionError(`Illegal hex action ${a}`);
  const board = s.board.slice();
  if (a === SWAP) {
    // Blue takes over Red's stone, mirrored across the short diagonal so it serves Blue's sides.
    const first = s.history[0]!;
    const r = Math.floor(first / s.size);
    const c = first % s.size;
    board[first] = 0;
    board[c * s.size + r] = 2;
    return { ...s, board, toMove: 0, history: [...s.history, a] };
  }
  const color = s.toMove === 0 ? 1 : 2;
  board[a] = color;
  const path = winningPath(board, s.size, color);
  return {
    ...s,
    board,
    toMove: (1 - s.toMove) as 0 | 1,
    history: [...s.history, a],
    result: path ? { kind: 'win', winner: s.toMove, path } : null,
  };
}

export function replayHex(size: number, history: readonly number[]): HexState {
  return history.reduce((s, a) => applyHexAction(s, a), createHexState(size));
}

export function isValidHexState(size: number, data: unknown): data is HexState {
  if (!isRecord(data) || data.size !== size || !Array.isArray(data.history)) return false;
  try {
    return JSON.stringify(replayHex(size, data.history as number[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
