/**
 * Country Shape agents. The triangulator keeps every country whose distance and arrow from each
 * past guess match the clues shown, then guesses the candidate that best splits the rest. It reads
 * only the clues, never the silhouette.
 */
import type { Rng } from '../../core/game-engine/random';
import { centroidKm } from '../shared/world/world';
import { TARGETS, clue, type ShapeState } from './engine';

export function candidates(s: ShapeState): string[] {
  const clues = s.guesses.map((g) => clue(g, s.target));
  return TARGETS.filter(
    (c) =>
      !s.guesses.includes(c) &&
      clues.every((k) => {
        const mine = clue(k.iso2, c);
        return mine.km === k.km && mine.arrow === k.arrow;
      }),
  );
}

export function triangulatorMove(s: ShapeState, rng: Rng): string {
  if (s.guesses.length === 0) return rng.pick(['DE', 'EG', 'KZ', 'BR', 'US', 'IN', 'AU', 'TR']);
  const cands = candidates(s);
  if (cands.length <= 2) return cands[0] ?? rng.pick(TARGETS.filter((c) => !s.guesses.includes(c)));
  // Pick the candidate whose distances to the others are most spread out (best split).
  let best = cands[0]!;
  let bestSpread = -1;
  for (const c of cands.slice(0, 40)) {
    const ds = new Set(cands.map((o) => Math.round(centroidKm(c, o) / 100)));
    if (ds.size > bestSpread) {
      bestSpread = ds.size;
      best = c;
    }
  }
  return best;
}
