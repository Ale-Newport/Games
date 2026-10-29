/** 3×3 levels on the shared cube core (`../shared/cube`), solved by the two-phase solver. */
import type { Turn } from '../shared/cube/cube';
import type { CubeSpec, CubeState } from '../shared/cube/play';
import { solveTwoPhase } from '../shared/cube/twophase';

export * from '../shared/cube/cube';
export * from '../shared/cube/play';

export const SPECS: Record<string, CubeSpec> = {
  easy: { size: 3, scramble: 3 },
  medium: { size: 3, scramble: 7 },
  full: { size: 3, scramble: 25 },
};

/** The shortest solution the two-phase search finds in 60 ms (optimal for short scrambles). */
export const solve = (s: CubeState): Turn[] | null => solveTwoPhase(s.cube, 0, 60);
