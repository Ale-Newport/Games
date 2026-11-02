/**
 * Maze layouts for the maze-chase games, generated rather than drawn, so that every maze is
 * original: a 19 × 21 grid whose corridor junctions sit on a lattice of odd coordinates (walls fill
 * every even–even cell, so corridors are one tile wide). Starting from every lattice link open, links
 * are removed in mirror-image pairs, in an order fixed by the maze's seed, as long as every junction
 * keeps at least two links (no dead ends) and the maze stays connected. A walled house in the middle
 * (door on top) holds the chasers; a tunnel row leads off both sides and wraps around.
 */
import { nextUint32, seedRng } from '../../../core/game-engine/random';

export const COLS = 19;
export const ROWS = 21;
export type Tile = 'wall' | 'path' | 'house' | 'door' | 'tunnel';

export interface Maze {
  tiles: Tile[];
  /** Power-pellet tiles. */
  pellets: number[];
  playerStart: number;
  /** The tile above the door where chasers leave the house, and the house's middle. */
  exit: number;
  houseCentre: number;
  /** Corner targets for the chasers' scatter phase. */
  corners: number[];
  tunnelRow: number;
}

export const idx = (x: number, y: number) => y * COLS + x;
const HOUSE = { x0: 6, x1: 12, y0: 8, y1: 12 };
const inHouseRing = (x: number, y: number) =>
  x >= HOUSE.x0 && x <= HOUSE.x1 && y >= HOUSE.y0 && y <= HOUSE.y1;

export function generateMaze(seed: number, tunnelRow = 11, removeShare = 0.42): Maze {
  const nodes: [number, number][] = [];
  for (let y = 1; y < ROWS; y += 2)
    for (let x = 1; x < COLS; x += 2) if (!inHouseRing(x, y)) nodes.push([x, y]);
  const key = (x: number, y: number) => `${x},${y}`;
  const nodeSet = new Set(nodes.map(([x, y]) => key(x, y)));
  // Links between neighbouring junctions (as the midpoint tile), mirrored pairs grouped.
  const links = new Set<string>();
  for (const [x, y] of nodes)
    for (const [dx, dy] of [
      [2, 0],
      [0, 2],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nodeSet.has(key(nx, ny)) && !inHouseRing(x + dx / 2, y + dy / 2))
        links.add(key(x + dx / 2, y + dy / 2));
    }
  const mirror = (k: string) => {
    const [x, y] = k.split(',').map(Number) as [number, number];
    return key(COLS - 1 - x, y);
  };
  const ends = (k: string): [string, string] => {
    const [x, y] = k.split(',').map(Number) as [number, number];
    return x % 2 === 0 ? [key(x - 1, y), key(x + 1, y)] : [key(x, y - 1), key(x, y + 1)];
  };
  const open = new Set(links);
  const degree = (n: string) => {
    const [x, y] = n.split(',').map(Number) as [number, number];
    let d = 0;
    for (const m of [key(x + 1, y), key(x - 1, y), key(x, y + 1), key(x, y - 1)])
      if (open.has(m)) d++;
    // The tunnel counts as a link (the house door does not: the player cannot use it).
    if (y === tunnelRow && (x === 1 || x === COLS - 2)) d++;
    return d;
  };
  const connected = () => {
    const start = key(nodes[0]![0], nodes[0]![1]);
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const n = stack.pop()!;
      const [x, y] = n.split(',').map(Number) as [number, number];
      for (const [lx, ly, mx, my] of [
        [x + 1, y, x + 2, y],
        [x - 1, y, x - 2, y],
        [x, y + 1, x, y + 2],
        [x, y - 1, x, y - 2],
      ] as const)
        if (open.has(key(lx, ly)) && !seen.has(key(mx, my))) {
          seen.add(key(mx, my));
          stack.push(key(mx, my));
        }
    }
    return seen.size === nodes.length;
  };
  // Candidate pairs in a seeded order.
  const pairs = [...new Set([...links].map((k) => [k, mirror(k)].sort().join('|')))].map((p) =>
    p.split('|'),
  );
  let rng = seedRng(seed >>> 0);
  for (let i = pairs.length - 1; i > 0; i--) {
    const [x, n] = nextUint32(rng);
    rng = n;
    const j = x % (i + 1);
    [pairs[i], pairs[j]] = [pairs[j]!, pairs[i]!];
  }
  const target = Math.round(links.size * removeShare);
  let removed = 0;
  for (const pair of pairs) {
    if (removed >= target) break;
    const ks = [...new Set(pair)];
    for (const k of ks) open.delete(k);
    const touched = ks.flatMap(ends);
    if (touched.every((n) => degree(n) >= 2) && connected()) removed += ks.length;
    else for (const k of ks) open.add(k);
  }
  const tiles: Tile[] = new Array<Tile>(COLS * ROWS).fill('wall');
  for (const [x, y] of nodes) tiles[idx(x, y)] = 'path';
  for (const k of open) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    tiles[idx(x, y)] = 'path';
  }
  // The house: interior, door, and the tunnel.
  for (let y = HOUSE.y0 + 1; y < HOUSE.y1; y++)
    for (let x = HOUSE.x0 + 1; x < HOUSE.x1; x++) tiles[idx(x, y)] = 'house';
  tiles[idx(9, HOUSE.y0)] = 'door';
  tiles[idx(0, tunnelRow)] = 'tunnel';
  tiles[idx(COLS - 1, tunnelRow)] = 'tunnel';
  return {
    tiles,
    pellets: [idx(1, 3), idx(COLS - 2, 3), idx(1, ROWS - 4), idx(COLS - 2, ROWS - 4)],
    playerStart: idx(9, 15),
    exit: idx(9, HOUSE.y0 - 1),
    houseCentre: idx(9, 10),
    corners: [idx(COLS - 2, 1), idx(1, 1), idx(COLS - 2, ROWS - 2), idx(1, ROWS - 2)],
    tunnelRow,
  };
}
