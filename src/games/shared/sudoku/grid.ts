/**
 * Sudoku geometry shared by the sudoku family (#101–#107): an N×N grid whose rows, columns and
 * regions (rectangular boxes, or any partition for jigsaw sudoku) — plus the two diagonals for
 * X-Sudoku — must each hold the digits 1..N once. Grids are flat arrays, 0 for an empty cell.
 */
export interface Shape {
  size: number;
  /** Box height and width for the standard regions (ignored when `regions` is given). */
  boxRows: number;
  boxCols: number;
  /** Region index of every cell, for irregular (jigsaw) regions. */
  regions?: readonly number[];
  /** The two main diagonals are units too (X-Sudoku). */
  diagonals?: boolean;
}

export type UnitKind = 'row' | 'col' | 'box' | 'diag';

export interface Geometry {
  shape: Shape;
  size: number;
  cells: number;
  /** Bit mask of all digits 1..size (bit d-1 for digit d). */
  all: number;
  units: number[][];
  unitKinds: UnitKind[];
  /** Units containing each cell. */
  unitsOf: number[][];
  /** Every other cell sharing a unit with each cell. */
  peers: number[][];
  /** Region (box) index of each cell. */
  region: number[];
}

const cache = new Map<string, Geometry>();

export function geometry(shape: Shape): Geometry {
  const key = JSON.stringify(shape);
  const hit = cache.get(key);
  if (hit) return hit;
  const n = shape.size;
  const cells = n * n;
  const region = Array.from({ length: cells }, (_, c) => {
    if (shape.regions) return shape.regions[c]!;
    const r = Math.floor(c / n);
    const col = c % n;
    return Math.floor(r / shape.boxRows) * (n / shape.boxCols) + Math.floor(col / shape.boxCols);
  });
  const units: number[][] = [];
  const unitKinds: UnitKind[] = [];
  for (let r = 0; r < n; r++) {
    units.push(Array.from({ length: n }, (_, c) => r * n + c));
    unitKinds.push('row');
  }
  for (let c = 0; c < n; c++) {
    units.push(Array.from({ length: n }, (_, r) => r * n + c));
    unitKinds.push('col');
  }
  for (let b = 0; b < n; b++) {
    units.push(region.flatMap((x, c) => (x === b ? [c] : [])));
    unitKinds.push('box');
  }
  if (shape.diagonals) {
    units.push(Array.from({ length: n }, (_, i) => i * n + i));
    units.push(Array.from({ length: n }, (_, i) => i * n + (n - 1 - i)));
    unitKinds.push('diag', 'diag');
  }
  const unitsOf = Array.from({ length: cells }, () => [] as number[]);
  units.forEach((u, i) => u.forEach((c) => unitsOf[c]!.push(i)));
  const peers = unitsOf.map((us, c) => [
    ...new Set(us.flatMap((u) => units[u]!).filter((x) => x !== c)),
  ]);
  const geo: Geometry = {
    shape,
    size: n,
    cells,
    all: (1 << n) - 1,
    units,
    unitKinds,
    unitsOf,
    peers,
    region,
  };
  cache.set(key, geo);
  return geo;
}

export const bit = (d: number) => 1 << (d - 1);

export function popcount(m: number): number {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
}

/** Digits in a mask, ascending. */
export function digitsOf(m: number): number[] {
  const out: number[] = [];
  for (let d = 1; m; d++, m >>= 1) if (m & 1) out.push(d);
  return out;
}

/** The candidates of every empty cell given the placed digits (0 for filled cells). */
export function candidates(geo: Geometry, grid: readonly number[]): number[] {
  return grid.map((v, c) => {
    if (v) return 0;
    let m = geo.all;
    for (const p of geo.peers[c]!) if (grid[p]) m &= ~bit(grid[p]!);
    return m;
  });
}

/** Cells whose digit repeats in one of their units. */
export function conflicts(geo: Geometry, grid: readonly number[]): Set<number> {
  const out = new Set<number>();
  grid.forEach((v, c) => {
    if (v && geo.peers[c]!.some((p) => grid[p] === v)) out.add(c);
  });
  return out;
}

export const isComplete = (geo: Geometry, grid: readonly number[]) =>
  grid.every((v) => v > 0) && conflicts(geo, grid).size === 0;

/** Row/column label like "R3C5" (1-based). */
export const cellName = (geo: Geometry, c: number) =>
  `R${Math.floor(c / geo.size) + 1}C${(c % geo.size) + 1}`;
