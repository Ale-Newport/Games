/**
 * Country Shape agents. The triangulator keeps every country whose distance and arrow from each
 * past guess match the clues shown, then guesses the candidate that best splits the rest. It reads
 * only the clues, never the silhouette.
 */
import type { Rng } from '../../core/game-engine/random';
import { bestSplit, consistentTargets } from '../shared/world/clues';
import { TARGETS, type ShapeState } from './engine';

export const candidates = (s: ShapeState) => consistentTargets(s.guesses, s.target, TARGETS);

export function triangulatorMove(s: ShapeState, rng: Rng): string {
  if (s.guesses.length === 0) return rng.pick(['DE', 'EG', 'KZ', 'BR', 'US', 'IN', 'AU', 'TR']);
  const cands = candidates(s);
  return (
    (cands.length <= 2 ? cands[0] : bestSplit(cands)) ??
    rng.pick(TARGETS.filter((c) => !s.guesses.includes(c)))
  );
}
