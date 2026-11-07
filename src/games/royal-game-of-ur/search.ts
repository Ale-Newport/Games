/**
 * Royal Game of Ur judgement: an evaluation (progress, pieces off, pieces at risk on the shared
 * squares weighted by the chance of the throw that hits them, the middle rosette) and an
 * expectiminimax search over the throws, which follows the extra turns that rosettes give.
 */
import {
  END,
  SAFE,
  THROW_ODDS,
  applyMove,
  isShared,
  legalMoves,
  opp,
  progress,
  type Side,
  type UrMove,
  type UrPosition,
} from './engine';

/** Chance that a piece `d` squares ahead of an opposing piece is hit by its next throw. */
const hitChance = (d: number) => (d >= 1 && d <= 4 ? THROW_ODDS[d]! : 0);

/** Risk to `side`'s pieces on the shared squares: the summed chance of being hit next throw. */
function risk(pos: UrPosition, side: Side): number {
  const them = opp(side);
  let r = 0;
  for (let sq = 5; sq <= 12; sq++) {
    if (!pos.board[side][sq] || sq === SAFE) continue;
    let p = 0;
    for (let from = Math.max(1, sq - 4); from < sq; from++)
      if (pos.board[them][from]) p = Math.max(p, hitChance(sq - from));
    // Pieces still to enter threaten squares 1–4 only, which are private; nothing to add.
    r += p * sq;
  }
  return r;
}

/** Evaluation from `side`'s point of view; higher is better. */
export function evaluate(pos: UrPosition, side: Side): number {
  const them = opp(side);
  if (pos.off[side] === 7) return 10_000;
  if (pos.off[them] === 7) return -10_000;
  let v = progress(pos, side) - progress(pos, them);
  v += (pos.off[side] - pos.off[them]) * 4;
  v -= risk(pos, side) * 1.2;
  v += risk(pos, them) * 1.2;
  if (pos.board[side][SAFE]) v += 4;
  if (pos.board[them][SAFE]) v -= 4;
  return v;
}

/** Expected value for `root` with `side` about to throw, `depth` moves deep. */
function chance(pos: UrPosition, side: Side, root: Side, depth: number): number {
  if (depth === 0 || pos.off[0] === 7 || pos.off[1] === 7) return evaluate(pos, root);
  let sum = THROW_ODDS[0]! * chance(pos, opp(side), root, depth - 1);
  for (let roll = 1; roll <= 4; roll++) {
    const moves = legalMoves(pos, side, roll);
    let best: number;
    if (!moves.length) best = chance(pos, opp(side), root, depth - 1);
    else {
      best = side === root ? -Infinity : Infinity;
      for (const m of moves) {
        const v = chance(applyMove(pos, side, m), m.rosette ? side : opp(side), root, depth - 1);
        best = side === root ? Math.max(best, v) : Math.min(best, v);
      }
    }
    sum += THROW_ODDS[roll]! * best;
  }
  return sum;
}

/** The move with the best expected value after the throw `roll`, searching `depth` more moves. */
export function bestMove(pos: UrPosition, side: Side, roll: number, depth = 2): UrMove | null {
  const moves = legalMoves(pos, side, roll);
  if (moves.length <= 1) return moves[0] ?? null;
  let best = moves[0]!;
  let score = -Infinity;
  for (const m of moves) {
    const after = applyMove(pos, side, m);
    const v =
      after.off[side] === 7 ? Infinity : chance(after, m.rosette ? side : opp(side), side, depth);
    if (v > score) {
      score = v;
      best = m;
    }
  }
  return best;
}

/** The greedy choice: the move whose result evaluates best right away. */
export function greedyMove(pos: UrPosition, side: Side, roll: number): UrMove | null {
  const moves = legalMoves(pos, side, roll);
  let best: UrMove | null = null;
  let score = -Infinity;
  for (const m of moves) {
    const v =
      evaluate(applyMove(pos, side, m), side) + (m.rosette ? 6 : 0) + (m.to === END ? 1 : 0);
    if (v > score) {
      score = v;
      best = m;
    }
  }
  return best;
}

export { isShared };
