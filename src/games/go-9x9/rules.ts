/** Go 9×9 rules (shared Go engine) plus achievement predicates. */
import type { GoRules, GoState } from '../shared/go/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const RULES: GoRules = { size: 9, komi: 7.5, maxPlies: 243 };

/** Stones captured by `seat` and its winning margin (0 unless it won). */
export function feats(s: GoState, seat: 0 | 1) {
  const r = s.result;
  const margin = r && r.winner === seat ? Math.abs(r.score[0] - r.score[1]) : 0;
  return { captured: s.captures[seat], margin };
}
