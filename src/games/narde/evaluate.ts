/**
 * Narde judgement for the computer players: a hand-weighted evaluation (race, blocks standing in
 * front of the opponent's checkers, points held, a penalty for tall stacks; weights tuned by
 * greedy-against-greedy matches) and the greedy and expectimax (the opponent's 21 rolls and greedy
 * replies) choosers.
 */
import {
  ALL_ROLLS,
  HEAD,
  across,
  legalPlays,
  opp,
  pips,
  rollWeight,
  type Play,
  type Position,
  type Side,
} from './engine';

/**
 * Points of `side` that stand in front of the opponent: in the opponent's numbering, below at least
 * one of its checkers (the opponent still has to get past them). Runs count more than their length.
 */
function blocking(pos: Position, side: Side): number {
  const them = opp(side);
  let rear = 0;
  for (let q = 24; q >= 1 && !rear; q--) if (pos.board[them][q]) rear = q;
  let v = 0;
  let run = 0;
  for (let q = 24; q >= 1; q--) {
    const mine = pos.board[side][across(q)]! > 0 && q < rear;
    if (mine) {
      run++;
      v += 1 + run * 0.4;
    } else run = 0;
  }
  return v;
}

/** Evaluation from `side`'s point of view with the opponent to roll; higher is better. */
export function evaluate(pos: Position, side: Side): number {
  const them = opp(side);
  if (pos.off[side] === 15) return 1000;
  if (pos.off[them] === 15) return -1000;
  let v = (pips(pos, them) - pips(pos, side)) * 0.6;
  v += (blocking(pos, side) - blocking(pos, them)) * 3;
  // Development: points held outside the head, and not too many on any one point.
  for (let p = 1; p < HEAD; p++) {
    const n = pos.board[side][p]!;
    if (n) v += 0.8;
    v -= Math.max(0, n - 3) * 2.5;
    const m = pos.board[them][p]!;
    if (m) v -= 0.8;
    v += Math.max(0, m - 3) * 2.5;
  }
  v += (pos.off[side] - pos.off[them]) * 2;
  return v;
}

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

/** Each of the `width` best plays judged by the average over the opponent's 21 rolls and greedy replies. */
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
      const replies = legalPlays(pl.result, them, roll, false);
      const after = replies.length ? greedyPlay(replies, them).result : pl.result;
      sum += rollWeight(roll) * -evaluate(after, them);
    }
    if (sum > score) {
      score = sum;
      best = pl;
    }
  }
  return best;
}
