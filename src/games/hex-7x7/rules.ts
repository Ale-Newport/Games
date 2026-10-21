/** Hex 7×7 (shared Hex engine) plus achievement predicates. */
import { SWAP, type HexState } from '../shared/hex/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const SIZE = 7;

/** Stones `seat` placed, and whether Blue used the swap. */
export function feats(s: HexState, seat: 0 | 1) {
  return {
    stones: s.history.filter((a, i) => i % 2 === seat && a !== SWAP).length,
    swapped: s.history[1] === SWAP,
  };
}
