/**
 * The shared core of the sliding-tile puzzles (8-Puzzle, 15-Puzzle): boards, solvability, seeded
 * scrambles, moves (one tile or a whole line toward the gap), and solvers — IDA* with Manhattan
 * distance plus linear conflicts (optimal), budgeted, and a row-by-row reduction method for large
 * boards that finishes the last 3×3 optimally.
 */
import { Rng } from '../../../core/game-engine/random';

/** Tiles row-major; 0 is the gap. Solved: 1..n²-1 then the gap. */
export type Board = number[];

export const solvedBoard = (n: number): Board =>
  Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));

export const isSolvedBoard = (b: readonly number[]) =>
  b.every((t, i) => t === (i === b.length - 1 ? 0 : i + 1));

export function isSolvable(b: readonly number[]): boolean {
  const n = Math.round(Math.sqrt(b.length));
  const tiles = b.filter((t) => t);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++) if (tiles[i]! > tiles[j]!) inversions++;
  if (n % 2) return inversions % 2 === 0;
  const gapRowFromBottom = n - Math.floor(b.indexOf(0) / n);
  return (inversions + gapRowFromBottom) % 2 === 1;
}

/** Cells next to `c`. */
export function around(n: number, c: number): number[] {
  const r = Math.floor(c / n);
  const k = c % n;
  const out: number[] = [];
  if (r > 0) out.push(c - n);
  if (r < n - 1) out.push(c + n);
  if (k > 0) out.push(c - 1);
  if (k < n - 1) out.push(c + 1);
  return out;
}

/** Tiles that can slide into the gap. */
export function movable(b: readonly number[]): number[] {
  const n = Math.round(Math.sqrt(b.length));
  return around(n, b.indexOf(0)).map((c) => b[c]!);
}

/** Slides one tile into the gap; unchanged when it is not next to the gap. */
export function slide(b: readonly number[], tile: number): Board {
  const n = Math.round(Math.sqrt(b.length));
  const gap = b.indexOf(0);
  const at = b.indexOf(tile);
  if (tile === 0 || !around(n, gap).includes(at)) return [...b];
  const out = [...b];
  out[gap] = tile;
  out[at] = 0;
  return out;
}

/**
 * The tiles to slide, nearest the gap first, when `tile` shares a row or column with the gap
 * (tapping a tile pushes the whole line).
 */
export function lineTo(b: readonly number[], tile: number): number[] {
  const n = Math.round(Math.sqrt(b.length));
  const gap = b.indexOf(0);
  const at = b.indexOf(tile);
  if (tile === 0 || at < 0) return [];
  const gr = Math.floor(gap / n);
  const gc = gap % n;
  const tr = Math.floor(at / n);
  const tc = at % n;
  if (gr !== tr && gc !== tc) return [];
  const step = gr === tr ? Math.sign(tc - gc) : Math.sign(tr - gr) * n;
  const out: number[] = [];
  for (let c = gap + step; ; c += step) {
    out.push(b[c]!);
    if (c === at) break;
  }
  return out;
}

export function manhattan(b: readonly number[]): number {
  const n = Math.round(Math.sqrt(b.length));
  let d = 0;
  b.forEach((t, c) => {
    if (!t) return;
    const g = t - 1;
    d += Math.abs(Math.floor(g / n) - Math.floor(c / n)) + Math.abs((g % n) - (c % n));
  });
  return d;
}

/** Manhattan distance plus two moves per linear conflict (admissible). */
export function heuristic(b: readonly number[]): number {
  const n = Math.round(Math.sqrt(b.length));
  let h = manhattan(b);
  for (let line = 0; line < n; line++) {
    for (const byRow of [true, false]) {
      const goals: number[] = [];
      for (let i = 0; i < n; i++) {
        const c = byRow ? line * n + i : i * n + line;
        const t = b[c]!;
        if (!t) continue;
        const g = t - 1;
        if (byRow ? Math.floor(g / n) === line : g % n === line)
          goals.push(byRow ? g % n : Math.floor(g / n));
      }
      // Tiles to lift out of the line = length minus its longest increasing run of goals.
      const lis: number[] = [];
      for (const x of goals) {
        let lo = 0;
        let hi = lis.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (lis[mid]! < x) lo = mid + 1;
          else hi = mid;
        }
        lis[lo] = x;
      }
      h += 2 * (goals.length - lis.length);
    }
  }
  return h;
}

export interface SolveResult {
  /** Tiles to slide, in order; null when the budget ran out. */
  moves: number[] | null;
  nodes: number;
}

