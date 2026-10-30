/**
 * Fibonacci Merge levels on the shared sliding-merge core (`../shared/merge`): two tiles merge when
 * they are consecutive Fibonacci numbers (or both 1), making the next one.
 */
import type { MergeRules } from '../shared/merge/engine';

export * from '../shared/merge/engine';
export * from '../shared/merge/play';

export const FIBONACCI = (() => {
  const out = [1, 2];
  while (out.length < 30) out.push(out[out.length - 1]! + out[out.length - 2]!);
  return out;
})();

const merge = (a: number, b: number) => {
  if (a === 1 && b === 1) return 2;
  const i = FIBONACCI.indexOf(Math.min(a, b));
  return i >= 0 && FIBONACCI[i + 1] === Math.max(a, b) ? a + b : null;
};
const spawns: [number, number][] = [
  [1, 3],
  [2, 1],
];

export const LEVELS: Record<string, MergeRules> = {
  classic: { size: 4, merge, spawns, goal: 2584 },
  mini: { size: 3, merge, spawns, goal: 144 },
  big: { size: 5, merge, spawns, goal: 4181 },
};

/** Color step of a tile: its place in the Fibonacci sequence. */
export const rank = (v: number) => Math.max(0, FIBONACCI.indexOf(v));
