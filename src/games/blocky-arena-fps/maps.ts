/**
 * The arenas: height maps of 32 × 32 cells, each cell 2 units wide; a cell's level is its height
 * in half units (level 1 = 0.5 units, a step you can walk up; walls are level 8+). Original layouts,
 * built from rectangles and staircases.
 */
export const CELL = 2;
export const SIZE = 32;
export const STEP = 0.55;

export interface ArenaMap {
  id: string;
  /** Row-major levels, SIZE × SIZE. */
  levels: number[];
  /** Spawn cells [x, z]. */
  spawns: [number, number][];
  /** Colour theme. */
  palette: {
    floor: string;
    low: string;
    mid: string;
    high: string;
    wall: string;
    sky: string;
    fog: string;
  };
}

function blank(): number[] {
  const g = new Array<number>(SIZE * SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    g[i] = 10;
    g[(SIZE - 1) * SIZE + i] = 10;
    g[i * SIZE] = 10;
    g[i * SIZE + SIZE - 1] = 10;
  }
  return g;
}

function rect(g: number[], x0: number, z0: number, x1: number, z1: number, level: number) {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) g[z * SIZE + x] = level;
}

/** A staircase: `count` cells from (x, z) in direction (dx, dz), `width` wide, rising from `from`. */
function stairs(
  g: number[],
  x: number,
  z: number,
  dx: number,
  dz: number,
  count: number,
  from: number,
  width: number,
) {
  for (let i = 0; i < count; i++)
    for (let w = 0; w < width; w++) {
      const cx = x + dx * i + (dx === 0 ? w : 0);
      const cz = z + dz * i + (dz === 0 ? w : 0);
      g[cz * SIZE + cx] = from + i;
    }
}

function courtyard(): ArenaMap {
  const g = blank();
  // The central keep, three units high, with stairs from west and east.
  rect(g, 13, 13, 18, 18, 6);
  stairs(g, 8, 15, 1, 0, 5, 1, 2);
  stairs(g, 23, 15, -1, 0, 5, 1, 2);
  // Corner bastions, two units high, with stairs.
  for (const [x0, z0, sx, sz] of [
    [2, 2, 1, 1],
    [24, 2, -1, 1],
    [2, 24, 1, -1],
    [24, 24, -1, -1],
  ] as const) {
    rect(g, x0, z0, x0 + 5, z0 + 5, 4);
    const sx0 = sx > 0 ? x0 + 6 : x0 - 1;
    stairs(g, sx0 + (sx > 0 ? 2 : -2), z0 + (sz > 0 ? 1 : 3), -sx, 0, 3, 1, 2);
  }
  // Cover.
  for (const [x, z] of [
    [10, 6],
    [20, 6],
    [10, 24],
    [20, 24],
  ] as const)
    rect(g, x, z, x + 1, z + 1, 4);
  rect(g, 4, 14, 5, 17, 3);
  rect(g, 26, 14, 27, 17, 3);
  rect(g, 14, 4, 17, 5, 3);
  rect(g, 14, 26, 17, 27, 3);
  rect(g, 8, 10, 8, 11, 2);
  rect(g, 23, 20, 23, 21, 2);
  rect(g, 11, 20, 12, 20, 2);
  rect(g, 19, 11, 20, 11, 2);
  return {
    id: 'courtyard',
    levels: g,
    spawns: [
      [3, 11],
      [28, 11],
      [3, 20],
      [28, 20],
      [11, 3],
      [20, 3],
      [11, 28],
      [20, 28],
      [9, 15],
      [22, 16],
    ],
    palette: {
      floor: '#7a8c5a',
      low: '#c9a66b',
      mid: '#b8865a',
      high: '#9a6b4a',
      wall: '#6d5a4e',
      sky: '#8ec5ff',
      fog: '#cfe6ff',
    },
  };
}

function docks(): ArenaMap {
  const g = blank();
  // A raised walkway along the north side with three staircases down.
  rect(g, 1, 1, 30, 3, 4);
  for (const x of [3, 15, 27]) stairs(g, x, 6, 0, -1, 3, 1, 2);
  // Shipping containers in lanes.
  for (const x of [4, 13, 22]) {
    rect(g, x, 10, x + 5, 11, 5);
    rect(g, x, 23, x + 5, 24, 5);
  }
  // A two-level stack in the middle with a stair onto it.
  rect(g, 14, 15, 17, 18, 5);
  rect(g, 15, 16, 16, 17, 7);
  stairs(g, 10, 16, 1, 0, 4, 1, 2);
  stairs(g, 21, 16, -1, 0, 4, 1, 2);
  // Crates you can jump on.
  for (const [x, z] of [
    [7, 14],
    [24, 14],
    [7, 19],
    [24, 19],
    [11, 27],
    [20, 27],
    [11, 6],
    [20, 6],
  ] as const)
    rect(g, x, z, x, z, 2);
  rect(g, 2, 15, 3, 18, 3);
  rect(g, 28, 15, 29, 18, 3);
  return {
    id: 'docks',
    levels: g,
    spawns: [
      [2, 6],
      [29, 6],
      [2, 28],
      [29, 28],
      [10, 20],
      [21, 13],
      [15, 29],
      [16, 2],
      [5, 13],
      [26, 21],
    ],
    palette: {
      floor: '#5d6b78',
      low: '#c45b4a',
      mid: '#3e7cb1',
      high: '#e0a33a',
      wall: '#3b4450',
      sky: '#f2b880',
      fog: '#f6d2b0',
    },
  };
}

export const MAPS: Record<string, ArenaMap> = { courtyard: courtyard(), docks: docks() };
export const MAP_IDS = Object.keys(MAPS);

export function levelAt(m: ArenaMap, cx: number, cz: number): number {
  if (cx < 0 || cz < 0 || cx >= SIZE || cz >= SIZE) return 99;
  return m.levels[cz * SIZE + cx]!;
}

/** The ground height (units) of the cell containing world point (x, z). */
export function heightAt(m: ArenaMap, x: number, z: number): number {
  return levelAt(m, Math.floor(x / CELL), Math.floor(z / CELL)) * 0.5;
}
