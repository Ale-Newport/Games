/**
 * Senet judgement: an evaluation (progress, pieces off, lone pieces within reach of an opposing
 * piece behind them, pairs and blockades) and an expectiminimax search over the throws that
 * follows the extra throws of 1, 4 and 5.
 */
import {
  HAPPINESS,
  OFF,
  PIECES,
  THROW_ODDS,
  applyMove,
  extraThrow,
  legalMoves,
  opp,
  progress,
  type SenetMove,
  type SenetPosition,
  type Side,
} from './engine';

const mark = (s: Side) => s + 1;

/** Lone pieces of `side` an opposing piece 1–5 squares behind could swap back, weighted by square. */
function exposure(pos: SenetPosition, side: Side): number {
  const me = mark(side);
  const them = mark(opp(side));
  let v = 0;
  for (let sq = 2; sq < HAPPINESS; sq++) {
    if (pos.board[sq] !== me || pos.board[sq - 1] === me || pos.board[sq + 1] === me) continue;
    let p = 0;
    for (let d = 1; d <= 5 && sq - d >= 1; d++)
      if (pos.board[sq - d] === them) p = Math.max(p, THROW_ODDS[d]!);
    v += p * sq;
  }
  return v;
}

/** Pairs (protected pieces) and three-in-a-row blocks of `side`. */
function structure(pos: SenetPosition, side: Side): number {
  const me = mark(side);
  let v = 0;
  let run = 0;
  for (let sq = 1; sq <= HAPPINESS; sq++) {
    run = pos.board[sq] === me ? run + 1 : 0;
    if (run === 2) v += 1;
    if (run >= 3) v += 2;
  }
  return v;
}

export function evaluate(pos: SenetPosition, side: Side): number {
  const them = opp(side);
  if (pos.off[side] === PIECES) return 10_000;
  if (pos.off[them] === PIECES) return -10_000;
  let v = progress(pos, side) - progress(pos, them);
  v += (pos.off[side] - pos.off[them]) * 6;
  v -= exposure(pos, side) * 1.5;
  v += exposure(pos, them) * 1.5;
  v += (structure(pos, side) - structure(pos, them)) * 1.5;
  return v;
}

function chance(pos: SenetPosition, side: Side, root: Side, depth: number): number {
  if (depth === 0 || pos.off[0] === PIECES || pos.off[1] === PIECES) return evaluate(pos, root);
  let sum = 0;
  for (let roll = 1; roll <= 5; roll++) {
    const moves = legalMoves(pos, side, roll);
    let best: number;
    if (!moves.length) best = chance(pos, opp(side), root, depth - 1);
    else {
      best = side === root ? -Infinity : Infinity;
      const next = extraThrow(roll) ? side : opp(side);
      for (const m of moves) {
        const v = chance(applyMove(pos, side, m), next, root, depth - 1);
        best = side === root ? Math.max(best, v) : Math.min(best, v);
      }
    }
    sum += THROW_ODDS[roll]! * best;
  }
  return sum;
}

/** The move with the best expected value after the throw `roll`, searching `depth` more moves. */
export function bestMove(
  pos: SenetPosition,
  side: Side,
  roll: number,
  depth = 2,
): SenetMove | null {
  const moves = legalMoves(pos, side, roll);
  if (moves.length <= 1) return moves[0] ?? null;
  const next = extraThrow(roll) ? side : opp(side);
  let best = moves[0]!;
  let score = -Infinity;
  for (const m of moves) {
    const after = applyMove(pos, side, m);
    const v = after.off[side] === PIECES ? Infinity : chance(after, next, side, depth);
    if (v > score) {
      score = v;
      best = m;
    }
  }
  return best;
}

export function greedyMove(pos: SenetPosition, side: Side, roll: number): SenetMove | null {
  let best: SenetMove | null = null;
  let score = -Infinity;
  for (const m of legalMoves(pos, side, roll)) {
    const v = evaluate(applyMove(pos, side, m), side) + (m.to === OFF ? 1 : 0);
    if (v > score) {
      score = v;
      best = m;
    }
  }
  return best;
}
