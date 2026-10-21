/** Nine Men's Morris on the shared Morris engine, plus achievement predicates. */
import { NINE_MENS, type MorrisState } from '../shared/morris/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = NINE_MENS;

/** Mills closed by `seat` and its pieces left on the board. */
export function feats(s: MorrisState, seat: 0 | 1) {
  return {
    mills: s.history.filter((a, i) => i % 2 === seat && a.includes('x')).length,
    pieces: s.board.filter((x) => x === seat + 1).length,
  };
}
