/** Tic-Tac-Toe 3×3 (ruleset `classic-3x3`): the m,n,k engine with m = n = k = 3. */
import {
  completingCells,
  createMnkState,
  isLegalCell,
  isValidMnkState,
  legalCells,
  playCell,
  stateFromHistory,
  undoMoves,
  type MnkRules,
  type MnkState,
  type Seat,
} from '../shared/mnk/engine';

export type { Cell, MnkResult, Seat } from '../shared/mnk/engine';
export type TttState = MnkState;

export { RULES_VERSION, RULESET_ID } from './rules-meta';
export const TTT: MnkRules = { rows: 3, cols: 3, k: 3 };

export const newRound = (firstPlayer: Seat = 0): TttState => createMnkState(TTT, firstPlayer);
export const legalMoves = (s: TttState) => legalCells(TTT, s);
export const isLegal = (s: TttState, cell: number) => isLegalCell(TTT, s, cell);
export const play = (s: TttState, cell: number) => playCell(TTT, s, cell);
export const replay = (history: readonly number[], firstPlayer: Seat = 0) =>
  stateFromHistory(TTT, history, firstPlayer);
export const undo = (s: TttState, count: number) => undoMoves(TTT, s, count);
export const threats = (s: TttState, seat: Seat) => completingCells(TTT, s, seat);
export const isValidState = (data: unknown): data is TttState => isValidMnkState(TTT, data);

/** True when `winner`'s winning move was set up by a fork (two completing cells at once). */
export function wonByFork(s: TttState): boolean {
  if (s.result?.kind !== 'win') return false;
  const winner = s.result.winner;
  const n = s.history.length;
  if (n < 3) return false;
  const afterSetup = replay(s.history.slice(0, n - 2), s.firstPlayer);
  return threats(afterSetup, winner).length >= 2;
}

/** Number of marks the winner had on the board when the round ended. */
export function winnerMarkCount(s: TttState): number {
  if (s.result?.kind !== 'win') return 0;
  const mark = s.result.winner === 0 ? 1 : 2;
  return s.board.filter((c) => c === mark).length;
}
