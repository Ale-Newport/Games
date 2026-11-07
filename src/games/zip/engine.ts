/**
 * Number Trail rules, solver and generator. Draw one path through every cell of the grid, moving
 * between side-adjacent cells not separated by a wall, starting on 1, passing the numbers in order
 * and ending on the last one. Puzzles come from a seed: a random path through every cell, then
 * numbers and walls added along it until the path is the only solution.
 */
import { Rng } from '../../core/game-engine/random';

export interface TrailPuzzle {
  size: number;
  /** Number shown on each cell (1..k), or 0. */
  numbers: number[];
  /** Walls as "a-b" keys with a < b (side-adjacent cells). */
  walls: string[];
  /** The solution path (cell indices, from 1 to the last number). */
  solution: number[];
}

export const wallKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function neighbours(n: number, c: number): number[] {
  const r = Math.floor(c / n);
  const k = c % n;
  const out: number[] = [];
  if (r > 0) out.push(c - n);
  if (r < n - 1) out.push(c + n);
  if (k > 0) out.push(c - 1);
  if (k < n - 1) out.push(c + 1);
  return out;
}

/** Side-adjacent cells reachable from `c` (no wall between). */
export function exits(p: Pick<TrailPuzzle, 'size' | 'walls'>, c: number, walls = new Set(p.walls)) {
  return neighbours(p.size, c).filter((x) => !walls.has(wallKey(c, x)));
}

export const lastNumber = (p: Pick<TrailPuzzle, 'numbers'>) => Math.max(...p.numbers);

/**
 * Counts paths up to `limit`: from the cell numbered 1, through every cell once, numbers in order,
 * ending on the last number. Prunes with reachability of the unvisited cells and dead ends.
 */
export function countPaths(
  p: Pick<TrailPuzzle, 'size' | 'numbers' | 'walls'>,
  limit = 2,
  budget = 2_000_000,
): { count: number; first: number[] | null; paths: number[][]; exhausted: boolean } {
  const n = p.size;
  const total = n * n;
  const walls = new Set(p.walls);
  const adj = Array.from({ length: total }, (_, c) => exits(p, c, walls));
  const last = lastNumber(p);
  const start = p.numbers.indexOf(1);
  const end = p.numbers.indexOf(last);
  const visited = new Uint8Array(total);
  const path: number[] = [start];
  visited[start] = 1;
  let count = 0;
  let first: number[] | null = null;
  const paths: number[][] = [];
  let nodes = 0;
  const stamp = new Int32Array(total);
  let stampId = 0;
  const reachableAll = (from: number, left: number) => {
    // Every unvisited cell must be reachable from the current end through unvisited cells.
    stampId++;
    const stack = [from];
    stamp[from] = stampId;
    let seen = 0;
    while (stack.length) {
      const c = stack.pop()!;
      for (const x of adj[c]!)
        if (!visited[x] && stamp[x] !== stampId) {
          stamp[x] = stampId;
          seen++;
          stack.push(x);
        }
    }
    return seen === left;
  };
  // Checkerboard parity: the cells still to visit alternate colors after the current cell.
  const color = (c: number) => (Math.floor(c / n) + (c % n)) % 2;
  const unvisited = [0, 0];
  for (let c = 0; c < total; c++) if (c !== start) unvisited[color(c)]!++;
  const freeExits = (c: number, cur: number) => {
    let free = 0;
    for (const x of adj[c]!) if (!visited[x] || x === cur) free++;
    return free;
  };
  const walk = (cur: number, next: number, left: number) => {
    if (count >= limit || nodes > budget) return;
    nodes++;
    if (left === 0) {
      if (cur === end) {
        count++;
        first ??= [...path];
        paths.push([...path]);
      }
      return;
    }
    const opp = 1 - color(cur);
    if (unvisited[opp] !== Math.ceil(left / 2) || unvisited[1 - opp] !== Math.floor(left / 2))
      return;
    if (!reachableAll(cur, left)) return;
    // Every unvisited cell needs two path neighbours (the end needs one) among its unvisited
    // neighbours and the current cell; a cell left with exactly two, one being the current cell,
    // must be entered now.
    let forced = -1;
    for (let c = 0; c < total; c++) {
      if (visited[c]) continue;
      const free = freeExits(c, cur);
      if (c === end) {
        if (free < 1) return;
        continue;
      }
      if (free < 2) return;
      if (free === 2 && adj[cur]!.includes(c)) {
        if (forced >= 0) return;
        forced = c;
      }
    }
    for (const x of forced >= 0 ? [forced] : adj[cur]!) {
      if (visited[x]) continue;
      const num = p.numbers[x]!;
      if (num && num !== next) continue;
      if (x === end && left > 1) continue;
      visited[x] = 1;
      unvisited[color(x)]!--;
      path.push(x);
      walk(x, num ? next + 1 : next, left - 1);
      path.pop();
      unvisited[color(x)]!++;
      visited[x] = 0;
    }
  };
  walk(start, 2, total - 1);
  return { count, first, paths, exhausted: nodes > budget };
}

