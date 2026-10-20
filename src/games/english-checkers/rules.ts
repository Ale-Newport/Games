/** English checkers on the shared draughts engine, plus achievement predicates. */
import {
  applyMove,
  initialState,
  isKing,
  type DraughtsState,
  type Seat,
} from '../shared/draughts/engine';
import { ENGLISH } from '../shared/draughts/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = ENGLISH;

/** Replays the game and reports whether `seat` (any seat when null) crowned a king / jumped 3+ at once. */
export function feats(
  s: DraughtsState,
  seat: Seat | null,
): { crowned: boolean; tripleJump: boolean } {
  let state = initialState(VARIANT);
  let crowned = false;
  let tripleJump = false;
  for (const move of s.history) {
    const mover = state.toMove;
    const before = state.board.filter((p) => p !== 0).length;
    const wasMan = !isKing(state.board[move[0]!]!);
    state = applyMove(VARIANT, state, move);
    if (seat !== null && mover !== seat) continue;
    if (wasMan && isKing(state.board[move[move.length - 1]!]!)) crowned = true;
    if (before - state.board.filter((p) => p !== 0).length >= 3) tripleJump = true;
  }
  return { crowned, tripleJump };
}
