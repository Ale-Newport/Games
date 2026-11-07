/**
 * Hashiwokakero (#114, "bridges"): connect the islands with horizontal or vertical bridges so that
 * every island has as many bridges as its number, at most two bridges join the same pair, bridges
 * never cross islands or each other, and all islands end up connected.
 *
 * Puzzles are generated from a seed: islands grown one by one in straight lines from existing ones
 * (with one or two bridges each, sometimes closing a cycle), numbered by their bridges, and kept
 * when the exact solver finds exactly one solution and the technique solver reaches it.
 */
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export interface Island {
  cell: number;
  n: number;
}

/** A possible bridge: two islands facing each other with nothing between. */
export interface Pair {
  a: number;
  b: number;
  horizontal: boolean;
  /** Cells strictly between the two islands. */
  cells: number[];
}

export interface HashiPuzzle {
  rows: number;
  cols: number;
  islands: Island[];
  pairs: Pair[];
  /** For each pair, the pairs it would cross. */
  crossings: number[][];
  /** Bridges per pair in the solution. */
  solution: number[];
}

/** Pairs of facing islands and which of them cross. */
export function pairsOf(rows: number, cols: number, cells: readonly number[]) {
  const at = new Map(cells.map((c, i) => [c, i]));
  const pairs: Pair[] = [];
  cells.forEach((c, i) => {
    const r = Math.floor(c / cols);
    const k = c % cols;
    for (const [dr, dk] of [
      [0, 1],
      [1, 0],
    ] as const) {
      const between: number[] = [];
      for (let rr = r + dr, kk = k + dk; rr < rows && kk < cols; rr += dr, kk += dk) {
        const x = rr * cols + kk;
        const j = at.get(x);
        if (j !== undefined) {
          if (between.length) pairs.push({ a: i, b: j, horizontal: dk === 1, cells: between });
          break;
        }
        between.push(x);
      }
    }
  });
  const crossings = pairs.map((p, i) =>
    pairs.flatMap((q, j) =>
      i !== j && p.horizontal !== q.horizontal && p.cells.some((x) => q.cells.includes(x))
        ? [j]
        : [],
    ),
  );
  return { pairs, crossings };
}

const incident = (p: Pick<HashiPuzzle, 'islands' | 'pairs'>) => {
  const out = p.islands.map(() => [] as number[]);
  p.pairs.forEach((q, i) => {
    out[q.a]!.push(i);
    out[q.b]!.push(i);
  });
  return out;
};

