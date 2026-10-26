/**
 * Helpers shared by the trick-taking games (#093 Hearts, #094 Spades, #095 Contract Bridge,
 * #098 Euchre): rank order (ace high), sorting a hand, following suit and the winner of a trick.
 * Seats go clockwise: 0 south (the player), 1 west, 2 north, 3 east.
 */
import { CLUBS, DIAMONDS, HEARTS, SPADES, rankOf, suitOf, type Suit } from '../cards/cards';

export { CLUBS, DIAMONDS, HEARTS, SPADES, suitOf, type Suit };

/** 2 … 14 (ace high). */
export const highRank = (c: number) => (rankOf(c) === 1 ? 14 : rankOf(c));

/** Display order of suits in a hand: spades, hearts, clubs, diamonds (alternating colours). */
const SUIT_ORDER: Record<Suit, number> = { 0: 0, 1: 1, 3: 2, 2: 3 };

export function sortHand(hand: readonly number[]): number[] {
  return [...hand].sort(
    (a, b) => SUIT_ORDER[suitOf(a)] - SUIT_ORDER[suitOf(b)] || highRank(b) - highRank(a),
  );
}

/** Cards that may be played: the led suit if the hand has it, otherwise anything. */
export function followSuit(hand: readonly number[], led: Suit | null): number[] {
  if (led === null) return [...hand];
  const same = hand.filter((c) => suitOf(c) === led);
  return same.length ? same : [...hand];
}

export interface Play {
  seat: number;
  card: number;
}

/** The winning play of a trick: the highest trump, else the highest card of the led suit. */
export function trickWinner(
  trick: readonly Play[],
  trump: Suit | null = null,
  rank: (c: number) => number = highRank,
): Play {
  const led = suitOf(trick[0]!.card);
  let best = trick[0]!;
  for (const p of trick.slice(1)) {
    const s = suitOf(p.card);
    const bs = suitOf(best.card);
    if (s === bs) {
      if (rank(p.card) > rank(best.card)) best = p;
    } else if (trump !== null && s === trump && bs !== trump) best = p;
    else if (s === led && bs !== led && bs !== trump) best = p;
  }
  return best;
}

export const nextSeat = (seat: number, n = 4) => (seat + 1) % n;
