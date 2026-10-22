/**
 * Domino-placing games on a grid (catalog #047 Domineering, #048 Cram). Players take turns placing
 * a 1×2 domino on two empty, orthogonally adjacent cells. In Domineering the first seat may only
 * place vertical dominoes and the second only horizontal ones; in Cram both may place either way.
 * A player who cannot place a domino on their turn loses (normal play), so there are no draws.
 *
 * Actions: "r,c,v" (cells (r, c) and (r + 1, c)) or "r,c,h" (cells (r, c) and (r, c + 1)).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export type Orientation = 'v' | 'h';

export interface DominoVariant {
  id: string;
  rows: number;
  cols: number;
  /** Orientations each seat may use. */
  allowed: readonly [readonly Orientation[], readonly Orientation[]];
}

export const DOMINEERING: DominoVariant = {
  id: 'domineering',
  rows: 8,
  cols: 8,
  allowed: [['v'], ['h']],
};

export const CRAM: DominoVariant = {
  id: 'cram',
  rows: 5,
  cols: 6,
  allowed: [
    ['v', 'h'],
    ['v', 'h'],
  ],
};

export interface DominoState {
  /** −1 empty, otherwise the index of the domino covering the cell (in history order). */
  cells: number[];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

export function createDominoState(v: DominoVariant, first: 0 | 1 = 0): DominoState {
  return {
    cells: new Array<number>(v.rows * v.cols).fill(-1),
    first,
    toMove: first,
    history: [],
    result: null,
  };
}

/** The two cells of a placement, or null if it leaves the board. */
export function cellsOf(v: DominoVariant, a: string): [number, number] | null {
  const [rs, cs, o] = a.split(',');
  const r = Number(rs);
  const c = Number(cs);
  if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0) return null;
  const r2 = o === 'v' ? r + 1 : r;
  const c2 = o === 'h' ? c + 1 : c;
  if ((o !== 'v' && o !== 'h') || r2 >= v.rows || c2 >= v.cols) return null;
  return [r * v.cols + c, r2 * v.cols + c2];
}

/** Placements available to `seat` on `cells`. */
export function placements(v: DominoVariant, cells: readonly number[], seat: 0 | 1): string[] {
  const out: string[] = [];
  const free = (p: number) => cells[p] === -1;
  for (let r = 0; r < v.rows; r++)
    for (let c = 0; c < v.cols; c++) {
      const p = r * v.cols + c;
      if (!free(p)) continue;
      for (const o of v.allowed[seat]) {
        if (o === 'v' && r + 1 < v.rows && free(p + v.cols)) out.push(`${r},${c},v`);
        if (o === 'h' && c + 1 < v.cols && free(p + 1)) out.push(`${r},${c},h`);
      }
    }
  return out;
}

export function legalDominoActions(v: DominoVariant, s: DominoState): string[] {
  return s.result ? [] : placements(v, s.cells, s.toMove);
}

export function applyDominoAction(v: DominoVariant, s: DominoState, a: string): DominoState {
  if (s.result || !legalDominoActions(v, s).includes(a))
    throw new IllegalActionError(`Illegal placement ${a}`);
  const [p, q] = cellsOf(v, a)!;
  const cells = s.cells.slice();
  cells[p] = s.history.length;
  cells[q] = s.history.length;
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  return {
    ...s,
    cells,
    toMove,
    history: [...s.history, a],
    // The next player has nowhere to go: the mover wins.
    result: placements(v, cells, toMove).length === 0 ? { winner: me } : null,
  };
}

export function replayDominoes(
  v: DominoVariant,
  first: 0 | 1,
  history: readonly string[],
): DominoState {
  return history.reduce((s, a) => applyDominoAction(v, s, a), createDominoState(v, first));
}

export function isValidDominoState(v: DominoVariant, data: unknown): data is DominoState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    const replayed = replayDominoes(v, data.first, data.history as string[]);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}
