/** Four in a Row (ruleset `four-in-a-row-7x6`) on the shared gravity engine. */
import type { GravityRules, GravityState } from '../shared/gravity/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const C4: GravityRules = { rows: 6, cols: 7, k: 4 };

export function wonDiagonally(s: GravityState): boolean {
  if (s.result?.kind !== 'win') return false;
  const [a, b] = s.result.line;
  const step = b! - a!;
  return step === C4.cols + 1 || step === C4.cols - 1;
}
