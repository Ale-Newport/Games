/** Reversi 8×8 on the shared Reversi engine, plus achievement predicates. */
import {
  countDiscs,
  discOf,
  type ReversiRules,
  type ReversiState,
  type Seat,
} from '../shared/reversi/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const R8: ReversiRules = { size: 8 };

export const wipeout = (s: ReversiState, winner: Seat) => countDiscs(s.board)[1 - winner] === 0;

export function ownsAllCorners(s: ReversiState, seat: Seat, n = 8): boolean {
  const d = discOf(seat);
  return [0, n - 1, n * (n - 1), n * n - 1].every((i) => s.board[i] === d);
}
