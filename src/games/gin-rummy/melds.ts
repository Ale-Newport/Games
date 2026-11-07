/**
 * Gin rummy melds: sets (three or four cards of a rank) and runs (three or more consecutive cards
 * of a suit, ace low). `bestMelds` finds the arrangement with the least deadwood (the point total
 * of the cards left out: ace 1, number cards their value, face cards 10) by trying every way to
 * cover the hand with disjoint melds — at most ten cards, so the search is tiny.
 */
import { rankOf, suitOf } from '../shared/cards/cards';

export const cardValue = (c: number) => Math.min(10, rankOf(c));

/** Every meld (as a sorted card list) that can be formed from the hand. */
export function allMelds(hand: readonly number[]): number[][] {
  const out: number[][] = [];
  const byRank = new Map<number, number[]>();
  for (const c of hand) byRank.set(rankOf(c), [...(byRank.get(rankOf(c)) ?? []), c]);
  for (const cards of byRank.values()) {
    if (cards.length >= 3) {
      if (cards.length === 4) {
        out.push([...cards].sort((a, b) => a - b));
        for (let skip = 0; skip < 4; skip++)
          out.push(cards.filter((_, i) => i !== skip).sort((a, b) => a - b));
      } else out.push([...cards].sort((a, b) => a - b));
    }
  }
  for (let suit = 0; suit < 4; suit++) {
    const ranks = new Set(hand.filter((c) => suitOf(c) === suit).map(rankOf));
    for (let start = 1; start <= 11; start++)
      for (
        let end = start + 2;
        end <= 13 &&
        ranks.has(end) &&
        [...Array(end - start + 1).keys()].every((k) => ranks.has(start + k));
        end++
      )
        out.push([...Array(end - start + 1).keys()].map((k) => suit * 13 + start + k - 1));
  }
  return out;
}

export interface Arrangement {
  melds: number[][];
  deadwood: number[];
  points: number;
}

/** The melds that leave the least deadwood. */
export function bestMelds(hand: readonly number[]): Arrangement {
  const melds = allMelds(hand);
  let best: Arrangement = {
    melds: [],
    deadwood: [...hand],
    points: hand.reduce((a, c) => a + cardValue(c), 0),
  };
  const search = (from: number, used: Set<number>, chosen: number[][]) => {
    const deadwood = hand.filter((c) => !used.has(c));
    const points = deadwood.reduce((a, c) => a + cardValue(c), 0);
    if (points < best.points) best = { melds: chosen.map((m) => [...m]), deadwood, points };
    for (let i = from; i < melds.length; i++) {
      const m = melds[i]!;
      if (m.some((c) => used.has(c))) continue;
      for (const c of m) used.add(c);
      chosen.push(m);
      search(i + 1, used, chosen);
      chosen.pop();
      for (const c of m) used.delete(c);
    }
  };
  search(0, new Set(), []);
  return best;
}

export const deadwoodOf = (hand: readonly number[]) => bestMelds(hand).points;

/** Whether a card extends a meld (joins a set of its rank or either end of a run in its suit). */
export function extendsMeld(meld: readonly number[], card: number): boolean {
  const isSet = meld.every((c) => rankOf(c) === rankOf(meld[0]!));
  if (isSet) return meld.length < 4 && rankOf(card) === rankOf(meld[0]!);
  if (suitOf(card) !== suitOf(meld[0]!)) return false;
  const ranks = meld.map(rankOf);
  return rankOf(card) === Math.min(...ranks) - 1 || rankOf(card) === Math.max(...ranks) + 1;
}

/**
 * Lays off as many of the defender's deadwood cards as possible onto the knocker's melds (cards
 * that extend a meld, repeatedly), returning the cards laid off and the melds as extended.
 */
export function layOff(
  knockerMelds: readonly number[][],
  deadwood: readonly number[],
): { laid: number[]; melds: number[][] } {
  const melds = knockerMelds.map((m) => [...m]);
  const left = [...deadwood];
  const laid: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const card of [...left]) {
      const target = melds.find((m) => extendsMeld(m, card));
      if (target) {
        target.push(card);
        target.sort((a, b) => rankOf(a) - rankOf(b));
        left.splice(left.indexOf(card), 1);
        laid.push(card);
        changed = true;
      }
    }
  }
  return { laid, melds };
}
