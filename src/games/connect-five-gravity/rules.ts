/** Connect Five Gravity (ruleset `connect-five-9x7`) on the shared gravity engine. */
import type { GravityRules, GravityState } from '../shared/gravity/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const C5: GravityRules = { rows: 7, cols: 9, k: 5 };

export function wonDiagonally(s: GravityState): boolean {
  if (s.result?.kind !== 'win') return false;
  const [a, b] = s.result.line;
  const step = b! - a!;
  return step === C5.cols + 1 || step === C5.cols - 1;
}

export const winningRunLength = (s: GravityState): number =>
  s.result?.kind === 'win' ? s.result.line.length : 0;
