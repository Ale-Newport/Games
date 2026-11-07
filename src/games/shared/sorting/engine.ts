/**
 * The shared core of the tube-sorting puzzles (Water Sort, Ball Sort): tubes of a fixed capacity
 * holding colored units, bottom first. A move takes the top of one tube to another whose top is the
 * same color or that is empty, as long as there is room — pouring the whole run of that color
 * (water) or a single unit (balls). Solved when every tube is empty or full of one color. Puzzles
 * are seeded shuffles checked by a solver (depth-first search over canonical positions).
 */
import { Rng } from '../../../core/game-engine/random';

export type Tube = number[];

export interface SortRules {
  capacity: number;
  /** Pour the whole run of the top color (water) or one unit (balls). */
  pourAll: boolean;
}

export const topRun = (t: readonly number[]) => {
  if (!t.length) return 0;
  const c = t[t.length - 1]!;
  let k = 0;
  for (let i = t.length - 1; i >= 0 && t[i] === c; i--) k++;
  return k;
};

/** How many units move from `a` to `b`, or 0 when the move is not allowed. */
export function amount(tubes: readonly Tube[], a: number, b: number, rules: SortRules): number {
  if (a === b) return 0;
  const from = tubes[a];
  const to = tubes[b];
  if (!from?.length || !to || to.length >= rules.capacity) return 0;
  const color = from[from.length - 1]!;
  if (to.length && to[to.length - 1] !== color) return 0;
  const run = rules.pourAll ? topRun(from) : 1;
  return Math.min(run, rules.capacity - to.length);
}

export function pour(tubes: readonly Tube[], a: number, b: number, rules: SortRules): Tube[] {
  const k = amount(tubes, a, b, rules);
  if (!k) return tubes.map((t) => [...t]);
  const out = tubes.map((t) => [...t]);
  const moved = out[a]!.splice(out[a]!.length - k, k);
  out[b]!.push(...moved);
  return out;
}

export const isSorted = (tubes: readonly Tube[], rules: SortRules) =>
  tubes.every((t) => !t.length || (t.length === rules.capacity && t.every((c) => c === t[0])));

/** Every allowed move as [from, to], skipping pointless ones (a finished tube, or a whole one-color tube into an empty one). */
export function moves(tubes: readonly Tube[], rules: SortRules): [number, number][] {
  const out: [number, number][] = [];
  tubes.forEach((from, a) => {
    if (!from.length) return;
    const done = from.length === rules.capacity && topRun(from) === rules.capacity;
    if (done) return;
    tubes.forEach((to, b) => {
      if (!amount(tubes, a, b, rules)) return;
      if (!to.length && topRun(from) === from.length) return;
      out.push([a, b]);
    });
  });
  return out;
}

const canonical = (tubes: readonly Tube[]) =>
  tubes
    .map((t) => t.join(','))
    .sort()
    .join('|');

/** A solution as [from, to] moves (depth-first, remembering dead positions), or null. */
export function solveSort(
  tubes: readonly Tube[],
  rules: SortRules,
  budget = 200_000,
): { moves: [number, number][] | null; exhausted: boolean } {
  const dead = new Set<string>();
  const path: [number, number][] = [];
  let nodes = 0;
  const walk = (t: Tube[]): boolean => {
    if (isSorted(t, rules)) return true;
    const key = canonical(t);
    if (dead.has(key) || ++nodes > budget) return false;
    dead.add(key);
    // Prefer moves that complete or extend a run of one color.
    const options = moves(t, rules).sort(
      ([a1, b1], [a2, b2]) => score(t, a2, b2) - score(t, a1, b1),
    );
    for (const [a, b] of options) {
      path.push([a, b]);
      if (walk(pour(t, a, b, rules))) return true;
      path.pop();
      if (nodes > budget) return false;
    }
    return false;
  };
  const ok = walk(tubes.map((x) => [...x]));
  return { moves: ok ? [...path] : null, exhausted: !ok && nodes > budget };
}

function score(t: readonly Tube[], a: number, b: number): number {
  const to = t[b]!;
  const from = t[a]!;
  let s = 0;
  if (to.length && to.every((c) => c === to[0])) s += 3;
  if (!to.length) s -= 1;
  if (topRun(from) === from.length) s -= 2;
  return s;
}

export interface SortSpec {
  colors: number;
  empty: number;
  capacity: number;
}

/** A seeded shuffle of `colors` × `capacity` units into full tubes plus empty ones. */
export function shuffleTubes(spec: SortSpec, seed: number): Tube[] {
  const rng = new Rng(seed >>> 0);
  const units: number[] = [];
  for (let c = 0; c < spec.colors; c++) for (let i = 0; i < spec.capacity; i++) units.push(c);
  for (let i = units.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [units[i], units[j]] = [units[j]!, units[i]!];
  }
  const tubes: Tube[] = [];
  for (let c = 0; c < spec.colors; c++)
    tubes.push(units.slice(c * spec.capacity, (c + 1) * spec.capacity));
  for (let e = 0; e < spec.empty; e++) tubes.push([]);
  return tubes;
}