/** Whether the islands are all connected by the bridges given. */
export function connected(p: Pick<HashiPuzzle, 'islands' | 'pairs'>, bridges: readonly number[]) {
  const seen = new Set([0]);
  const stack = [0];
  const inc = incident(p);
  while (stack.length) {
    const i = stack.pop()!;
    for (const q of inc[i]!) {
      if (!bridges[q]) continue;
      const j = p.pairs[q]!.a === i ? p.pairs[q]!.b : p.pairs[q]!.a;
      if (!seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return seen.size === p.islands.length;
}

// ---------------------------------------------------------------- bounds and techniques

/** Lower and upper bound of bridges on each pair. */
export interface Bounds {
  lo: number[];
  hi: number[];
}

export type Technique = 'full' | 'at-least' | 'done' | 'crossing' | 'isolation';
export const TECHNIQUE_LEVEL: Record<Technique, number> = {
  full: 1,
  'at-least': 1,
  done: 1,
  crossing: 1,
  isolation: 2,
};

export interface Step {
  technique: Technique;
  island: number;
  /** Bounds tightened: [pair, new lo, new hi]. */
  set: [number, number, number][];
}

/** The easiest deduction that tightens a bound, or null. */
export function nextStep(p: HashiPuzzle, bounds: Bounds, inc = incident(p)): Step | null {
  const { lo, hi } = bounds;
  for (let i = 0; i < p.islands.length; i++) {
    const need = p.islands[i]!.n;
    const qs = inc[i]!;
    const sumLo = qs.reduce((s, q) => s + lo[q]!, 0);
    const sumHi = qs.reduce((s, q) => s + hi[q]!, 0);
    if (sumLo === need && qs.some((q) => hi[q]! > lo[q]!))
      return {
        technique: 'done',
        island: i,
        set: qs.filter((q) => hi[q]! > lo[q]!).map((q) => [q, lo[q]!, lo[q]!]),
      };
    if (sumHi === need && qs.some((q) => lo[q]! < hi[q]!))
      return {
        technique: 'full',
        island: i,
        set: qs.filter((q) => lo[q]! < hi[q]!).map((q) => [q, hi[q]!, hi[q]!]),
      };
    for (const q of qs) {
      const others = sumHi - hi[q]!;
      const min = need - others;
      if (min > lo[q]!) return { technique: 'at-least', island: i, set: [[q, min, hi[q]!]] };
      const max = need - (sumLo - lo[q]!);
      if (max < hi[q]!)
        return { technique: 'done', island: i, set: [[q, lo[q]!, Math.max(lo[q]!, max)]] };
    }
  }
  for (let q = 0; q < p.pairs.length; q++)
    if (lo[q]! > 0)
      for (const x of p.crossings[q]!)
        if (hi[x]! > 0) return { technique: 'crossing', island: p.pairs[q]!.a, set: [[x, 0, 0]] };
  // Isolation: two islands whose numbers a bridge pair would use up completely, while other
  // islands remain, cannot take that many bridges between them.
  if (p.islands.length > 2)
    for (let q = 0; q < p.pairs.length; q++) {
      const { a, b } = p.pairs[q]!;
      const na = p.islands[a]!.n;
      const nb = p.islands[b]!.n;
      if (na === nb && na <= 2 && hi[q]! >= na) {
        return { technique: 'isolation', island: a, set: [[q, lo[q]!, na - 1]] };
      }
    }
  return null;
}

export function applyStep(bounds: Bounds, step: Step) {
  for (const [q, l, h] of step.set) {
    bounds.lo[q] = Math.max(bounds.lo[q]!, l);
    bounds.hi[q] = Math.min(bounds.hi[q]!, h);
  }
}

export const freshBounds = (p: HashiPuzzle): Bounds => ({
  lo: p.pairs.map(() => 0),
  hi: p.pairs.map(() => 2),
});

export function logicSolve(p: HashiPuzzle) {
  const bounds = freshBounds(p);
  const inc = incident(p);
  let level = 1;
  const used: Partial<Record<Technique, number>> = {};
  for (let i = 0; i < p.pairs.length * 6; i++) {
    const step = nextStep(p, bounds, inc);
    if (!step) break;
    level = Math.max(level, TECHNIQUE_LEVEL[step.technique]);
    used[step.technique] = (used[step.technique] ?? 0) + 1;
    applyStep(bounds, step);
  }
  const solved = bounds.lo.every((l, q) => l === bounds.hi[q]) && connected(p, bounds.lo);
  return { bounds, level: solved ? level : 4, used, solved };
}

// ---------------------------------------------------------------- exact solver

export function countSolutions(p: HashiPuzzle, limit = 2, maxNodes = 30000) {
  const inc = incident(p);
  const result = { count: 0, first: null as number[] | null, aborted: false };
  let nodes = 0;
  const propagate = (b: Bounds): boolean => {
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < p.islands.length; i++) {
        const need = p.islands[i]!.n;
        const qs = inc[i]!;
        const sumLo = qs.reduce((s, q) => s + b.lo[q]!, 0);
        const sumHi = qs.reduce((s, q) => s + b.hi[q]!, 0);
        if (sumLo > need || sumHi < need) return false;
        for (const q of qs) {
          const l = Math.max(b.lo[q]!, need - (sumHi - b.hi[q]!));
          const h = Math.min(b.hi[q]!, need - (sumLo - b.lo[q]!));
          if (l > h) return false;
          if (l !== b.lo[q] || h !== b.hi[q]) {
            b.lo[q] = l;
            b.hi[q] = h;
            changed = true;
          }
        }
      }
      for (let q = 0; q < p.pairs.length; q++)
        if (b.lo[q]! > 0)
          for (const x of p.crossings[q]!) {
            if (b.lo[x]! > 0) return false;
            if (b.hi[x]! > 0) {
              b.hi[x] = 0;
              changed = true;
            }
          }
    }
    return true;
  };
  const search = (b: Bounds) => {
    if (++nodes > maxNodes) {
      result.aborted = true;
      return;
    }
    if (!propagate(b)) return;
    const q = b.lo.findIndex((l, i) => l < b.hi[i]!);
    if (q < 0) {
      if (connected(p, b.lo)) {
        result.count++;
        result.first ??= [...b.lo];
      }
      return;
    }
    for (let v = b.hi[q]!; v >= b.lo[q]!; v--) {
      const next = { lo: [...b.lo], hi: [...b.hi] };
      next.lo[q] = v;
      next.hi[q] = v;
      search(next);
      if (result.count >= limit || result.aborted) return;
    }
  };
  search(freshBounds(p));
  return result;
}

// ---------------------------------------------------------------- generator

export interface HashiSpec {
  rows: number;
  cols: number;
  islands: number;
  maxLevel: number;
}

export function generateHashi(spec: HashiSpec, seed: number): HashiPuzzle {
  const rng = new Rng(seed);
  const { rows, cols } = spec;
  for (let attempt = 0; attempt < 300; attempt++) {
    const cells = [rng.int(rows * cols)];
    const used = new Set<number>(); // cells crossed by bridges
    const bridges = new Map<string, number>();
    const free = (x: number) => !cells.includes(x) && !used.has(x);
    const nearIsland = (x: number) => {
      const r = Math.floor(x / cols);
      const k = x % cols;
      return [
        r > 0 ? x - cols : -1,
        r < rows - 1 ? x + cols : -1,
        k > 0 ? x - 1 : -1,
        k < cols - 1 ? x + 1 : -1,
      ].some((y) => y >= 0 && cells.includes(y));
    };
    for (let tries = 0; cells.length < spec.islands && tries < spec.islands * 60; tries++) {
      const from = cells[rng.int(cells.length)]!;
      const [dr, dk] = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ][rng.int(4)] as [number, number];
      const len = 2 + rng.int(Math.max(1, Math.min(rows, cols) - 2));
      const r0 = Math.floor(from / cols);
      const k0 = from % cols;
      const path: number[] = [];
      let ok = true;
      for (let s = 1; s < len; s++) {
        const r = r0 + dr * s;
        const k = k0 + dk * s;
        if (r < 0 || k < 0 || r >= rows || k >= cols || !free(r * cols + k)) {
          ok = false;
          break;
        }
        path.push(r * cols + k);
      }
      const tr = r0 + dr * len;
      const tk = k0 + dk * len;
      if (!ok || tr < 0 || tk < 0 || tr >= rows || tk >= cols) continue;
      const target = tr * cols + tk;
      if (!free(target) || nearIsland(target)) continue;
      cells.push(target);
      for (const x of path) used.add(x);
      bridges.set(`${from}:${target}`, 1 + (rng.float() < 0.35 ? 1 : 0));
    }
    if (cells.length < spec.islands * 0.85) continue;
    const { pairs, crossings } = pairsOf(rows, cols, cells);
    const solution = pairs.map((q) => {
      const x = cells[q.a]!;
      const y = cells[q.b]!;
      return bridges.get(`${x}:${y}`) ?? bridges.get(`${y}:${x}`) ?? 0;
    });
    // A pair with a bridge must exist for every drawn bridge (an island may sit on a drawn path).
    if ([...bridges.values()].reduce((s, v) => s + v, 0) !== solution.reduce((s, v) => s + v, 0))
      continue;
    const islands = cells.map((cell, i) => ({
      cell,
      n: pairs.reduce((s, q, j) => s + (q.a === i || q.b === i ? solution[j]! : 0), 0),
    }));
    const p: HashiPuzzle = { rows, cols, islands, pairs, crossings, solution };
    if (!connected(p, solution)) continue;
    const r = countSolutions(p, 2);
    if (r.count !== 1 || r.aborted) continue;
    if (logicSolve(p).level > spec.maxLevel) continue;
    return p;
  }
  throw new Error('No hashiwokakero');
}

