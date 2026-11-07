/**
 * Backgammon position judgement for the computer players: a hand-weighted evaluation (race,
 * exposed blots counted by the rolls that hit them, made points and primes, anchors, the bar,
 * checkers off), a win chance derived from it for doubling decisions, and the greedy (one roll)
 * and expectimax (the opponent's 21 rolls and best replies) move choosers.
 */
import {
  ALL_ROLLS,
  allHome,
  legalPlays,
  mirror,
  opp,
  pips,
  rollWeight,
  type Play,
  type Position,
  type Side,
} from './engine';

/** Whether any checker of the two sides can still meet the other's. */
export function contact(pos: Position): boolean {
  // In side 0's numbering: side 0's rearmost checker against side 1's rearmost (25 − q).
  let back0 = pos.bar[0] ? 25 : 0;
  for (let p = 24; p >= 1 && !back0; p--) if (pos.board[0][p]) back0 = p;
  let back1 = pos.bar[1] ? 0 : 25;
  for (let q = 24; q >= 1 && back1 === 25; q--) if (pos.board[1][q]) back1 = mirror(q);
  return back0 > back1;
}

/** Of the 36 rolls, how many let `side`'s opponent hit at least one blot of `side` (ignoring blocks). */
export function shots(pos: Position, side: Side): number {
  const them = opp(side);
  const blots: number[] = [];
  for (let p = 1; p <= 24; p++) if (pos.board[side][p] === 1) blots.push(p);
  if (!blots.length) return 0;
  // Opponent checkers as distances: a checker of `them` on their point q stands on our 25 − q and
  // moves toward our higher numbers; it hits our blot at p from distance p − (25 − q).
  const sources: number[] = [];
  for (let q = 1; q <= 24; q++) if (pos.board[them][q]) sources.push(mirror(q));
  if (pos.bar[them]) sources.push(0);
  let n = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      const reachable = new Set([a, b, a + b]);
      if (a === b) [3 * a, 4 * a].forEach((x) => reachable.add(x));
      const hit = blots.some((p) => sources.some((s) => p > s && reachable.has(p - s)));
      if (hit) n++;
    }
  }
  return n;
}

/** Longest run of points (two or more checkers) a side holds. */
function prime(pos: Position, side: Side): number {
  let best = 0;
  let run = 0;
  for (let p = 1; p <= 24; p++) {
    if (pos.board[side][p]! >= 2) best = Math.max(best, ++run);
    else run = 0;
  }
  return best;
}

/** Evaluation from `side`'s point of view with the opponent to roll; higher is better. */
export function evaluate(pos: Position, side: Side): number {
  const them = opp(side);
  if (pos.off[side] === 15) return 1000;
  if (pos.off[them] === 15) return -1000;
  const race = pips(pos, them) - pips(pos, side);
  if (!contact(pos)) {
    // A pure race: pips, plus a bonus for checkers already off and a nudge against gaps.
    return race * 1.0 + (pos.off[side] - pos.off[them]) * 0.5;
  }
  let v = race * 0.45;
  v -= (shots(pos, side) / 36) * 18;
  v += (shots(pos, them) / 36) * 6;
  for (let p = 1; p <= 6; p++) if (pos.board[side][p]! >= 2) v += 2.2;
  for (let p = 1; p <= 6; p++) if (pos.board[them][p]! >= 2) v -= 2.2;
  for (let p = 7; p <= 11; p++) if (pos.board[side][p]! >= 2) v += 1.2;
  v += prime(pos, side) ** 2 * 0.6 - prime(pos, them) ** 2 * 0.6;
  for (let p = 19; p <= 24; p++) if (pos.board[side][p]! >= 2) v += 1.5;
  v += pos.bar[them] * 5 - pos.bar[side] * 5;
  v += (pos.off[side] - pos.off[them]) * 1.5;
  // Stacks of more than three checkers are clumsy.
  for (let p = 1; p <= 24; p++) v -= Math.max(0, pos.board[side][p]! - 3) * 0.6;
  if (allHome(pos, side)) v += 2;
  return v;
}

/** The chance `side` wins from `pos` with the opponent to roll, estimated from the evaluation. */
export function winChance(pos: Position, side: Side): number {
  const them = opp(side);
  if (!contact(pos)) {
    // Race: the leader's edge in pips relative to the race length (with the opponent on roll).
    const mine = pips(pos, side) + 4;
    const theirs = pips(pos, them);
    const lead = (theirs - mine) / Math.max(20, Math.sqrt(theirs + mine) * 2.6);
    return 1 / (1 + Math.exp(-lead * 2.2));
  }
  return 1 / (1 + Math.exp(-evaluate(pos, side) / 14));
}

/** The play with the best evaluation right after it. */
export function greedyPlay(plays: Play[], side: Side): Play {
  let best = plays[0]!;
  let score = -Infinity;
  for (const pl of plays) {
    const v = evaluate(pl.result, side);
    if (v > score) {
      score = v;
      best = pl;
    }
  }
  return best;
}

/**
 * Expectimax over one opponent roll: each candidate (the `width` best by evaluation) is scored by
 * the average, over the 21 rolls, of the position after the opponent's greedy reply.
 */
export function expectimaxPlay(plays: Play[], side: Side, width = 6): Play {
  if (plays.length === 1) return plays[0]!;
  const them = opp(side);
  const ranked = plays
    .map((pl) => ({ pl, v: evaluate(pl.result, side) }))
    .sort((x, y) => y.v - x.v)
    .slice(0, width);
  let best = ranked[0]!.pl;
  let score = -Infinity;
  for (const { pl } of ranked) {
    if (pl.result.off[side] === 15) return pl;
    let sum = 0;
    for (const roll of ALL_ROLLS) {
      const replies = legalPlays(pl.result, them, roll);
      const after = replies.length ? greedyPlay(replies, them).result : pl.result;
      // After the reply it is our roll: judge it from the opponent's side and negate.
      sum += rollWeight(roll) * -evaluate(after, them);
    }
    if (sum > score) {
      score = sum;
      best = pl;
    }
  }
  return best;
}

/** The chance `side` wins when it is about to roll. */
export const chanceOnRoll = (pos: Position, side: Side) => 1 - winChance(pos, opp(side));

/** Doubling window: strong enough to double, not so strong that playing on for a gammon is better. */
export const DOUBLE_FROM = 0.68;
export const DOUBLE_TO = 0.9;
/** A double is taken when the taker still wins at least this often. */
export const TAKE_FROM = 0.24;

export const shouldDouble = (pos: Position, side: Side) => {
  const p = chanceOnRoll(pos, side);
  return p >= DOUBLE_FROM && p <= DOUBLE_TO;
};

/** Whether `side` takes a double offered by the opponent (who is about to roll). */
export const shouldTake = (pos: Position, side: Side) =>
  1 - chanceOnRoll(pos, opp(side)) >= TAKE_FROM;