/** A random path through every cell (randomized depth-first search with Warnsdorff ordering). */
export function randomTrail(n: number, rng: Rng): number[] {
  const total = n * n;
  for (;;) {
    const start = rng.int(total);
    const visited = new Uint8Array(total);
    const path = [start];
    visited[start] = 1;
    let steps = 0;
    const walk = (cur: number): boolean => {
      if (path.length === total) return true;
      if (++steps > 20000) return false;
      const options = neighbours(n, cur).filter((x) => !visited[x]);
      const degree = (x: number) => neighbours(n, x).filter((y) => !visited[y]).length;
      options.sort((a, b) => degree(a) - degree(b) + (rng.float() - 0.5) * 1.5);
      for (const x of options) {
        visited[x] = 1;
        path.push(x);
        if (walk(x)) return true;
        path.pop();
        visited[x] = 0;
      }
      return false;
    };
    if (walk(start)) return path;
  }
}

export interface Spec {
  size: number;
  /** Numbers placed along the path before uniqueness repair. */
  clues: number;
  /** Chance that a repair adds a wall rather than a number. */
  wallChance: number;
}

export const SPECS: Record<string, Spec> = {
  easy: { size: 5, clues: 5, wallChance: 0.2 },
  medium: { size: 6, clues: 6, wallChance: 0.3 },
  hard: { size: 7, clues: 7, wallChance: 0.35 },
  expert: { size: 8, clues: 8, wallChance: 0.4 },
};

function numbersFor(n: number, path: number[], at: number[]): number[] {
  const numbers = new Array<number>(n * n).fill(0);
  [...new Set(at)].sort((a, b) => a - b).forEach((i, k) => (numbers[path[i]!] = k + 1));
  return numbers;
}

export function generate(level: string, seed: number): TrailPuzzle {
  const spec = SPECS[level] ?? SPECS.easy!;
  const n = spec.size;
  const rng = new Rng(seed >>> 0);
  for (let attempt = 0; attempt < 200; attempt++) {
    const path = randomTrail(n, rng);
    const last = path.length - 1;
    const at = new Set([0, last]);
    while (at.size < spec.clues) at.add(1 + rng.int(last - 1));
    const walls = new Set<string>();
    const used = new Set(path.slice(1).map((c, i) => wallKey(path[i]!, c)));
    let ok = false;
    for (let fix = 0; fix < 60; fix++) {
      const numbers = numbersFor(n, path, [...at]);
      const res = countPaths({ size: n, numbers, walls: [...walls] }, 2, 150_000);
      if (res.exhausted) {
        // Too open to settle quickly: a number in the middle of the longest unnumbered stretch.
        const sorted = [...at].sort((a, b) => a - b);
        let gap = 0;
        for (let j = 1; j < sorted.length; j++)
          if (sorted[j]! - sorted[j - 1]! > sorted[gap + 1]! - sorted[gap]!) gap = j - 1;
        at.add(Math.floor((sorted[gap]! + sorted[gap + 1]!) / 2));
        continue;
      }
      if (res.count === 1) {
        ok = true;
        break;
      }
      // Another path exists: find where it leaves ours and block it there.
      const other = res.paths.find((x) => x.join() !== path.join())!;
      let i = 0;
      while (other[i] === path[i]) i++;
      const edge = wallKey(other[i - 1]!, other[i]!);
      if (rng.float() < spec.wallChance && !used.has(edge)) walls.add(edge);
      else at.add(i);
    }
    if (ok)
      return {
        size: n,
        numbers: numbersFor(n, path, [...at]),
        walls: [...walls].sort(),
        solution: path,
      };
  }
  throw new Error(`No trail puzzle for ${level}`);
}

