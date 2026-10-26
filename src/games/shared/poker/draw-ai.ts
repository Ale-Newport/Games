/**
 * Five Card Draw decisions. Discards: a simple rule (keep pairs and better, made hands, four to a
 * flush or a straight, otherwise the two highest cards) or a Monte Carlo choice among the 26 ways to
 * draw up to three, scoring each by how often its final hand beats the opponents' sampled hands. Equity: the
 * opponents are dealt hands consistent with how many cards they drew (a random hand whose simple
 * discard matches their draw, then refilled), and, reading ranges, as strong as their betting.
 */
import type { Rng } from '../../../core/game-engine/random';
import { suitOf } from '../cards/cards';
import { drawOptions, type PokerState } from './engine';
import { CATEGORIES, categoryOf, fiveCardPercentile, pokerRank, score5 } from './hands';

/** Positions to throw away by the simple rule (at most three). */
export function simpleDiscard(hole: readonly number[]): number[] {
  const cat = CATEGORIES.indexOf(categoryOf(score5(hole)));
  if (cat >= 4) return [];
  const ranks = hole.map(pokerRank);
  const count = (r: number) => ranks.filter((x) => x === r).length;
  if (cat >= 1) return hole.flatMap((_, k) => (count(ranks[k]!) >= 2 ? [] : [k]));
  for (let st = 0; st < 4; st++) {
    const off = hole.flatMap((c, k) => (suitOf(c) === st ? [] : [k]));
    if (off.length === 1) return off;
  }
  // Four to a straight (aces may play low).
  for (let low = 1; low <= 11; low++) {
    const want = [low, low + 1, low + 2, low + 3].map((r) => (r === 1 ? 14 : r));
    const keep = new Set<number>();
    for (const r of want) {
      const k = ranks.indexOf(r);
      if (k >= 0) keep.add(k);
    }
    if (keep.size === 4) return [0, 1, 2, 3, 4].filter((k) => !keep.has(k));
  }
  // Keep the two highest cards.
  const order = [0, 1, 2, 3, 4].sort((a, b) => ranks[a]! - ranks[b]!);
  return order.slice(0, 3).sort((a, b) => a - b);
}

/** Cards nobody at the table has shown to this seat: the deck minus its own hand. */
function unknownTo(hole: readonly number[]): number[] {
  const known = new Set(hole);
  const out: number[] = [];
  for (let c = 0; c < 52; c++) if (!known.has(c)) out.push(c);
  return out;
}

/** Moves `n` random cards to positions `from…from+n` of the pool (a partial Fisher–Yates step). */
function deal(pool: number[], from: number, n: number, rng: Rng) {
  for (let i = from; i < from + n; i++) {
    const j = i + rng.int(pool.length - i);
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
}

/**
 * One sample of the opponents' final hands: each is dealt a hand that fits the number of cards they
 * drew (or will draw by the simple rule) and the strength of their betting, then refilled. Deals
 * from `pool` after position `used`; returns the best score, how many share it, and the new `used`.
 */
function opponentsBest(
  s: PokerState,
  opponents: readonly number[],
  floors: readonly number[],
  pool: number[],
  used: number,
  rng: Rng,
): { best: number; ties: number; used: number } {
  let best = 0;
  let ties = 0;
  opponents.forEach((o, n) => {
    const drew = s.seats[o]!.drew;
    let theirs: number[] = [];
    let discard: number[] = [];
    for (let attempt = 0; attempt < 16; attempt++) {
      deal(pool, used, 5, rng);
      theirs = pool.slice(used, used + 5);
      discard = simpleDiscard(theirs);
      const fits = drew < 0 || discard.length === drew;
      if (fits && (floors[n] === 0 || fiveCardPercentile(score5(theirs)) >= floors[n]!)) break;
    }
    used += 5;
    const refill = drew < 0 ? discard.length : Math.min(discard.length, drew);
    deal(pool, used, refill, rng);
    discard.slice(0, refill).forEach((p, j) => (theirs[p] = pool[used + j]!));
    used += refill;
    const v = score5(theirs);
    if (v > best) {
      best = v;
      ties = 0;
    }
    if (v === best) ties++;
  });
  return { best, ties, used };
}

const contenders = (s: PokerState, seat: number) =>
  s.seats.flatMap((x, i) => (i !== seat && !x.out && !x.folded ? [i] : []));

/**
 * Monte Carlo choice of the discard: the "draw:…" action whose final hand most often beats the
 * opponents' sampled final hands. Every option is scored on the same samples (common random
 * numbers), so the comparison is not swamped by noise.
 */
export function bestDiscard(
  s: PokerState,
  seat: number,
  samples: number,
  rng: Rng,
  floors: readonly number[] = [],
): string {
  const hole = s.seats[seat]!.hole;
  const opponents = contenders(s, seat);
  const options = drawOptions(hole.length).map((o) => o.slice(5).split('').map(Number));
  const value = options.map(() => 0);
  const pool = unknownTo(hole);
  for (let k = 0; k < samples; k++) {
    deal(pool, 0, 3, rng);
    const { best, ties } = opponentsBest(
      s,
      opponents,
      opponents.map((_, n) => floors[n] ?? 0),
      pool,
      3,
      rng,
    );
    options.forEach((picked, j) => {
      const hand = hole.slice();
      picked.forEach((p, m) => (hand[p] = pool[m]!));
      const v = score5(hand);
      value[j]! += v > best ? 1 : v === best ? 1 / (ties + 1) : 0;
    });
  }
  let pick = 0;
  value.forEach((v, j) => {
    if (v > value[pick]!) pick = j;
  });
  return `draw:${options[pick]!.join('')}`;
}

/**
 * Share of the pot this seat's hand wins. Before the draw its own hand is improved by `plan` (the
 * discard it intends); the opponents' hands are sampled as in `bestDiscard`.
 */
export function drawEquity(
  s: PokerState,
  seat: number,
  samples: number,
  rng: Rng,
  floors: readonly number[],
  plan: string,
): number {
  const me = s.seats[seat]!;
  const opponents = contenders(s, seat);
  const pool = unknownTo(me.hole);
  const mine = plan.slice(5).split('').map(Number);
  let total = 0;
  for (let k = 0; k < samples; k++) {
    const hand = me.hole.slice();
    deal(pool, 0, mine.length, rng);
    mine.forEach((p, j) => (hand[p] = pool[j]!));
    const myScore = score5(hand);
    const { best, ties } = opponentsBest(s, opponents, floors, pool, mine.length, rng);
    if (myScore > best) total += 1;
    else if (myScore === best) total += 1 / (ties + 1);
  }
  return total / samples;
}
