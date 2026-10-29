/**
 * 4×4 levels on the shared cube core (`../shared/cube`). Hints undo the scramble and the player's
 * turns (simplified): always a way back to solved, not the shortest one.
 */
import { parseMove, undoSequence, type Turn } from '../shared/cube/cube';
import type { CubeSpec, CubeState } from '../shared/cube/play';

export * from '../shared/cube/cube';
export * from '../shared/cube/play';

export const SPECS: Record<string, CubeSpec> = {
  easy: { size: 4, scramble: 3 },
  medium: { size: 4, scramble: 8 },
  full: { size: 4, scramble: 40 },
};

export const solve = (s: CubeState): Turn[] | null =>
  undoSequence([...s.scrambleMoves, ...s.moves].map((m) => parseMove(m)!));
