/**
 * Chomp: a rectangular chocolate bar whose top-left square is poisoned. Players take turns
 * choosing a remaining square and eating it together with every square below and to the right of
 * it. Whoever has to eat the poisoned square loses — so the game ends as soon as a move leaves only
 * the poison, and that move wins. The poisoned square itself is never a legal choice.
 *
 * The bar is stored as row lengths (rows from the top, non-increasing). Actions: "r,c" (eat from
 * row r, column c). The bar size is drawn per round.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const MAX_ROWS = 6;
export const MAX_COLS = 8;
/** Bar sizes a round can start with (rows × columns). */
export const SIZES: readonly [number, number][] = [
  [4, 5],
  [4, 7],
  [5, 6],
  [5, 8],
  [6, 7],
];

export interface ChompState {
  size: [number, number];
  rows: number[];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

export function createChompState(size: readonly [number, number], first: 0 | 1 = 0): ChompState {
  const [r, c] = size;
  return {
    size: [r, c],
    rows: new Array<number>(r).fill(c),
    first,
    toMove: first,
    history: [],
    result: null,
  };
}

export const sizeFor = (seed: number) => new Rng(seed).pick(SIZES);

/** Rows after eating at (r, c). */
export function bite(rows: readonly number[], r: number, c: number): number[] {
  return rows.map((len, i) => (i >= r ? Math.min(len, c) : len));
}

export const onlyPoison = (rows: readonly number[]) =>
  rows[0] === 1 && rows.slice(1).every((n) => n === 0);

export function legalChompActions(s: ChompState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.rows.forEach((len, r) => {
    for (let c = 0; c < len; c++) if (r || c) out.push(`${r},${c}`);
  });
  return out;
}

export function applyChompAction(s: ChompState, a: string): ChompState {
  if (s.result || !legalChompActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const [r, c] = a.split(',').map(Number) as [number, number];
  const rows = bite(s.rows, r, c);
  const me = s.toMove;
  return {
    ...s,
    rows,
    toMove: (1 - me) as 0 | 1,
    history: [...s.history, a],
    // Leaving only the poison forces the opponent to eat it.
    result: onlyPoison(rows) ? { winner: me } : null,
  };
}

export function replayChomp(
  size: readonly [number, number],
  first: 0 | 1,
  history: readonly string[],
): ChompState {
  return history.reduce((s, a) => applyChompAction(s, a), createChompState(size, first));
}

export function isValidChompState(data: unknown): data is ChompState {
  if (!isRecord(data) || !Array.isArray(data.history) || !Array.isArray(data.size)) return false;
  const [r, c] = data.size as unknown[];
  if (!SIZES.some(([sr, sc]) => sr === r && sc === c)) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    const replayed = replayChomp([r as number, c as number], data.first, data.history as string[]);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}
