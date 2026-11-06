/** Animal shogi 3×4 on the shared shogi engine, plus achievement predicates. */
import type { ShogiState } from '../shared/shogi/game';
import { ANIMAL } from '../shared/shogi/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = ANIMAL;

/** Moves by `seat` and whether it promoted a chick to a hen. */
export function feats(s: ShogiState, seat: 0 | 1) {
  const mine = s.notation.filter((_, i) => i % 2 === seat);
  return { moves: mine.length, hen: mine.some((n) => n.startsWith('C') && n.endsWith('+')) };
}
