import { START_FEN, STANDARD_RULES } from './fen';
import type { ChessVariant } from './game';

export const STANDARD: ChessVariant = {
  id: 'standard',
  rules: STANDARD_RULES,
  goal: 'checkmate',
  start: { fen: START_FEN },
};
export const CHESS960: ChessVariant = {
  id: 'chess960',
  rules: STANDARD_RULES,
  goal: 'checkmate',
  start: { chess960: true },
};
export const ANTICHESS: ChessVariant = {
  id: 'antichess',
  rules: { width: 8, height: 8, doublePush: true, castling: false, antichess: true },
  goal: 'antichess',
  start: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1' },
};
export const KING_OF_THE_HILL: ChessVariant = {
  id: 'king-of-the-hill',
  rules: STANDARD_RULES,
  goal: 'king-of-the-hill',
  start: { fen: START_FEN },
};
export const THREE_CHECK: ChessVariant = {
  id: 'three-check',
  rules: STANDARD_RULES,
  goal: 'three-check',
  start: { fen: START_FEN },
};
export const GARDNER: ChessVariant = {
  id: 'gardner',
  rules: { width: 5, height: 5, doublePush: false, castling: false, antichess: false },
  goal: 'checkmate',
  start: { fen: 'rnbqk/ppppp/5/PPPPP/RNBQK w - - 0 1' },
};
