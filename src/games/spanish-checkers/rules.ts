/** Spanish checkers on the shared draughts engine, plus achievement predicates. */
import {
  applyMove,
  initialState,
  isKing,
  type DraughtsState,
  type Seat,
} from '../shared/draughts/engine';
import { SPANISH } from '../shared/draughts/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = SPANISH;

/** Whether `seat` (anyone when null) captured an enemy king at some point in the game. */
export function capturedAKing(s: DraughtsState, seat: Seat | null): boolean {
  let state = initialState(VARIANT);
  for (const move of s.history) {
    const mover = state.toMove;
    const kingsBefore = state.board.filter((p) => isKing(p) && (p === 2 ? 0 : 1) !== mover).length;
    state = applyMove(VARIANT, state, move);
    const kingsAfter = state.board.filter((p) => isKing(p) && (p === 2 ? 0 : 1) !== mover).length;
    if ((seat === null || mover === seat) && kingsAfter < kingsBefore) return true;
  }
  return false;
}
