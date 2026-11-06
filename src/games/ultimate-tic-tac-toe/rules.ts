/** Ultimate Tic-Tac-Toe rules binding for the two-player shell, plus achievement predicates. */
import type { TwoPlayerRules } from '../shared/two-player/match';
import {
  boardsWon,
  createState,
  isLegal,
  isValidState,
  other,
  play,
  replay,
  undo,
  type UtttState,
} from './engine';

export const UTTT_RULES: TwoPlayerRules<UtttState, number> = {
  create: (firstPlayer) => createState(firstPlayer),
  apply: play,
  isLegal,
  undo,
  toMove: (s) => s.toMove,
  plies: (s) => s.history.length,
  moverOfPly: (s, ply) => (ply % 2 === 0 ? s.firstPlayer : other(s.firstPlayer)),
  outcome: (s) => (s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null),
  validate: isValidState,
};

export function wonOnGlobalDiagonal(s: UtttState): boolean {
  if (s.result?.kind !== 'win') return false;
  const line = s.result.line.join(',');
  return line === '0,4,8' || line === '2,4,6';
}

/** The winner trailed in captured boards at some point during the game. */
export function wonFromBehind(s: UtttState): boolean {
  if (s.result?.kind !== 'win') return false;
  const winner = s.result.winner;
  for (let n = 1; n <= s.history.length; n++) {
    const won = boardsWon(replay(s.history.slice(0, n), s.firstPlayer));
    if (won[1 - winner]! > won[winner]!) return true;
  }
  return false;
}
