/**
 * Color Links rules and generator. Pairs of colored dots sit on a grid; join each pair with a path
 * through side-adjacent cells so that paths never cross and every cell is used. Puzzles come from a
 * seed: a random path through every cell, cut into stretches of three or more cells, one color per
 * stretch, its two ends becoming the dots (the cut with the fewest shortcuts of 20 is kept). Any full filling with every pair joined is accepted.
 */
import { Rng } from '../../core/game-engine/random';

export interface LinkPuzzle {
  size: number;
  /** Endpoint pairs, one per color. */
  pairs: [number, number][];
  /** A reference solution: each color's path from its first dot to its second. */
  solution: number[][];
}

export interface LinkSpec {
  size: number;
  colors: number;
}

export const SPECS: Record<string, LinkSpec> = {
  easy: { size: 5, colors: 5 },
  medium: { size: 7, colors: 7 },
  hard: { size: 9, colors: 9 },
};

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

/** A random path through every cell (depth-first, ordered by Warnsdorff's rule with noise). */
function randomTour(n: number, rng: Rng): number[] {
  const total = n * n;
  for (;;) {
    const start = rng.int(total);
    const seen = new Uint8Array(total);
    const path = [start];
    seen[start] = 1;
    let steps = 0;
    const walk = (cur: number): boolean => {
      if (path.length === total) return true;
      if (++steps > 20_000) return false;
      const options = neighbours(n, cur).filter((x) => !seen[x]);
      const free = (x: number) => neighbours(n, x).filter((y) => !seen[y]).length;
      options.sort((a, b) => free(a) - free(b) + (rng.float() - 0.5) * 1.5);
      for (const x of options) {
        seen[x] = 1;
        path.push(x);
        if (walk(x)) return true;
        path.pop();
        seen[x] = 0;
      }
      return false;
    };
    if (walk(start)) return path;
  }
}

/** Places where a stretch touches itself sideways (shortcuts its two dots could take). */
function shortcuts(n: number, stretch: number[]): number {
  const at = new Map(stretch.map((c, i) => [c, i]));
  let k = 0;
  stretch.forEach((c, i) =>
    neighbours(n, c).forEach((x) => at.has(x) && at.get(x)! - i > 1 && k++),
  );
  return k;
}

export function generateLinks(level: string, seed: number): LinkPuzzle {
  const spec = SPECS[level] ?? SPECS.easy!;
  const n = spec.size;
  const rng = new Rng(seed >>> 0);
  let best: LinkPuzzle | null = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 20; attempt++) {
    const tour = randomTour(n, rng);
    // Cut points: `colors` stretches of at least three cells.
    const total = n * n;
    const lengths = new Array<number>(spec.colors).fill(3);
    for (let left = total - 3 * spec.colors; left > 0; left--) lengths[rng.int(spec.colors)]!++;
    const solution: number[][] = [];
    let at = 0;
    for (const len of lengths) {
      solution.push(tour.slice(at, at + len));
      at += len;
    }
    const puzzle: LinkPuzzle = {
      size: n,
      pairs: solution.map((s) => [s[0]!, s[s.length - 1]!]),
      solution,
    };
    // Prefer few sideways shortcuts: the dots then need their whole stretch.
    const score = solution.reduce((k, s) => k + shortcuts(n, s), 0);
    if (score < bestScore) {
      bestScore = score;
      best = puzzle;
    }
    if (score === 0) break;
  }
  return best!;
}

/** The color of the dot on each cell, or -1. */
export function dots(p: LinkPuzzle): number[] {
  const out = new Array<number>(p.size * p.size).fill(-1);
  p.pairs.forEach(([a, b], k) => {
    out[a] = k;
    out[b] = k;
  });
  return out;
}

/** Whether a drawn path joins its color's two dots. */
export const joined = (p: LinkPuzzle, k: number, path: readonly number[]) => {
  const [a, b] = p.pairs[k]!;
  return (
    path.length >= 2 &&
    ((path[0] === a && path[path.length - 1] === b) ||
      (path[0] === b && path[path.length - 1] === a))
  );
};

/** Cell owner from the drawn paths (-1 empty). */
export function owners(p: LinkPuzzle, paths: readonly number[][]): number[] {
  const out = dots(p);
  paths.forEach((path, k) => path.forEach((c) => (out[c] = k)));
  return out;
}

export const isSolved = (p: LinkPuzzle, paths: readonly number[][]) =>
  paths.every((path, k) => joined(p, k, path)) && owners(p, paths).every((o) => o >= 0);

