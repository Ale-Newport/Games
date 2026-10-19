/**
 * Renju (ruleset `renju-rif-15x15`): Gomoku with RIF restrictions on Black. Built on the m,n,k
 * engine; legality adds the opening point and Black's forbidden points, and Black's winning line is
 * reported as its exact five.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import {
  createMnkState,
  isLegalCell,
  isValidMnkState,
  legalCells,
  other,
  playCell,
  type MnkRules,
  type MnkState,
} from '../shared/mnk/engine';
import type { TwoPlayerRules } from '../shared/two-player/match';
import { blackExactFive, isForbiddenForBlack } from './forbidden';

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const RENJU: MnkRules = { rows: 15, cols: 15, k: 5 };
export const SIZE = 15;
export const CENTER = 7 * SIZE + 7;

export function isLegalRenju(s: MnkState, i: number): boolean {
  if (!isLegalCell(RENJU, s, i)) return false;
  if (s.history.length === 0 && s.toMove === 0) return i === CENTER;
  if (s.toMove === 0 && isForbiddenForBlack(s.board, SIZE, i)) return false;
  return true;
}

export function legalRenju(s: MnkState): number[] {
  if (s.result) return [];
  if (s.history.length === 0 && s.toMove === 0) return [CENTER];
  const cells = legalCells(RENJU, s);
  return s.toMove === 0 ? cells.filter((i) => !isForbiddenForBlack(s.board, SIZE, i)) : cells;
}

export function playRenju(s: MnkState, i: number): MnkState {
  if (!isLegalRenju(s, i)) {
    throw new IllegalActionError(
      s.result
        ? 'The game is over'
        : s.toMove === 0 && isForbiddenForBlack(s.board, SIZE, i)
          ? `Point ${i} is forbidden for Black`
          : `Point ${i} is not playable`,
    );
  }
  const next = playCell(RENJU, s, i);
  if (next.result?.kind === 'win' && next.result.winner === 0) {
    const five = blackExactFive(next.board, SIZE, i);
    if (five) return { ...next, result: { ...next.result, line: five } };
  }
  return next;
}

export function replayRenju(history: readonly number[], firstPlayer: 0 | 1 = 0): MnkState {
  let s = createMnkState(RENJU, firstPlayer);
  for (const i of history) s = playRenju(s, i);
  return s;
}

export function isValidRenjuState(data: unknown): data is MnkState {
  if (!isValidMnkState(RENJU, data)) return false;
  try {
    return JSON.stringify(replayRenju(data.history, data.firstPlayer)) === JSON.stringify(data);
  } catch {
    return false;
  }
}

/** Two-player shell binding. Black (seat 0) always moves first; the shell fixes the first seat. */
export const RENJU_RULES: TwoPlayerRules<MnkState, number> = {
  create: (firstPlayer) => createMnkState(RENJU, firstPlayer),
  apply: playRenju,
  isLegal: isLegalRenju,
  undo: (s, plies) =>
    replayRenju(s.history.slice(0, Math.max(0, s.history.length - plies)), s.firstPlayer),
  toMove: (s) => s.toMove,
  plies: (s) => s.history.length,
  moverOfPly: (s, ply) => (ply % 2 === 0 ? s.firstPlayer : other(s.firstPlayer)),
  outcome: (s) => (s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null),
  validate: isValidRenjuState,
};
