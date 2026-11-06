/** Reversi 6×6 on the shared Reversi engine. */
import {
  countDiscs,
  type ReversiRules,
  type ReversiState,
  type Seat,
} from '../shared/reversi/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const R6: ReversiRules = { size: 6 };
export const wipeout = (s: ReversiState, winner: Seat) => countDiscs(s.board)[1 - winner] === 0;
