/** Xiangqi rules (shared engine) plus achievement predicates. */
import type { XiangqiState } from '../shared/xiangqi/game';

export { RULES_VERSION, RULESET_ID } from './rules-meta';

/** Letter of the piece that made the last move ("C" cannon, "H" horse, …). */
export const lastMover = (s: XiangqiState) => s.notation[s.notation.length - 1]?.[0] ?? '';

/** Whether `seat` won by checkmate with a cannon or a horse move. */
export function feats(s: XiangqiState, seat: 0 | 1) {
  const mated =
    s.result?.kind === 'win' && s.result.reason === 'checkmate' && s.result.winner === seat;
  return { cannonMate: mated && lastMover(s) === 'C', horseMate: mated && lastMover(s) === 'H' };
}
