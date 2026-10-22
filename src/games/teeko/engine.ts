/**
 * Teeko: a 5×5 board, four markers each. Players first drop their markers one at a time, then
 * move one marker per turn to an adjacent empty cell (any of eight directions). Four in a straight
 * line (row, column or diagonal) or four forming a 2×2 square wins. Threefold repetition and a
 * 200-ply limit draw.
 *
 * Actions: "12" (drop on cell 12) or "12-13" (move). Cells: row·5 + col, row 0 at the top.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export interface TeekoState {
  /** 0 empty, 1 = seat 0 (Black, first), 2 = seat 1 (Red). */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  keys: string[];
  result:
    | { kind: 'win'; winner: 0 | 1; shape: number[] }
    | { kind: 'draw'; reason: 'repetition' | 'limit' }
    | null;
}

export const PLY_LIMIT = 200;
export const MARKERS = 4;

/** Every winning shape: straight lines of four and 2×2 squares. */
export const SHAPES: readonly (readonly number[])[] = (() => {
  const out: number[][] = [];
  const at = (r: number, c: number) => r * 5 + c;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++) {
      for (const [dr, dc] of dirs) {
        const end = [r + 3 * dr!, c + 3 * dc!];
        if (end[0]! < 0 || end[0]! > 4 || end[1]! < 0 || end[1]! > 4) continue;
        out.push([0, 1, 2, 3].map((k) => at(r + k * dr!, c + k * dc!)));
      }
      if (r < 4 && c < 4) out.push([at(r, c), at(r, c + 1), at(r + 1, c), at(r + 1, c + 1)]);
    }
  return out;
})();

export const NEIGHBORS: readonly number[][] = Array.from({ length: 25 }, (_, p) => {
  const r = Math.floor(p / 5);
  const c = p % 5;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < 5 && cc >= 0 && cc < 5) out.push(rr * 5 + cc);
    }
  return out;
});

const keyOf = (board: readonly number[], toMove: number) => `${board.join('')}|${toMove}`;

export function createTeekoState(): TeekoState {
  const board = new Array<number>(25).fill(0);
  return { board, toMove: 0, history: [], keys: [keyOf(board, 0)], result: null };
}

export const dropping = (s: Pick<TeekoState, 'board' | 'toMove'>) =>
  s.board.filter((v) => v === s.toMove + 1).length < MARKERS;

export function legalTeekoActions(s: TeekoState): string[] {
  if (s.result) return [];
  const me = s.toMove + 1;
  const out: string[] = [];
  if (dropping(s)) {
    s.board.forEach((v, p) => v === 0 && out.push(String(p)));
    return out;
  }
  s.board.forEach((v, p) => {
    if (v !== me) return;
    for (const q of NEIGHBORS[p]!) if (s.board[q] === 0) out.push(`${p}-${q}`);
  });
  return out;
}

export function shapeOf(board: readonly number[], color: number): number[] | null {
  for (const shape of SHAPES) if (shape.every((p) => board[p] === color)) return [...shape];
  return null;
}

export function applyTeekoAction(s: TeekoState, a: string): TeekoState {
  if (s.result || !legalTeekoActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove + 1;
  const board = s.board.slice();
  const [from, to] = a.includes('-') ? a.split('-').map(Number) : [-1, Number(a)];
  if (from! >= 0) board[from!] = 0;
  board[to!] = me;
  const toMove = (1 - s.toMove) as 0 | 1;
  const keys = [...s.keys, keyOf(board, toMove)];
  const history = [...s.history, a];
  let result: TeekoState['result'] = null;
  const shape = shapeOf(board, me);
  if (shape) result = { kind: 'win', winner: s.toMove, shape };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    result = { kind: 'draw', reason: 'repetition' };
  else if (history.length >= PLY_LIMIT) result = { kind: 'draw', reason: 'limit' };
  return { board, toMove, history, keys, result };
}

export function replayTeeko(history: readonly string[]): TeekoState {
  return history.reduce((s, a) => applyTeekoAction(s, a), createTeekoState());
}

export function isValidTeekoState(data: unknown): data is TeekoState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayTeeko(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