/** IDA* — optimal when it finishes within `budget` expanded nodes. */
export function solveOptimal(start: readonly number[], budget = 5_000_000): SolveResult {
  const n = Math.round(Math.sqrt(start.length));
  const b = [...start];
  let gap = b.indexOf(0);
  const path: number[] = [];
  let nodes = 0;
  let h = heuristic(b);
  let bound = h;
  const FOUND = -1;
  const search = (g: number, hNow: number, prevGap: number): number => {
    const f = g + hNow;
    if (f > bound) return f;
    if (hNow === 0) return FOUND;
    if (++nodes > budget) return Infinity;
    let min = Infinity;
    for (const c of around(n, gap)) {
      if (c === prevGap) continue;
      const tile = b[c]!;
      const from = gap;
      b[from] = tile;
      b[c] = 0;
      gap = c;
      path.push(tile);
      const t = search(g + 1, heuristic(b), from);
      if (t === FOUND) return FOUND;
      if (t < min) min = t;
      path.pop();
      b[c] = tile;
      b[from] = 0;
      gap = from;
    }
    return min;
  };
  for (;;) {
    const t = search(0, h, -1);
    if (t === FOUND) return { moves: [...path], nodes };
    if (t === Infinity) return { moves: null, nodes };
    bound = t;
    h = heuristic(b);
  }
}

/** A seeded solvable board: a random permutation (any distance) or `walk` random gap moves. */
export function scramble(n: number, seed: number, walk?: number): Board {
  const rng = new Rng(seed >>> 0);
  if (walk !== undefined) {
    let b = solvedBoard(n);
    let prev = -1;
    for (let i = 0; i < walk; i++) {
      const gap = b.indexOf(0);
      const options = around(n, gap).filter((c) => c !== prev);
      const c = options[rng.int(options.length)]!;
      b = slide(b, b[c]!);
      prev = gap;
    }
    if (isSolvedBoard(b)) b = slide(b, movable(b)[0]!);
    return b;
  }
  for (;;) {
    const b = solvedBoard(n);
    for (let i = b.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [b[i], b[j]] = [b[j]!, b[i]!];
    }
    if (isSolvable(b) && !isSolvedBoard(b)) return b;
  }
}

/**
 * Weighted A* (f = g + w·h): fast, with solutions at most `w` times longer than optimal. Returns
 * null when `budget` nodes are expanded without reaching the goal.
 */
export function solveWeighted(start: readonly number[], w = 1.6, budget = 400_000): SolveResult {
  const n = Math.round(Math.sqrt(start.length));
  interface Node {
    b: number[];
    g: number;
    f: number;
    parent: Node | null;
    tile: number;
  }
  const heap: Node[] = [];
  const push = (x: Node) => {
    heap.push(x);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p]!.f <= x.f) break;
      heap[i] = heap[p]!;
      i = p;
    }
    heap[i] = x;
  };
  const pop = () => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        const fm = () => (m === i ? last.f : heap[m]!.f);
        if (l < heap.length && heap[l]!.f < fm()) m = l;
        if (r < heap.length && heap[r]!.f < fm()) m = r;
        if (m === i) break;
        heap[i] = heap[m]!;
        i = m;
      }
      heap[i] = last;
    }
    return top;
  };
  const best = new Map<string, number>();
  push({ b: [...start], g: 0, f: w * heuristic(start), parent: null, tile: 0 });
  best.set(start.join(','), 0);
  let nodes = 0;
  while (heap.length) {
    const cur = pop();
    if (isSolvedBoard(cur.b)) {
      const moves: number[] = [];
      for (let x: Node | null = cur; x?.parent; x = x.parent) moves.push(x.tile);
      return { moves: moves.reverse(), nodes };
    }
    if (++nodes > budget) break;
    const gap = cur.b.indexOf(0);
    for (const c of around(n, gap)) {
      const tile = cur.b[c]!;
      if (tile === cur.tile) continue;
      const b = [...cur.b];
      b[gap] = tile;
      b[c] = 0;
      const key = b.join(',');
      const g = cur.g + 1;
      if ((best.get(key) ?? Infinity) <= g) continue;
      best.set(key, g);
      push({ b, g, f: g + w * heuristic(b), parent: cur, tile });
    }
  }
  return { moves: null, nodes };
}

/** The best solution available quickly: optimal within the budget, else weighted A*. */
export function solve(b: readonly number[], optimalBudget = 60_000) {
  const exact = solveOptimal(b, optimalBudget);
  if (exact.moves) return { moves: exact.moves, optimal: true };
  for (const w of [1.4, 1.8, 2.5]) {
    const r = solveWeighted(b, w);
    if (r.moves) return { moves: r.moves, optimal: false };
  }
  throw new Error('Sliding puzzle could not be solved');
}
