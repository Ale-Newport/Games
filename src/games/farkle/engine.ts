/**
 * Farkle: a push-your-luck dice game for 1–4 players, first to 10 000. A turn rolls six dice; the
 * player must set aside at least one scoring combination and may then bank the turn's points or
 * roll the dice left. A roll with nothing to score is a farkle: the turn's points are lost. When
 * all six dice have scored ("hot dice") the player may roll all six again. A player's first bank
 * must be worth at least 500.
 *
 * Scoring (dice set aside together): a single 1 is 100 and a single 5 is 50; three of a kind is
 * 100 × the face (1000 for 1s); four, five and six of a kind are 1000, 2000 and 3000; a straight
 * 1–6 is 1500; three pairs are 1500; two triplets are 2500; four of a kind with a pair is 1500.
 */
export type Counts = [number, number, number, number, number, number];

export const TARGET = 10_000;
export const OPENING = 500;

export const countsOf = (dice: readonly number[]): Counts => {
  const c: Counts = [0, 0, 0, 0, 0, 0];
  for (const d of dice) c[d - 1]!++;
  return c;
};
const size = (c: readonly number[]) => c.reduce((a, b) => a + b, 0);

/** The best score of a set of dice where every die must score, or 0 when some die does not. */
export function scoreSet(c: Counts): number {
  const n = size(c);
  if (n === 0) return 0;
  const memo = new Map<string, number>();
  const best = (k: Counts): number => {
    if (size(k) === 0) return 0;
    const key = k.join('');
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let v = -Infinity;
    // Six-dice patterns.
    if (size(k) === 6) {
      if (k.every((x) => x === 1)) v = Math.max(v, 1500);
      if (k.filter((x) => x === 2).length === 3) v = Math.max(v, 1500);
      if (k.filter((x) => x === 3).length === 2) v = Math.max(v, 2500);
      if (k.includes(4) && k.includes(2)) v = Math.max(v, 1500);
    }
    for (let f = 0; f < 6; f++) {
      const m = k[f]!;
      for (const [need, pts] of [
        [6, 3000],
        [5, 2000],
        [4, 1000],
        [3, f === 0 ? 1000 : (f + 1) * 100],
      ] as const) {
        if (m >= need) {
          const rest = [...k] as Counts;
          rest[f] = m - need;
          v = Math.max(v, pts + best(rest));
        }
      }
      if (m >= 1 && (f === 0 || f === 4)) {
        const rest = [...k] as Counts;
        rest[f] = m - 1;
        v = Math.max(v, (f === 0 ? 100 : 50) + best(rest));
      }
    }
    memo.set(key, v);
    return v;
  };
  const v = best(c);
  return v === -Infinity ? 0 : v;
}

/** Whether a roll has anything that scores. */
export const canScore = (roll: Counts) =>
  roll[0]! > 0 ||
  roll[4]! > 0 ||
  roll.some((x) => x >= 3) ||
  (size(roll) === 6 && (roll.every((x) => x === 1) || roll.filter((x) => x === 2).length === 3));

const choiceCache = new Map<string, { keep: Counts; points: number }[]>();
/** Every scoring choice from a roll: sub-multisets in which every die scores, with their points. */
export function scoringChoices(roll: Counts): { keep: Counts; points: number }[] {
  const cacheKey = roll.join('');
  const hit = choiceCache.get(cacheKey);
  if (hit) return hit;
  const out: { keep: Counts; points: number }[] = [];
  const rec = (face: number, c: number[]) => {
    if (face === 6) {
      const keep = c as Counts;
      if (size(keep) > 0) {
        const points = scoreSet(keep);
        if (points > 0) out.push({ keep, points });
      }
      return;
    }
    for (let k = 0; k <= roll[face]!; k++) rec(face + 1, [...c, k]);
  };
  rec(0, []);
  choiceCache.set(cacheKey, out);
  return out;
}

/** All multisets of n dice with their probabilities. */
const outcomeCache = new Map<number, { counts: Counts; p: number }[]>();
export function outcomes(n: number): { counts: Counts; p: number }[] {
  const hit = outcomeCache.get(n);
  if (hit) return hit;
  const out: { counts: Counts; p: number }[] = [];
  const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
  const rec = (face: number, left: number, c: number[]) => {
    if (face === 5) {
      const counts = [...c, left] as Counts;
      out.push({ counts, p: fact(n) / counts.reduce((m, k) => m * fact(k), 1) / 6 ** n });
      return;
    }
    for (let k = 0; k <= left; k++) rec(face + 1, left - k, [...c, k]);
  };
  rec(0, n, []);
  outcomeCache.set(n, out);
  return out;
}

/**
 * The expected final value of a turn, by dynamic programming over (dice to roll, points so far) in
 * steps of 50 up to a cap: banking is worth the points; rolling is the average over the roll of the
 * best scoring choice (or 0 on a farkle). Above the cap the turn banks. Returns the policy tables.
 */
export function turnTables(cap = 3000) {
  const steps = cap / 50 + 1;
  // value[n][t]: expected bank from rolling n dice (1–6) with t×50 points at stake, playing well.
  const value = Array.from({ length: 7 }, () => new Float64Array(steps));
  const roll = Array.from({ length: 7 }, () => new Float64Array(steps));
  const at = (n: number, points: number) => {
    const t = Math.min(steps - 1, Math.round(points / 50));
    // Past the cap, bank.
    return points / 50 > steps - 1 ? points : value[n === 0 ? 6 : n]![t]!;
  };
  // Points only grow within a turn, so one pass from the highest stake down settles every state.
  for (let t = steps - 1; t >= 0; t--) {
    const stake = t * 50;
    for (let n = 1; n <= 6; n++) {
      let r = 0;
      for (const o of outcomes(n)) {
        let best = 0;
        for (const ch of scoringChoices(o.counts)) {
          const left = n - size(ch.keep);
          best = Math.max(best, stake + ch.points, at(left, stake + ch.points));
        }
        r += o.p * best;
      }
      roll[n]![t] = r;
      value[n]![t] = Math.max(stake, r);
    }
  }
  return { value, roll, steps };
}