export interface LinkState {
  level: string;
  seed: number;
  puzzle: LinkPuzzle;
  /** Each color's drawn path, starting on one of its dots (empty when not started). */
  paths: number[][];
  /** Strokes drawn (a stroke is one drag). */
  strokes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newLinks(level: string, seed: number): LinkState {
  const lv = SPECS[level] ? level : 'easy';
  const puzzle = generateLinks(lv, seed);
  return {
    level: lv,
    seed: seed >>> 0,
    puzzle,
    paths: puzzle.pairs.map(() => []),
    strokes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

const done = (s: LinkState, paths: number[][]) => ({
  ...s,
  paths,
  solved: isSolved(s.puzzle, paths),
});

/**
 * Starts a stroke on cell `c`: on a dot it restarts that color from the dot; on a drawn cell it
 * cuts that color back to the cell. Returns the color being drawn, or -1.
 */
export function startStroke(s: LinkState, c: number): { state: LinkState; color: number } {
  if (s.solved) return { state: s, color: -1 };
  const dot = dots(s.puzzle)[c]!;
  if (dot >= 0) {
    const paths = s.paths.map((p, k) => (k === dot ? [c] : p));
    return { state: done({ ...s, strokes: s.strokes + 1 }, paths), color: dot };
  }
  const owner = s.paths.findIndex((p) => p.includes(c));
  if (owner < 0) return { state: s, color: -1 };
  const path = s.paths[owner]!;
  const paths = s.paths.map((p, k) => (k === owner ? path.slice(0, path.indexOf(c) + 1) : p));
  return { state: done({ ...s, strokes: s.strokes + 1 }, paths), color: owner };
}

/**
 * Extends color `k` from the end of its path into the side-adjacent cell `c`: back over its own
 * path cuts it, another color's path is cut where it is crossed, another color's dot blocks, and
 * the color's other dot finishes the path.
 */
export function extendStroke(s: LinkState, k: number, c: number): LinkState {
  if (s.solved) return s;
  const path = s.paths[k]!;
  const end = path[path.length - 1];
  if (end === undefined || !neighbours(s.puzzle.size, end).includes(c)) return s;
  const i = path.indexOf(c);
  if (i >= 0)
    return done(
      s,
      s.paths.map((p, j) => (j === k ? path.slice(0, i + 1) : p)),
    );
  if (joined(s.puzzle, k, path)) return s;
  const dot = dots(s.puzzle)[c]!;
  if (dot >= 0 && dot !== k) return s;
  const paths = s.paths.map((p, j) => {
    if (j === k) return [...path, c];
    const at = p.indexOf(c);
    return at >= 0 ? p.slice(0, at) : p;
  });
  return done(s, paths);
}

/** Reveals the reference path of color `k`, cutting other colors where they overlap it. */
export function revealPath(s: LinkState, k: number): LinkState {
  const ref = s.puzzle.solution[k]!;
  const taken = new Set(ref);
  const paths = s.paths.map((p, j) => {
    if (j === k) return [...ref];
    const at = p.findIndex((c) => taken.has(c));
    return at >= 0 ? p.slice(0, at) : p;
  });
  return done({ ...s, hints: s.hints + 1 }, paths);
}

/** The color a hint should reveal: one whose drawn path is not its reference path. */
export function hintColor(s: LinkState): number {
  const order = s.puzzle.pairs.map((_, k) => k);
  const unjoined = order.find((k) => !joined(s.puzzle, k, s.paths[k]!));
  const differs = order.find((k) => {
    const p = s.paths[k]!;
    const ref = s.puzzle.solution[k]!;
    return p.join() !== ref.join() && p.join() !== [...ref].reverse().join();
  });
  return differs ?? unjoined ?? 0;
}

export function isValidLinkState(d: unknown): d is LinkState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as LinkState;
  if (!SPECS[s.level] || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff)
    return false;
  for (const k of ['strokes', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0 || typeof s.solved !== 'boolean')
    return false;
  const fresh = generateLinks(s.level, s.seed);
  if (JSON.stringify(fresh) !== JSON.stringify(s.puzzle)) return false;
  if (!Array.isArray(s.paths) || s.paths.length !== fresh.pairs.length) return false;
  const n = fresh.size;
  const used = new Set<number>();
  const dotOf = dots(fresh);
  for (let k = 0; k < s.paths.length; k++) {
    const p = s.paths[k];
    if (!Array.isArray(p)) return false;
    if (p.length && !fresh.pairs[k]!.includes(p[0] as number)) return false;
    for (let i = 0; i < p.length; i++) {
      const c = p[i] as number;
      if (!Number.isInteger(c) || c < 0 || c >= n * n || used.has(c)) return false;
      if (dotOf[c]! >= 0 && dotOf[c] !== k) return false;
      if (i && !neighbours(n, p[i - 1] as number).includes(c)) return false;
      used.add(c);
    }
  }
  return s.solved === isSolved(fresh, s.paths);
}
