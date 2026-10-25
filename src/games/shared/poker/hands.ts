/**
 * Poker hand evaluation. A five-card hand scores as one comparable number: its category (high card
 * … straight flush) times 15^5 plus its ranks in order of importance (ace high = 14; the wheel A-2-3-
 * 4-5 is a five-high straight). Larger hands (seven for Hold'em) score their best five; Omaha hands
 * must use exactly two hole cards and three board cards.
 */
import { rankOf, suitOf } from '../cards/cards';

export const CATEGORIES = [
  'high-card',
  'pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
] as const;
export type Category = (typeof CATEGORIES)[number];

const BASE = 15;
/** Ace high. */
export const pokerRank = (c: number) => (rankOf(c) === 1 ? 14 : rankOf(c));

function pack(category: number, ranks: readonly number[]): number {
  let v = category;
  for (let i = 0; i < 5; i++) v = v * BASE + (ranks[i] ?? 0);
  return v;
}

/** Score of exactly five cards. */
export function score5(cards: readonly number[]): number {
  const ranks = cards.map(pokerRank).sort((a, b) => b - a);
  const flush = cards.every((c) => suitOf(c) === suitOf(cards[0]!));
  const unique = [...new Set(ranks)];
  let straightHigh = 0;
  if (unique.length === 5) {
    if (ranks[0]! - ranks[4]! === 4) straightHigh = ranks[0]!;
    else if (ranks[0] === 14 && ranks[1] === 5) straightHigh = 5; // the wheel
  }
  if (straightHigh && flush) return pack(8, [straightHigh]);
  // Group ranks by count, then by rank.
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const order = groups.map(([r]) => r);
  const shape = groups.map(([, n]) => n).join('');
  if (shape === '41') return pack(7, order);
  if (shape === '32') return pack(6, order);
  if (flush) return pack(5, ranks);
  if (straightHigh) return pack(4, [straightHigh]);
  if (shape === '311') return pack(3, order);
  if (shape === '221') return pack(2, order);
  if (shape === '2111') return pack(1, order);
  return pack(0, ranks);
}

/** Best five-card score from any number of cards (5–7). */
export function bestScore(cards: readonly number[]): number {
  const n = cards.length;
  if (n === 5) return score5(cards);
  let best = 0;
  const pick: number[] = [];
  const rec = (start: number) => {
    if (pick.length === 5) {
      const v = score5(pick);
      if (v > best) best = v;
      return;
    }
    for (let i = start; i <= n - (5 - pick.length); i++) {
      pick.push(cards[i]!);
      rec(i + 1);
      pick.pop();
    }
  };
  rec(0);
  return best;
}

/** Omaha: exactly two of the four hole cards with exactly three of the board. */
export function omahaScore(hole: readonly number[], board: readonly number[]): number {
  let best = 0;
  for (let a = 0; a < hole.length; a++)
    for (let b = a + 1; b < hole.length; b++)
      for (let x = 0; x < board.length; x++)
        for (let y = x + 1; y < board.length; y++)
          for (let z = y + 1; z < board.length; z++) {
            const v = score5([hole[a]!, hole[b]!, board[x]!, board[y]!, board[z]!]);
            if (v > best) best = v;
          }
  return best;
}

export const categoryOf = (score: number): Category => CATEGORIES[Math.floor(score / BASE ** 5)]!;
