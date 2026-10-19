/** Two-player shell binding for Pente plus achievement predicates. */
import type { TwoPlayerRules } from '../shared/two-player/match';
import {
  createState,
  isLegal,
  isValidState,
  other,
  play,
  undo,
  type PenteState,
  type Seat,
} from './engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';

export const PENTE_RULES: TwoPlayerRules<PenteState, number> = {
  create: createState,
  apply: play,
  isLegal,
  undo,
  toMove: (s) => s.toMove,
  plies: (s) => s.history.length,
  moverOfPly: (s, ply) => (ply % 2 === 0 ? s.firstPlayer : other(s.firstPlayer)),
  outcome: (s) => (s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null),
  validate: isValidState,
};

export const wonByCaptures = (s: PenteState) =>
  s.result?.kind === 'win' && s.result.reason === 'captures';
/** Whether `seat` (or anyone, when null) captured two or more pairs with a single move this game. */
export function hadDoubleCapture(s: PenteState, seat: Seat | null): boolean {
  let state = createState(s.firstPlayer);
  for (const i of s.history) {
    const mover = state.toMove;
    state = play(state, i);
    if (state.lastCaptured.length >= 4 && (seat === null || mover === seat)) return true;
  }
  return false;
}
