/**
 * Sim: six points on a hexagon and the 15 lines joining every pair. Players take turns coloring
 * one uncolored line in their color. A player who completes a triangle of their own color (three
 * of the six points joined by lines of that color) loses at once. Six points always force a
 * one-colored triangle (Ramsey's R(3, 3) = 6), so the game always ends and there are no draws.
 *
 * Actions: "0-3" (the line between points 0 and 3; points 0–5 are labelled A–F).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const POINTS = 6;
/** The 15 lines as point pairs, a < b. */
export const LINES: readonly [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let a = 0; a < POINTS; a++) for (let b = a + 1; b < POINTS; b++) out.push([a, b]);
  return out;
})();

export const lineIndex = (a: number, b: number) =>
  LINES.findIndex(([x, y]) => x === Math.min(a, b) && y === Math.max(a, b));

/** The 20 triangles as line bitmasks, with their points. */
export const TRIANGLES: readonly { mask: number; points: [number, number, number] }[] = (() => {
  const out: { mask: number; points: [number, number, number] }[] = [];
  for (let a = 0; a < POINTS; a++)
    for (let b = a + 1; b < POINTS; b++)
      for (let c = b + 1; c < POINTS; c++)
        out.push({
          mask: (1 << lineIndex(a, b)) | (1 << lineIndex(a, c)) | (1 << lineIndex(b, c)),
          points: [a, b, c],
        });
  return out;
})();

export interface SimState {
  /** 0 uncolored, otherwise seat + 1. */
  lines: number[];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1; triangle: [number, number, number] } | null;
}

export function createSimState(first: 0 | 1 = 0): SimState {
  return {
    lines: new Array<number>(LINES.length).fill(0),
    first,
    toMove: first,
    history: [],
    result: null,
  };
}

/** Bitmask of the lines colored by `seat`. */
export const maskOf = (lines: readonly number[], seat: 0 | 1) =>
  lines.reduce((m, v, i) => (v === seat + 1 ? m | (1 << i) : m), 0);

export const triangleIn = (mask: number) =>
  TRIANGLES.find((t) => (mask & t.mask) === t.mask) ?? null;

export const actionOf = (line: number) => `${LINES[line]![0]}-${LINES[line]![1]}`;

export function legalSimActions(s: SimState): string[] {
  if (s.result) return [];
  return s.lines.flatMap((v, i) => (v ? [] : [actionOf(i)]));
}

export function applySimAction(s: SimState, a: string): SimState {
  if (s.result || !legalSimActions(s).includes(a))
    throw new IllegalActionError(`Illegal line ${a}`);
  const [p, q] = a.split('-').map(Number) as [number, number];
  const lines = s.lines.slice();
  const me = s.toMove;
  lines[lineIndex(p, q)] = me + 1;
  const triangle = triangleIn(maskOf(lines, me));
  return {
    ...s,
    lines,
    toMove: (1 - me) as 0 | 1,
    history: [...s.history, a],
    result: triangle ? { winner: (1 - me) as 0 | 1, triangle: triangle.points } : null,
  };
}

export function replaySim(first: 0 | 1, history: readonly string[]): SimState {
  return history.reduce((s, a) => applySimAction(s, a), createSimState(first));
}

export function isValidSimState(data: unknown): data is SimState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replaySim(data.first, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