// ---------------------------------------------------------------- play state

export const DIFFICULTIES: Record<string, HashiSpec> = {
  easy: { rows: 7, cols: 7, islands: 10, maxLevel: 2 },
  medium: { rows: 9, cols: 9, islands: 16, maxLevel: 2 },
  hard: { rows: 11, cols: 11, islands: 24, maxLevel: 2 },
  expert: { rows: 13, cols: 13, islands: 32, maxLevel: 2 },
};

interface Change {
  pair: number;
  before: number;
}

export interface HashiState {
  difficulty: string;
  seed: number;
  puzzle: HashiPuzzle;
  bridges: number[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newHashi(difficulty: string, seed: number): HashiState {
  const spec = DIFFICULTIES[difficulty];
  if (!spec) throw new Error(`Unknown difficulty ${difficulty}`);
  const puzzle = generateHashi(spec, seed);
  return {
    difficulty,
    seed,
    puzzle,
    bridges: puzzle.pairs.map(() => 0),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

export const isSolved = (p: HashiPuzzle, bridges: readonly number[]) =>
  bridges.every((b, q) => b === p.solution[q]);

/** Pairs a bridge on `q` would cross that already have a bridge. */
export const blockedBy = (s: HashiState, q: number) =>
  s.puzzle.crossings[q]!.filter((x) => s.bridges[x]! > 0);

/** Sets the bridges on a pair (refused while a crossing bridge is in the way). */
export function setBridge(
  s: HashiState,
  q: number,
  count: number,
  options: { hint?: boolean } = {},
): HashiState {
  if (s.solved || count < 0 || count > 2 || s.bridges[q] === count) return s;
  if (count > 0 && blockedBy(s, q).length) return s;
  const bridges = [...s.bridges];
  bridges[q] = count;
  const wrong = count > s.puzzle.solution[q]! && count > s.bridges[q]! ? 1 : 0;
  return {
    ...s,
    bridges,
    undo: [...s.undo, { pair: q, before: s.bridges[q]! }].slice(-500),
    redo: [],
    mistakes: s.mistakes + wrong,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolved(s.puzzle, bridges),
  };
}

/** 0 → 1 → 2 → 0. */
export const cycleBridge = (s: HashiState, q: number) => setBridge(s, q, (s.bridges[q]! + 1) % 3);

function swap(s: HashiState, from: 'undo' | 'redo'): HashiState {
  const last = s[from].at(-1);
  if (!last || s.solved) return s;
  const bridges = [...s.bridges];
  const back: Change = { pair: last.pair, before: bridges[last.pair]! };
  bridges[last.pair] = last.before;
  const to = from === 'undo' ? 'redo' : 'undo';
  return {
    ...s,
    bridges,
    [from]: s[from].slice(0, -1),
    [to]: [...s[to], back],
    solved: isSolved(s.puzzle, bridges),
  };
}

export const undoMove = (s: HashiState) => swap(s, 'undo');
export const redoMove = (s: HashiState) => swap(s, 'redo');

/** Bridges per island now. */
export const islandCounts = (s: HashiState) =>
  s.puzzle.islands.map((_, i) =>
    s.puzzle.pairs.reduce((n, q, j) => n + (q.a === i || q.b === i ? s.bridges[j]! : 0), 0),
  );

/** Pairs with more bridges than the solution has. */
export const wrongPairs = (s: HashiState) =>
  s.bridges.flatMap((b, q) => (b > s.puzzle.solution[q]! ? [q] : []));

/**
 * The hint: the first deduction (from the bridges placed, as lower bounds) that adds a bridge
 * the player has not drawn yet, with the techniques used on the way.
 */
export function hintStep(s: HashiState): { pair: number; count: number; steps: Step[] } | null {
  const bounds: Bounds = { lo: [...s.bridges], hi: s.puzzle.pairs.map(() => 2) };
  const steps: Step[] = [];
  for (let i = 0; i < s.puzzle.pairs.length * 6; i++) {
    const step = nextStep(s.puzzle, bounds);
    if (!step) return null;
    steps.push(step);
    applyStep(bounds, step);
    const q = bounds.lo.findIndex((l, j) => l > s.bridges[j]!);
    if (q >= 0) return { pair: q, count: bounds.lo[q]!, steps };
  }
  return null;
}

const intArray = (a: unknown, len: number, max: number) =>
  Array.isArray(a) && a.length === len && a.every((x) => Number.isInteger(x) && x >= 0 && x <= max);

/** A saved game is valid when its puzzle is exactly the one its seed generates. */
export function isValidHashiState(data: unknown): data is HashiState {
  if (!isRecord(data)) return false;
  const d = data as unknown as HashiState;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in DIFFICULTIES)) return false;
  if (!Number.isInteger(d.seed) || !Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints) || typeof d.solved !== 'boolean')
    return false;
  if (!Array.isArray(d.undo) || !Array.isArray(d.redo)) return false;
  const fresh = newHashi(d.difficulty, d.seed).puzzle;
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  const len = fresh.pairs.length;
  if (!intArray(d.bridges, len, 2)) return false;
  const ok = (list: unknown[]) =>
    list.every(
      (ch) =>
        isRecord(ch) &&
        Number.isInteger(ch.pair) &&
        (ch.pair as number) >= 0 &&
        (ch.pair as number) < len &&
        Number.isInteger(ch.before) &&
        (ch.before as number) >= 0 &&
        (ch.before as number) <= 2,
    );
  return ok(d.undo) && ok(d.redo) && d.solved === isSolved(fresh, d.bridges);
}