export interface TrailState {
  level: string;
  seed: number;
  puzzle: TrailPuzzle;
  /** The trail drawn so far, always starting on 1. */
  path: number[];
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newTrail(level: string, seed: number): TrailState {
  const lv = SPECS[level] ? level : 'easy';
  const puzzle = generate(lv, seed);
  return {
    level: lv,
    seed: seed >>> 0,
    puzzle,
    path: [puzzle.numbers.indexOf(1)],
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** The number the trail must reach next. */
export function nextNumber(s: Pick<TrailState, 'puzzle' | 'path'>): number {
  let best = 0;
  for (const c of s.path) best = Math.max(best, s.puzzle.numbers[c]!);
  return best + 1;
}

/** Whether the trail can step onto `cell` now. */
export function canExtend(s: Pick<TrailState, 'puzzle' | 'path'>, cell: number): boolean {
  const p = s.puzzle;
  const end = s.path[s.path.length - 1]!;
  if (s.path.includes(cell)) return false;
  if (!neighbours(p.size, end).includes(cell) || p.walls.includes(wallKey(end, cell))) return false;
  const num = p.numbers[cell]!;
  if (num && num !== nextNumber(s)) return false;
  // The last number closes the trail: only as the final cell.
  if (num === lastNumber(p) && s.path.length !== p.size * p.size - 1) return false;
  return true;
}

const finished = (p: TrailPuzzle, path: number[]) =>
  path.length === p.size * p.size && p.numbers[path[path.length - 1]!] === lastNumber(p);

export function extend(s: TrailState, cell: number, options: { hint?: boolean } = {}): TrailState {
  if (s.solved || !canExtend(s, cell)) return s;
  const path = [...s.path, cell];
  return { ...s, path, hints: s.hints + (options.hint ? 1 : 0), solved: finished(s.puzzle, path) };
}

/** Cuts the trail back so that it ends on `cell` (which must be on it). */
export function backTo(s: TrailState, cell: number): TrailState {
  const i = s.path.indexOf(cell);
  if (s.solved || i < 0 || i === s.path.length - 1) return s;
  return { ...s, path: s.path.slice(0, i + 1) };
}

export const undoStep = (s: TrailState) =>
  s.path.length > 1 ? backTo(s, s.path[s.path.length - 2]!) : s;

/** How far the trail follows the solution. */
export function agreed(s: Pick<TrailState, 'puzzle' | 'path'>): number {
  let i = 0;
  while (i < s.path.length && s.path[i] === s.puzzle.solution[i]) i++;
  return i;
}

/**
 * A cell next to the trail's end that has exactly two ways in left (its unvisited neighbours and
 * the end): the trail must enter it now. Null when none.
 */
export function forcedCell(s: Pick<TrailState, 'puzzle' | 'path'>): number | null {
  const p = s.puzzle;
  const n = p.size;
  const walls = new Set(p.walls);
  const end = s.path[s.path.length - 1]!;
  const on = new Set(s.path);
  const last = p.numbers.indexOf(lastNumber(p));
  for (const c of exits(p, end, walls)) {
    if (on.has(c) || c === last) continue;
    const ways = exits(p, c, walls).filter((x) => !on.has(x) || x === end).length;
    if (ways === 2 && canExtend(s, c)) return c;
  }
  void n;
  return null;
}

export function isValidTrailState(data: unknown): data is TrailState {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as TrailState;
  if (typeof d.level !== 'string' || !(d.level in SPECS)) return false;
  if (!Number.isInteger(d.seed) || d.seed < 0 || d.seed > 0xffffffff) return false;
  if (!Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.hints) || d.hints < 0 || typeof d.solved !== 'boolean') return false;
  const fresh = generate(d.level, d.seed);
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  if (!Array.isArray(d.path) || !d.path.length) return false;
  let replay: TrailState = { ...d, puzzle: fresh, path: [fresh.numbers.indexOf(1)], solved: false };
  if (d.path[0] !== replay.path[0]) return false;
  for (const c of d.path.slice(1)) {
    if (!Number.isInteger(c)) return false;
    const next = extend(replay, c);
    if (next === replay) return false;
    replay = next;
  }
  return replay.solved === d.solved;
}
