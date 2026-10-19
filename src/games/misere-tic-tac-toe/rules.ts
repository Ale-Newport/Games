/** Misère Tic-Tac-Toe (ruleset `misere-3x3`): completing a line of three loses. */
import {
  completingCells,
  legalCells,
  stateFromHistory,
  type MnkRules,
  type MnkState,
} from '../shared/mnk/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const MISERE: MnkRules = { rows: 3, cols: 3, k: 3, misere: true };

/** The loser's final move was forced: every empty cell would have completed one of their lines. */
export function lostByForcedMove(s: MnkState): boolean {
  if (s.result?.kind !== 'win' || s.result.reason !== 'misere-line') return false;
  const before = stateFromHistory(MISERE, s.history.slice(0, -1), s.firstPlayer);
  const loser = before.toMove;
  const empty = legalCells(MISERE, before);
  return empty.length > 0 && completingCells(MISERE, before, loser).length === empty.length;
}
