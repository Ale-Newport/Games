/** Chess960 (Fischer random chess) on the shared chess engine, plus achievement predicates. */
import { chess960Number, sideToMove, type ChessState } from '../shared/chess/game';
import { CHESS960 } from '../shared/chess/variants';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const VARIANT = CHESS960;

/** Start position number (0–959; 518 is the classical setup). */
export const startNumber = (s: ChessState) => chess960Number(s.startFen) ?? -1;

/** Uniformly random start position for a new round. */
export const randomStart = () => Math.floor(Math.random() * 960);

/** Whether `seat` castled during the game. */
export function castled(s: ChessState, seat: 0 | 1): boolean {
  const first = sideToMove({ ...s, fen: s.startFen });
  return s.history.some(
    (a, i) => a.startsWith('O-O') && (i % 2 === 0 ? first : 1 - first) === seat,
  );
}
