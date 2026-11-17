/**
 * Word Rank agents. The climber reasons like a player who knows word meanings: it opens with a
 * common word, then keeps guessing the unguessed word closest in meaning to its best-ranked guess
 * (falling back to its next-best guesses), taking a hint when it stalls.
 */
import type { Rng } from '../../core/game-engine/random';
import { neighbours, type Vectors } from '../shared/semantic/semantic';
import { bestRank, type RankState } from './engine';

export type RankAction = `g:${number}` | 'hint' | 'give-up';

export function climberMove(v: Vectors, s: RankState, rng: Rng, useHints: boolean): RankAction {
  const guessed = new Set(s.guesses.map((g) => g.word));
  if (s.guesses.length === 0) return `g:${rng.int(1500) + 100}`;
  const byRank = [...s.guesses].sort((a, b) => a.rank - b.rank);
  if (useHints && s.guesses.length % 12 === 11 && bestRank(s) > 50) return 'hint';
  for (const g of byRank.slice(0, 5)) {
    const next = neighbours(v, g.word).find((w) => !guessed.has(w));
    if (next !== undefined) return `g:${next}`;
  }
  let w = rng.int(4000);
  while (guessed.has(w)) w = (w + 1) % v.words.length;
  return `g:${w}`;
}
