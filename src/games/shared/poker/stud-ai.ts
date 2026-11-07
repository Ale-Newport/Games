/**
 * Seven Card Stud equity. Everyone's face-up cards are known, so they leave the deck; each opponent
 * still in is dealt its hidden cards (redrawn a few times when the hand looks too weak for the chips
 * it committed) and every hand is completed to seven cards before the best five are compared.
 */
import type { Rng } from '../../../core/game-engine/random';
import { isUpCard, upScore, type PokerState } from './engine';
import { bestScore, fiveCardPercentile } from './hands';

/** Rough strength in [0, 1) of a partial stud hand (three to seven cards). */
export function studStrength(cards: readonly number[]): number {
  if (cards.length >= 5) return fiveCardPercentile(bestScore(cards));
  const v = upScore(cards);
  const category = Math.floor(v / 15 ** 4);
  const top = Math.floor(v / 15 ** 3) % 15;
  if (category === 0) return (0.45 * (top - 2)) / 12;
  if (category === 1) return 0.6 + (0.25 * (top - 2)) / 12;
  return category === 2 ? 0.9 : category === 3 ? 0.97 : 0.999;
}

function deal(pool: number[], from: number, n: number, rng: Rng) {
  for (let i = from; i < from + n; i++) {
    const j = i + rng.int(pool.length - i);
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
}

export function studEquity(
  s: PokerState,
  seat: number,
  samples: number,
  rng: Rng,
  floors: readonly number[],
): number {
  const me = s.seats[seat]!;
  const opponents = s.seats.flatMap((x, i) => (i !== seat && !x.out && !x.folded ? [i] : []));
  const seen = new Set(me.hole);
  for (const o of opponents)
    s.seats[o]!.hole.forEach((c, k) => {
      if (isUpCard(k)) seen.add(c);
    });
  const pool: number[] = [];
  for (let c = 0; c < 52; c++) if (!seen.has(c)) pool.push(c);
  let total = 0;
  for (let k = 0; k < samples; k++) {
    let used = 0;
    const mine = me.hole.slice();
    const more = 7 - mine.length;
    deal(pool, used, more, rng);
    mine.push(...pool.slice(used, used + more));
    used += more;
    const myScore = bestScore(mine);
    let best = 0;
    let ties = 0;
    opponents.forEach((o, n) => {
      const hole = s.seats[o]!.hole;
      const up = hole.filter((_, j) => isUpCard(j));
      const hidden = hole.length - up.length;
      let hand: number[] = [];
      for (let attempt = 0; attempt < 12; attempt++) {
        deal(pool, used, hidden, rng);
        hand = [...up, ...pool.slice(used, used + hidden)];
        if (floors[n] === 0 || studStrength(hand) >= floors[n]!) break;
      }
      used += hidden;
      const rest = 7 - hand.length;
      deal(pool, used, rest, rng);
      hand.push(...pool.slice(used, used + rest));
      used += rest;
      const v = bestScore(hand);
      if (v > best) {
        best = v;
        ties = 0;
      }
      if (v === best) ties++;
    });
    if (myScore > best) total += 1;
    else if (myScore === best) total += 1 / (ties + 1);
  }
  return total / samples;
}
