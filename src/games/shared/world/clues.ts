/**
 * Distance clues shared by the country-guessing games (#209 Country Shape, #211 Flag Reveal):
 * centroid distance, a compass arrow towards the target and a proximity percentage, plus the set
 * of targets still consistent with the clues seen so far.
 */
import { arrowFor, bearing, centroidKm, centroidOf } from './world';

export const MAX_DISTANCE = 20000;

export interface Clue {
  iso2: string;
  km: number;
  /** Degrees clockwise from north, from the guess towards the target. */
  bearing: number;
  arrow: string;
  proximity: number;
}

export function clue(guess: string, target: string): Clue {
  const km = centroidKm(guess, target);
  const deg = guess === target ? 0 : bearing(centroidOf(guess), centroidOf(target));
  return {
    iso2: guess,
    km,
    bearing: deg,
    arrow: guess === target ? '🎉' : arrowFor(deg),
    proximity: guess === target ? 100 : Math.max(0, Math.floor((1 - km / MAX_DISTANCE) * 100)),
  };
}

/** Targets in `pool` that would have produced exactly these clues. */
export function consistentTargets(
  guesses: readonly string[],
  target: string,
  pool: readonly string[],
): string[] {
  const clues = guesses.map((g) => clue(g, target));
  return pool.filter(
    (c) =>
      !guesses.includes(c) &&
      clues.every((k) => {
        const mine = clue(k.iso2, c);
        return mine.km === k.km && mine.arrow === k.arrow;
      }),
  );
}

/** Of the candidates, the one whose distances to the others are most varied (best split). */
export function bestSplit(cands: readonly string[]): string | undefined {
  let best = cands[0];
  let spread = -1;
  for (const c of cands.slice(0, 40)) {
    const ds = new Set(cands.map((o) => Math.round(centroidKm(c, o) / 100)));
    if (ds.size > spread) {
      spread = ds.size;
      best = c;
    }
  }
  return best;
}
