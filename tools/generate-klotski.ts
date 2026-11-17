// Offline generator for the sliding-block puzzle bank (src/games/klotski/puzzles.ts): random
// layouts on the 4×5 tray, the whole reachable position space explored (identical pieces are
// interchangeable, so positions are keyed by the shape grid), and distances from the solved
// positions by breadth-first search. Each connected position space gives up to <per> puzzles per
// level: positions whose distance is in the level's range (for hard, within 12 of the farthest),
// spread over the distances and preferring the big block in the top row. A move is one piece moved
// any distance along any path through free cells. Prints JSON with position keys and fewest-move
// counts per level. Positions already in the bank (src/games/klotski/puzzles.ts), and mirror images
// of bank entries or of earlier picks, are skipped, so a run only proposes new puzzles to append.
// Usage: npx tsx tools/generate-klotski.ts <spaces> <per> <seed> <verticals> <horizontals> <singles>
import { Rng } from '../src/core/game-engine/random';
import {
  W,
  H,
  blocksOf,
  cellsOf,
  isSolvedKey,
  movesFrom,
  parse,
  keyOf,
} from '../src/games/klotski/board';
import { PUZZLES } from '../src/games/klotski/puzzles';

/** The position seen in a mirror (left and right swapped). */
export function mirror(key: string): string {
  const out = new Array<string>(W * H).fill('.');
  for (const b of blocksOf(parse(key))) {
    const x = W - (b.at % W) - b.w;
    const at = Math.floor(b.at / W) * W + x;
    cellsOf(b, at).forEach(
      (c, i) => (out[c] = b.kind === 'S' ? 'S' : i === 0 ? b.kind : b.kind.toLowerCase()),
    );
  }
  return out.join('');
}

function layout(rng: Rng, v: number, h: number, s: number): string | null {
  const grid = new Array<string>(W * H).fill('.');
  const place = (w: number, hh: number, tl: string, rest: string): boolean => {
    for (let t = 0; t < 200; t++) {
      const x = rng.int(W - w + 1);
      const y = rng.int(H - hh + 1);
      const cells: number[] = [];
      for (let dy = 0; dy < hh; dy++)
        for (let dx = 0; dx < w; dx++) cells.push((y + dy) * W + x + dx);
      if (cells.some((c) => grid[c] !== '.')) continue;
      cells.forEach((c, i) => (grid[c] = i === 0 ? tl : rest));
      return true;
    }
    return false;
  };
  if (!place(2, 2, 'A', 'a')) return null;
  for (let i = 0; i < v; i++) if (!place(1, 2, 'V', 'v')) return null;
  for (let i = 0; i < h; i++) if (!place(2, 1, 'H', 'h')) return null;
  for (let i = 0; i < s; i++) if (!place(1, 1, 'S', 'S')) return null;
  return grid.join('');
}

/** All positions reachable from `start`, with each one's distance to the nearest solved position. */
export function explore(start: string, cap = 400_000) {
  const index = new Map<string, number>([[start, 0]]);
  const keys = [start];
  const edges: number[][] = [];
  for (let i = 0; i < keys.length; i++) {
    if (keys.length > cap) return null;
    const list: number[] = [];
    for (const next of movesFrom(parse(keys[i]!))) {
      const k = keyOf(next.board);
      let j = index.get(k);
      if (j === undefined) {
        j = keys.length;
        index.set(k, j);
        keys.push(k);
      }
      list.push(j);
    }
    edges.push(list);
  }
  const dist = new Int32Array(keys.length).fill(-1);
  const queue: number[] = [];
  keys.forEach((k, i) => {
    if (isSolvedKey(k)) {
      dist[i] = 0;
      queue.push(i);
    }
  });
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    for (const j of edges[i]!) {
      if (dist[j]! < 0) {
        dist[j] = dist[i]! + 1;
        queue.push(j);
      }
    }
  }
  return { keys, dist };
}

const RANGES: Record<string, [number, number]> = {
  easy: [10, 25],
  medium: [26, 50],
  hard: [51, 999],
};
const [spaces, per, seed, v, h, s] = process.argv.slice(2).map(Number) as number[];
const rng = new Rng(seed!);
const out: Record<string, string[]> = { easy: [], medium: [], hard: [] };
const seen = new Set<string>();
const taken = new Set<string>();
for (const list of Object.values(PUZZLES))
  for (const entry of list) {
    const k = entry.split(':')[0]!;
    taken.add(k).add(mirror(k));
  }
const t0 = Date.now();
for (let made = 0, tries = 0; made < spaces! && tries < 3000; tries++) {
  const start = layout(rng, v!, h!, s!);
  if (!start || seen.has(start)) continue;
  const ex = explore(start);
  if (!ex) continue;
  made++;
  ex.keys.forEach((k) => seen.add(k));
  const far = ex.dist.reduce((m, d) => Math.max(m, d), 0);
  for (const [level, [lo, hi]] of Object.entries(RANGES)) {
    const min = level === 'hard' ? Math.max(lo, far - 12) : lo;
    const byDist = new Map<number, number[]>();
    ex.dist.forEach((d, i) => {
      if (d < min || d > hi || taken.has(ex.keys[i]!)) return;
      if (!byDist.has(d)) byDist.set(d, []);
      byDist.get(d)!.push(i);
    });
    // Longest distances first for hard; a spread of distances otherwise.
    const dists = [...byDist.keys()].sort((a, b) => (level === 'hard' ? b - a : rng.float() - 0.5));
    for (const d of dists.slice(0, per)) {
      const pool = byDist.get(d)!;
      const top = pool.filter((i) => ex.keys[i]!.slice(0, 4).includes('A'));
      const from = top.length ? top : pool;
      const pick = from[rng.int(from.length)]!;
      taken.add(ex.keys[pick]!).add(mirror(ex.keys[pick]!));
      out[level]!.push(`${ex.keys[pick]}:${d}`);
    }
  }
}
console.log(JSON.stringify({ ms: Date.now() - t0, ...out }));
