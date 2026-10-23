/**
 * SOS on a 6×6 grid: players take turns writing an S or an O in an empty cell. Every new line of
 * three cells reading S-O-S (across, down or diagonally, through the cell just written) scores a
 * point for the writer, who then writes again. When the grid is full the higher score wins; equal
 * scores draw.
 *
 * Actions: "S14" or "O14" (letter and cell, cells row·6 + col from the top-left).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 6;
export type Letter = 'S' | 'O';
const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export interface SosLine {
  cells: [number, number, number];
  seat: 0 | 1;
}

export interface SosState {
  /** '' empty, 'S' or 'O'. */
  cells: ('' | Letter)[];
  first: 0 | 1;
  toMove: 0 | 1;
  /** Seat that wrote each letter of `history` (a scoring writer goes again). */
  movers: (0 | 1)[];
  history: string[];
  scores: [number, number];
  lines: SosLine[];
  result: { winner: 0 | 1 | null } | null;
}

export function createSosState(first: 0 | 1 = 0): SosState {
  return {
    cells: new Array<'' | Letter>(N * N).fill(''),
    first,
    toMove: first,
    movers: [],
    history: [],
    scores: [0, 0],
    lines: [],
    result: null,
  };
}

const at = (cells: readonly string[], r: number, c: number) =>
  r >= 0 && r < N && c >= 0 && c < N ? cells[r * N + c] : undefined;

/** S-O-S lines through cell `p` (which must already hold its letter). */
export function linesThrough(cells: readonly string[], p: number): [number, number, number][] {
  const r = Math.floor(p / N);
  const c = p % N;
  const out: [number, number, number][] = [];
  for (const [dr, dc] of DIRS) {
    if (cells[p] === 'O') {
      if (at(cells, r - dr, c - dc) === 'S' && at(cells, r + dr, c + dc) === 'S')
        out.push([(r - dr) * N + c - dc, p, (r + dr) * N + c + dc]);
    } else if (cells[p] === 'S') {
      for (const s of [1, -1]) {
        if (
          at(cells, r + s * dr, c + s * dc) === 'O' &&
          at(cells, r + 2 * s * dr, c + 2 * s * dc) === 'S'
        )
          out.push([p, (r + s * dr) * N + c + s * dc, (r + 2 * s * dr) * N + c + 2 * s * dc]);
      }
    }
  }
  return out;
}

/** Points scored by writing `letter` at empty cell `p` (the grid is left unchanged). */
export function scoreOf(cells: ('' | Letter)[], p: number, letter: Letter): number {
  cells[p] = letter;
  const n = linesThrough(cells, p).length;
  cells[p] = '';
  return n;
}

export function legalSosActions(s: SosState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.cells.forEach((v, p) => {
    if (!v) out.push(`S${p}`, `O${p}`);
  });
  return out;
}

export function applySosAction(s: SosState, a: string): SosState {
  if (s.result || !legalSosActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const letter = a[0] as Letter;
  const p = Number(a.slice(1));
  const cells = s.cells.slice();
  cells[p] = letter;
  const me = s.toMove;
  const made = linesThrough(cells, p);
  const scores: [number, number] = [...s.scores];
  scores[me] += made.length;
  const full = cells.every(Boolean);
  return {
    cells,
    first: s.first,
    toMove: made.length ? me : ((1 - me) as 0 | 1),
    movers: [...s.movers, me],
    history: [...s.history, a],
    scores,
    lines: [...s.lines, ...made.map((cellsOfLine) => ({ cells: cellsOfLine, seat: me }))],
    result: full
      ? { winner: scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1 }
      : null,
  };
}

export function replaySos(first: 0 | 1, history: readonly string[]): SosState {
  return history.reduce((s, a) => applySosAction(s, a), createSosState(first));
}

export function isValidSosState(data: unknown): data is SosState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replaySos(data.first, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
