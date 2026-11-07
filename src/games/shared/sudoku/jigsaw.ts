/**
 * Jigsaw (irregular) sudoku regions: the standard boxes reshaped by random swaps of boundary cells
 * between neighbouring regions, keeping every region connected and the same size.
 */
import type { Rng } from '../../../core/game-engine/random';
import { geometry, type Shape } from './grid';

const neighbours = (n: number, c: number) => {
  const r = Math.floor(c / n);
  const col = c % n;
  return [
    r > 0 ? c - n : -1,
    r < n - 1 ? c + n : -1,
    col > 0 ? c - 1 : -1,
    col < n - 1 ? c + 1 : -1,
  ].filter((x) => x >= 0);
};

/** Whether every region is one orthogonally connected piece. */
export function regionsConnected(n: number, regions: readonly number[]): boolean {
  for (let k = 0; k < n; k++) {
    const cells = regions.flatMap((x, c) => (x === k ? [c] : []));
    if (!cells.length) return false;
    const seen = new Set([cells[0]!]);
    for (const c of seen) for (const x of neighbours(n, c)) if (regions[x] === k) seen.add(x);
    if (seen.size !== cells.length) return false;
  }
  return true;
}

/** Random jigsaw regions for a shape (`swaps` successful swaps away from the standard boxes). */
export function jigsawRegions(shape: Shape, rng: Rng, swaps = 120): number[] {
  const n = shape.size;
  const regions = [...geometry({ ...shape, regions: undefined }).region];
  const connected = (k: number) => {
    const cells = regions.flatMap((x, c) => (x === k ? [c] : []));
    const seen = new Set([cells[0]!]);
    for (const c of seen) for (const x of neighbours(n, c)) if (regions[x] === k) seen.add(x);
    return seen.size === cells.length;
  };
  for (let done = 0, tries = 0; done < swaps && tries < swaps * 60; tries++) {
    const a = rng.int(n * n);
    const ra = regions[a]!;
    const across = neighbours(n, a).filter((x) => regions[x] !== ra);
    if (!across.length) continue;
    const rb = regions[across[rng.int(across.length)]!]!;
    // A cell of B touching A, to trade places with `a`.
    const options = regions
      .map((x, c) =>
        x === rb && c !== a && neighbours(n, c).some((y) => regions[y] === ra) ? c : -1,
      )
      .filter((c) => c >= 0);
    if (!options.length) continue;
    const b = options[rng.int(options.length)]!;
    regions[a] = rb;
    regions[b] = ra;
    if (connected(ra) && connected(rb)) done++;
    else {
      regions[a] = ra;
      regions[b] = rb;
    }
  }
  return regions;
}

/** Up to four colours so that touching regions differ (greedy, in region order). */
export function regionColours(n: number, regions: readonly number[]): number[] {
  const touch = Array.from({ length: n }, () => new Set<number>());
  regions.forEach((k, c) => {
    for (const x of neighbours(n, c)) if (regions[x] !== k) touch[k]!.add(regions[x]!);
  });
  const colour = Array<number>(n).fill(-1);
  for (let k = 0; k < n; k++) {
    const used = new Set([...touch[k]!].map((x) => colour[x]));
    let c = 0;
    while (used.has(c)) c++;
    colour[k] = c;
  }
  return colour;
}
