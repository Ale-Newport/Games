/**
 * Immutable xiangqi game layer over `XiangqiPosition`: results (checkmate, stalemate loss,
 * threefold repetition with the perpetual-check loss, the no-capture limit, dead positions),
 * coordinate notation and replay validation. Actions are "h2e2" (from, to).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import {
  CANNON,
  CHARIOT,
  GENERAL,
  HORSE,
  SOLDIER,
  START_PLACEMENT,
  XiangqiPosition,
  moveAction,
  parsePlacement,
  squareName,
  type Side,
  type XMove,
} from './position';

export type XiangqiResult =
  | { kind: 'win'; winner: Side; reason: 'checkmate' | 'stalemate' | 'perpetual-check' }
  | { kind: 'draw'; reason: 'repetition' | 'no-capture' | 'no-attackers' };

export interface XiangqiState {
  board: number[];
  toMove: Side;
  history: string[];
  /** Coordinate notation with piece letters ("Ch2-e2", "Hh0xg2"). */
  notation: string[];
  /** Position keys after each ply (index 0 = start). */
  keys: number[];
  checks: boolean[];
  /** Plies since the last capture. */
  quiet: number;
  result: XiangqiResult | null;
}

/** Plies without a capture after which the game is drawn (60 moves each). */
export const NO_CAPTURE_LIMIT = 120;
const LETTER = ['', 'K', 'A', 'E', 'H', 'R', 'C', 'P'];

export function positionOf(s: XiangqiState): XiangqiPosition {
  const pos = new XiangqiPosition();
  pos.board = Int8Array.from(s.board);
  pos.side = s.toMove;
  pos.board.forEach((code, sq) => {
    if (Math.abs(code) === GENERAL) pos.generals[code > 0 ? 0 : 1] = sq;
  });
  pos.rehash();
  return pos;
}

export function createXiangqiState(placement = START_PLACEMENT): XiangqiState {
  const pos = parsePlacement(placement);
  return {
    board: Array.from(pos.board),
    toMove: 0,
    history: [],
    notation: [],
    keys: [pos.key()],
    checks: [],
    quiet: 0,
    result: null,
  };
}

export function legalActions(s: XiangqiState): string[] {
  if (s.result) return [];
  return positionOf(s).legalMoves().map(moveAction);
}

export function isLegalAction(s: XiangqiState, action: unknown): action is string {
  return typeof action === 'string' && legalActions(s).includes(action);
}

export function notationFor(m: XMove): string {
  return `${LETTER[Math.abs(m.piece)]}${squareName(m.from)}${m.captured ? 'x' : '-'}${squareName(m.to)}`;
}

/** Neither side has a piece that can ever cross the river to attack (only generals, advisors, elephants). */
function noAttackers(pos: XiangqiPosition): boolean {
  for (const code of pos.board) {
    const t = Math.abs(code);
    if (t === HORSE || t === CHARIOT || t === CANNON || t === SOLDIER) return false;
  }
  return true;
}

function advance(pos: XiangqiPosition, s: XiangqiState, action: string): XiangqiState {
  if (s.result) throw new IllegalActionError('The game is over');
  const move = pos.legalMoves().find((m) => moveAction(m) === action);
  if (!move) throw new IllegalActionError(`Move ${action} is not legal`);
  const mover = pos.side;
  pos.make(move);
  const opponent = pos.side;
  const givesCheck = pos.inCheck(opponent);
  const key = pos.key();
  const keys = [...s.keys, key];
  const checks = [...s.checks, givesCheck];
  const quiet = move.captured ? 0 : s.quiet + 1;
  let result: XiangqiResult | null = null;
  if (pos.legalMoves().length === 0) {
    // In xiangqi a player with no legal move loses, in check or not.
    result = { kind: 'win', winner: mover, reason: givesCheck ? 'checkmate' : 'stalemate' };
  } else {
    const first = keys.indexOf(key);
    if (keys.filter((k) => k === key).length >= 3) {
      result = { kind: 'draw', reason: 'repetition' };
      const span = checks.slice(first);
      const always = (o: Side) =>
        span.some((_, i) => (first + i) % 2 === o) &&
        span.every((c, i) => (first + i) % 2 !== o || c);
      if (always(mover) && !always(opponent))
        result = { kind: 'win', winner: opponent, reason: 'perpetual-check' };
      else if (always(opponent) && !always(mover))
        result = { kind: 'win', winner: mover, reason: 'perpetual-check' };
    } else if (quiet >= NO_CAPTURE_LIMIT) result = { kind: 'draw', reason: 'no-capture' };
    else if (move.captured && noAttackers(pos)) result = { kind: 'draw', reason: 'no-attackers' };
  }
  return {
    board: Array.from(pos.board),
    toMove: opponent,
    history: [...s.history, action],
    notation: [...s.notation, notationFor(move)],
    keys,
    checks,
    quiet,
    result,
  };
}

export function applyXiangqiAction(s: XiangqiState, action: string): XiangqiState {
  return advance(positionOf(s), s, action);
}

const replayCache: XiangqiState[] = [];

export function replayXiangqi(history: readonly string[]): XiangqiState {
  let cached: XiangqiState | null = null;
  for (const e of replayCache) {
    if (e.history.length > history.length) continue;
    if ((cached?.history.length ?? -1) >= e.history.length) continue;
    if (e.history.every((a, i) => a === history[i])) cached = e;
  }
  let s = cached ?? createXiangqiState();
  const pos = positionOf(s);
  for (let i = s.history.length; i < history.length; i++) s = advance(pos, s, history[i]!);
  replayCache.unshift(s);
  if (replayCache.length > 12) replayCache.pop();
  return s;
}

export function isValidXiangqiState(data: unknown): data is XiangqiState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayXiangqi(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
