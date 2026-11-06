/** Tic-Tac-Toe 4×4 (ruleset `four-in-a-row-4x4`): the m,n,k engine with m = n = k = 4. */
import {
  completingCells,
  stateFromHistory,
  type MnkRules,
  type MnkState,
} from '../shared/mnk/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const T4: MnkRules = { rows: 4, cols: 4, k: 4 };

/** True when the winner's last move was set up by a double threat (two completing cells at once). */
export function wonByDoubleThreat(s: MnkState): boolean {
  if (s.result?.kind !== 'win') return false;
  const n = s.history.length;
  if (n < 3) return false;
  const afterSetup = stateFromHistory(T4, s.history.slice(0, n - 2), s.firstPlayer);
  return completingCells(T4, afterSetup, s.result.winner).length >= 2;
}

export const MAIN_DIAGONAL = [0, 5, 10, 15];
export const ANTI_DIAGONAL = [3, 6, 9, 12];

export function wonOnDiagonal(s: MnkState): boolean {
  if (s.result?.kind !== 'win') return false;
  const line = s.result.line.join(',');
  return line === MAIN_DIAGONAL.join(',') || line === ANTI_DIAGONAL.join(',');
}
