/** Freestyle Gomoku on 15×15: the m,n,k engine with k = 5 (overlines win). */
import type { MnkRules, MnkState } from '../shared/mnk/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const GOMOKU: MnkRules = { rows: 15, cols: 15, k: 5 };

/** Stones the winner had on the board at the end. */
export function winnerStoneCount(s: MnkState): number {
  if (s.result?.kind !== 'win') return 0;
  const mark = s.result.winner === 0 ? 1 : 2;
  return s.board.filter((c) => c === mark).length;
}
