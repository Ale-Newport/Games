/** English checkers on the shared draughts engine, plus achievement predicates. */
import type { DraughtsState, Seat } from '../shared/draughts/engine';
import { draughtsFeats } from '../shared/draughts/feats';
import { ENGLISH } from '../shared/draughts/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = ENGLISH;

/** Whether `seat` (any seat when null) crowned a king / jumped three or more pieces in one move. */
export function feats(
  s: DraughtsState,
  seat: Seat | null,
): { crowned: boolean; tripleJump: boolean } {
  const f = draughtsFeats(VARIANT, s, seat);
  return { crowned: f.crowned, tripleJump: f.bestCapture >= 3 };
}
