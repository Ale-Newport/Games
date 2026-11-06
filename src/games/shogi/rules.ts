/** Standard shogi on the shared shogi engine, plus achievement predicates. */
import type { ShogiState } from '../shared/shogi/game';
import { SHOGI } from '../shared/shogi/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = SHOGI;

/** Moves by `seat`, whether it promoted a rook, and whether its last move was a mating drop. */
export function feats(s: ShogiState, seat: 0 | 1) {
  const mine = s.notation.filter((_, i) => i % 2 === seat);
  const last = s.notation[s.notation.length - 1] ?? '';
  return {
    moves: mine.length,
    dragon: mine.some((n) => n.startsWith('R') && n.endsWith('+')),
    dropMate:
      s.result?.kind === 'win' &&
      s.result.reason === 'checkmate' &&
      s.result.winner === seat &&
      last.includes('*'),
  };
}
