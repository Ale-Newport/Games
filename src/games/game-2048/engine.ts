/** Merge to 2048 levels on the shared sliding-merge core (`../shared/merge`): equal tiles add up. */
import type { MergeRules } from '../shared/merge/engine';

export * from '../shared/merge/engine';
export * from '../shared/merge/play';

const merge = (a: number, b: number) => (a === b ? a + b : null);
const spawns: [number, number][] = [
  [2, 9],
  [4, 1],
];

export const LEVELS: Record<string, MergeRules> = {
  classic: { size: 4, merge, spawns, goal: 2048 },
  mini: { size: 3, merge, spawns, goal: 256 },
  big: { size: 5, merge, spawns, goal: 4096 },
};

/** Color step of a tile: its power of two. */
export const rank = (v: number) => Math.max(0, Math.round(Math.log2(v)) - 1);
