/**
 * Word Warmth agent: a hill climber over meaning. It guesses the unguessed nearest neighbours of
 * its warmest guesses (by the scores it has seen), restarting from a common word when stuck.
 */
import type { Rng } from '../../core/game-engine/random';
import { neighbours, type Vectors } from '../shared/semantic/semantic';
import type { WarmState } from './engine';

export type WarmAction = `g:${number}` | 'give-up';

export function warmerMove(v: Vectors, s: WarmState, rng: Rng): WarmAction {
  const guessed = new Set(s.guesses.map((g) => g.word));
  if (s.guesses.length === 0) return `g:${rng.int(1500) + 100}`;
  const warmest = [...s.guesses].sort((a, b) => b.score - a.score);
  for (const g of warmest.slice(0, 5)) {
    const next = neighbours(v, g.word).find((w) => !guessed.has(w));
    if (next !== undefined) return `g:${next}`;
  }
  let w = rng.int(4000);
  while (guessed.has(w)) w = (w + 1) % v.words.length;
  return `g:${w}`;
}
