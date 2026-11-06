/** Antichess (losing chess) on the shared chess engine, plus achievement predicates. */
import { sideToMove, type ChessState } from '../shared/chess/game';
import { ANTICHESS } from '../shared/chess/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = ANTICHESS;

/** Whether `seat` promoted a pawn to a king, and whether the game was won with pieces left. */
export function feats(s: ChessState, seat: 0 | 1): { kingPromotion: boolean; blockedWin: boolean } {
  const first = sideToMove({ ...s, fen: s.startFen });
  const mine = s.history.filter((_, i) => (i % 2 === 0 ? first : 1 - first) === seat);
  const placement = s.fen.split(' ')[0]!;
  const own = seat === 0 ? /[PNBRQK]/ : /[pnbrqk]/;
  return {
    kingPromotion: mine.some((a) => a.length === 5 && a.endsWith('k')),
    blockedWin: s.result?.kind === 'win' && s.result.winner === seat && own.test(placement),
  };
}
