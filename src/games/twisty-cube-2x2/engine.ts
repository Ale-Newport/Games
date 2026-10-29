/** 2×2 levels on the shared cube core (`../shared/cube`), solved optimally. */
import type { Turn } from '../shared/cube/cube';
import { solvePocket } from '../shared/cube/pocket';
import type { CubeSpec, CubeState } from '../shared/cube/play';

export * from '../shared/cube/cube';
export * from '../shared/cube/play';

export const SPECS: Record<string, CubeSpec> = {
  easy: { size: 2, scramble: 3 },
  medium: { size: 2, scramble: 6 },
  full: { size: 2, scramble: 25 },
};

export const solve = (s: CubeState): Turn[] | null => solvePocket(s.cube);
