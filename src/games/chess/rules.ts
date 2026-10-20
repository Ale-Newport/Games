/** Standard chess on the shared chess engine, plus achievement predicates. */
import { sideToMove, type ChessState } from '../shared/chess/game';
import { STANDARD } from '../shared/chess/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = STANDARD;

/** Moves played by `seat` and whether it promoted a pawn this game. */
export function feats(s: ChessState, seat: 0 | 1): { moves: number; promoted: boolean } {
  const first = sideToMove({ ...s, fen: s.startFen });
  const mine = s.san.filter((_, i) => (i % 2 === 0 ? first : 1 - first) === seat);
  return { moves: mine.length, promoted: mine.some((san) => san.includes('=')) };
}
