/**
 * Exact sudoku solver: constraint propagation (naked and hidden singles) with a
 * fewest-candidates search. Counts solutions up to a limit (2 is enough to prove uniqueness) and
 * fills grids at random for the generator.
 */
import type { Rng } from '../../../core/game-engine/random';
import { bit, candidates, popcount, type Geometry } from './grid';

/** An extra check for variants with constraints beyond the units (killer cages). */
export type ExtraCheck = (values: Int8Array, cell: number) => boolean;

interface Search {
  values: Int8Array;
  masks: Int32Array;
}

function assign(geo: Geometry, s: Search, cell: number, d: number, extra?: ExtraCheck): boolean {
  s.values[cell] = d;
  s.masks[cell] = 0;
  const b = bit(d);
  for (const p of geo.peers[cell]!) {
    if (s.values[p]) {
      if (s.values[p] === d) return false;
      continue;
    }
    if (s.masks[p]! & b) {
      s.masks[p]! &= ~b;
      if (!s.masks[p]) return false;
    }
  }
  return !extra || extra(s.values, cell);
}

/** Naked and hidden singles until nothing changes; false on a contradiction. */
function propagate(geo: Geometry, s: Search, extra?: ExtraCheck): boolean {
  for (let changed = true; changed;) {
    changed = false;
    for (let c = 0; c < geo.cells; c++) {
      if (s.values[c]) continue;
      const m = s.masks[c]!;
      if (!m) return false;
      if ((m & (m - 1)) === 0) {
        if (!assign(geo, s, c, 31 - Math.clz32(m) + 1, extra)) return false;
        changed = true;
      }
    }
    for (const unit of geo.units) {
      let placed = 0;
      for (const c of unit) if (s.values[c]) placed |= bit(s.values[c]!);
      for (let d = 1; d <= geo.size; d++) {
        const b = bit(d);
        if (placed & b) continue;
        let only = -1;
        let count = 0;
        for (const c of unit)
          if (!s.values[c] && s.masks[c]! & b) {
            only = c;
            if (++count > 1) break;
          }
        if (count === 0) return false;
        if (count === 1) {
          if (!assign(geo, s, only, d, extra)) return false;
          placed |= b;
          changed = true;
        }
      }
    }
  }
  return true;
}

export interface SolveResult {
  /** Solutions found (stops at the limit). */
  count: number;
  /** The first solution found. */
  solution: number[] | null;
  /** Search nodes, as a rough measure of difficulty for a computer. */
  nodes: number;
}

export function solveSudoku(
  geo: Geometry,
  grid: readonly number[],
  options: { limit?: number; rng?: Rng; extra?: ExtraCheck } = {},
): SolveResult {
  const limit = options.limit ?? 2;
  const result: SolveResult = { count: 0, solution: null, nodes: 0 };
  const start: Search = {
    values: Int8Array.from(grid.map(() => 0)),
    masks: Int32Array.from(
      candidates(
        geo,
        grid.map(() => 0),
      ),
    ),
  };
  for (let c = 0; c < geo.cells; c++)
    if (grid[c] && !assign(geo, start, c, grid[c]!, options.extra)) return result;
  const search = (s: Search) => {
    result.nodes++;
    if (!propagate(geo, s, options.extra)) return;
    let best = -1;
    let bestCount = 99;
    for (let c = 0; c < geo.cells; c++) {
      if (s.values[c]) continue;
      const k = popcount(s.masks[c]!);
      if (k < bestCount) {
        bestCount = k;
        best = c;
        if (k === 2) break;
      }
    }
    if (best < 0) {
      result.count++;
      result.solution ??= Array.from(s.values);
      return;
    }
    const digits: number[] = [];
    for (let d = 1; d <= geo.size; d++) if (s.masks[best]! & bit(d)) digits.push(d);
    for (const d of options.rng ? options.rng.shuffle(digits) : digits) {
      const next: Search = { values: Int8Array.from(s.values), masks: Int32Array.from(s.masks) };
      if (assign(geo, next, best, d, options.extra)) search(next);
      if (result.count >= limit) return;
    }
  };
  search(start);
  return result;
}

export const hasUniqueSolution = (geo: Geometry, grid: readonly number[], extra?: ExtraCheck) =>
  solveSudoku(geo, grid, { limit: 2, extra }).count === 1;

/** A random complete grid. */
export function randomSolution(geo: Geometry, rng: Rng): number[] {
  const r = solveSudoku(geo, Array<number>(geo.cells).fill(0), { limit: 1, rng });
  if (!r.solution) throw new Error('No solution for this shape');
  return r.solution;
}
