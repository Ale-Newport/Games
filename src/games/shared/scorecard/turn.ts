/**
 * The five-dice turn optimizer shared by the scorecard dice games (Five Dice, Generala): a turn is
 * up to three rolls with any dice kept between them, then a category is scored. Given the value of
 * scoring each available category with each final hand, it works out exactly, by expectation over
 * the rerolls, which dice to keep after each roll and which category to take at the end.
 *
 * Hands are multisets of five dice, written as counts per face; there are 252 of them.
 */
export type Counts = [number, number, number, number, number, number];

export const countsOf = (dice: readonly number[]): Counts => {
  const c: Counts = [0, 0, 0, 0, 0, 0];
  for (const d of dice) c[d - 1]!++;
  return c;
};

const key = (c: readonly number[]) => c.join('');

/** All multisets of n dice, with their probability when n fair dice are rolled. */
const outcomeCache = new Map<number, { counts: Counts; p: number }[]>();
export function outcomes(n: number): { counts: Counts; p: number }[] {
  const hit = outcomeCache.get(n);
  if (hit) return hit;
  const out: { counts: Counts; p: number }[] = [];
  const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
  const rec = (face: number, left: number, c: number[]) => {
    if (face === 5) {
      const counts = [...c, left] as Counts;
      const ways = fact(n) / counts.reduce((m, k) => m * fact(k), 1);
      out.push({ counts, p: ways / 6 ** n });
      return;
    }
    for (let k = 0; k <= left; k++) rec(face + 1, left - k, [...c, k]);
  };
  rec(0, n, []);
  outcomeCache.set(n, out);
  return out;
}

/** Every sub-multiset of a hand (the dice that can be kept). */
export function keeps(hand: Counts): Counts[] {
  const out: Counts[] = [];
  const rec = (face: number, c: number[]) => {
    if (face === 6) {
      out.push(c as Counts);
      return;
    }
    for (let k = 0; k <= hand[face]!; k++) rec(face + 1, [...c, k]);
  };
  rec(0, []);
  return out;
}

const add = (a: Counts, b: Counts): Counts => a.map((x, i) => x + b[i]!) as Counts;
const size = (c: readonly number[]) => c.reduce((a, b) => a + b, 0);

export interface TurnPlan {
  /** Value of the best play from a hand with r rerolls left. */
  value: (hand: Counts, rerolls: number) => number;
  /** The best dice to keep from a hand with r ≥ 1 rerolls left. */
  bestKeep: (hand: Counts, rerolls: number) => Counts;
  /** Whether standing now (scoring this hand) is at least as good as rerolling. */
  shouldStand: (hand: Counts, rerolls: number) => boolean;
}

/**
 * Plans a turn given `final(hand, rerollsLeft)`: the value of scoring the best category with a hand,
 * standing with that many rerolls unused (Generala pays more for hands made on the first roll).
 * Values are memoized per hand and rerolls left.
 */
export function planTurn(final: (hand: Counts, rerollsLeft: number) => number): TurnPlan {
  const memo = new Map<string, number>();
  const keepMemo = new Map<string, number>();
  const value = (hand: Counts, rerolls: number): number => {
    const k = `${key(hand)}:${rerolls}`;
    const hit = memo.get(k);
    if (hit !== undefined) return hit;
    let v = final(hand, rerolls);
    if (rerolls > 0) for (const kept of keeps(hand)) v = Math.max(v, keepValue(kept, rerolls));
    memo.set(k, v);
    return v;
  };
  /** Expected value of keeping `kept` and rerolling the rest. */
  const keepValue = (kept: Counts, rerolls: number): number => {
    const k = `${key(kept)}:${rerolls}`;
    const hit = keepMemo.get(k);
    if (hit !== undefined) return hit;
    let v = 0;
    for (const o of outcomes(5 - size(kept))) v += o.p * value(add(kept, o.counts), rerolls - 1);
    keepMemo.set(k, v);
    return v;
  };
  const bestKeep = (hand: Counts, rerolls: number): Counts => {
    let best = hand;
    let score = -Infinity;
    for (const kept of keeps(hand)) {
      const v = keepValue(kept, rerolls);
      // Prefer keeping more dice on ties (fewer pointless rerolls).
      if (v > score + 1e-9 || (Math.abs(v - score) <= 1e-9 && size(kept) > size(best))) {
        score = v;
        best = kept;
      }
    }
    return best;
  };
  const shouldStand = (hand: Counts, rerolls: number) =>
    rerolls === 0 || final(hand, rerolls) >= value(hand, rerolls) - 1e-9;
  return { value, bestKeep, shouldStand };
}
