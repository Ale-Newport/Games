/**
 * Cribbage scoring. Card values for counting: ace 1, number cards their value, face cards 10.
 *
 * - **Pegging** (during play): 2 for making the count 15 or 31; 2, 6 or 12 for a pair, three or four
 *   of a kind at the end of the pile; a run of three or more among the last cards (in any order)
 *   scores its length.
 * - **The show**: every combination of cards totalling 15 scores 2; every pair 2; every run its
 *   length (counted once per combination, so a double run of three is 8 with its pair); a flush of
 *   the four hand cards 4 (5 with the starter; the crib only scores a five-card flush); the jack of
 *   the starter's suit in the hand ("nobs") 1.
 */
import { rankOf, suitOf } from '../shared/cards/cards';

export const pipValue = (c: number) => Math.min(10, rankOf(c));

/** Points for the card just added to the pile (which is the play since the last reset). */
export function pegPoints(pile: readonly number[]): number {
  const count = pile.reduce((a, c) => a + pipValue(c), 0);
  let pts = 0;
  if (count === 15) pts += 2;
  if (count === 31) pts += 2;
  // Pairs at the end of the pile.
  const last = rankOf(pile[pile.length - 1]!);
  let same = 1;
  for (let k = pile.length - 2; k >= 0 && rankOf(pile[k]!) === last; k--) same++;
  pts += same === 2 ? 2 : same === 3 ? 6 : same === 4 ? 12 : 0;
  // The longest run among the last cards.
  for (let n = pile.length; n >= 3; n--) {
    const ranks = pile
      .slice(-n)
      .map(rankOf)
      .sort((a, b) => a - b);
    if (ranks.every((r, i) => i === 0 || r === ranks[i - 1]! + 1)) {
      pts += n;
      break;
    }
  }
  return pts;
}

export interface ShowBreakdown {
  fifteens: number;
  pairs: number;
  runs: number;
  flush: number;
  nobs: number;
  total: number;
}

/** Scores four cards with the starter. */
export function scoreShow(hand: readonly number[], starter: number, crib = false): ShowBreakdown {
  const all = [...hand, starter];
  let fifteens = 0;
  for (let mask = 1; mask < 1 << all.length; mask++) {
    let sum = 0;
    for (let i = 0; i < all.length; i++) if (mask & (1 << i)) sum += pipValue(all[i]!);
    if (sum === 15) fifteens += 2;
  }
  let pairs = 0;
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) if (rankOf(all[i]!) === rankOf(all[j]!)) pairs += 2;
  // Runs: maximal sequences of consecutive ranks, times the ways to pick one card of each rank.
  const counts = new Map<number, number>();
  for (const c of all) counts.set(rankOf(c), (counts.get(rankOf(c)) ?? 0) + 1);
  let runs = 0;
  for (let start = 1; start <= 13; start++) {
    if (!counts.has(start) || counts.has(start - 1)) continue;
    let len = 0;
    let ways = 1;
    while (counts.has(start + len)) {
      ways *= counts.get(start + len)!;
      len++;
    }
    if (len >= 3) runs += len * ways;
  }
  let flush = 0;
  const suit = suitOf(hand[0]!);
  if (hand.every((c) => suitOf(c) === suit)) {
    if (suitOf(starter) === suit) flush = 5;
    else if (!crib) flush = 4;
  }
  const nobs = hand.some((c) => rankOf(c) === 11 && suitOf(c) === suitOf(starter)) ? 1 : 0;
  return { fifteens, pairs, runs, flush, nobs, total: fifteens + pairs + runs + flush + nobs };
}
