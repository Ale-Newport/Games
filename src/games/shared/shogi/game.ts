/**
 * Immutable shogi-family game layer over `ShogiPosition`: results (checkmate, capture of the
 * royal piece, try, repetition with the perpetual-check rule, move limit), Western notation and
 * replay validation. Actions are USI-style strings ("7g7f", "8h2b+", "P*5e").
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import {
  moveAction,
  parsePlacement,
  squareName,
  ShogiPosition,
  type Owner,
  type ShogiMove,
} from './position';
import type { ShogiVariant } from './variants';

export type ShogiResult =
  | {
      kind: 'win';
      winner: Owner;
      reason: 'checkmate' | 'no-moves' | 'capture' | 'try' | 'perpetual-check';
    }
  | { kind: 'draw'; reason: 'repetition' | 'move-limit' };

export interface ShogiState {
  /** Signed kind codes, row 0 at the top (Gote's side). */
  board: number[];
  /** Pieces in hand per owner, indexed by kind. */
  hands: [number[], number[]];
  toMove: Owner;
  history: string[];
  /** Western notation of each move ("P-7f", "Bx2b+", "P*5e", "N-3c="). */
  notation: string[];
  /** Position keys after each ply (index 0 = start), for repetition. */
  keys: number[];
  /** Whether each ply gave check. */
  checks: boolean[];
  result: ShogiResult | null;
}

export function positionOf(v: ShogiVariant, s: ShogiState): ShogiPosition {
  const pos = new ShogiPosition(v);
  pos.board = Int8Array.from(s.board);
  pos.hands = [Int8Array.from(s.hands[0]), Int8Array.from(s.hands[1])];
  pos.side = s.toMove;
  pos.board.forEach((code, sq) => {
    if (code !== 0 && v.kinds[Math.abs(code)]!.royal) pos.kings[code > 0 ? 0 : 1] = sq;
  });
  pos.rehash();
  return pos;
}

function snapshot(pos: ShogiPosition): Pick<ShogiState, 'board' | 'hands' | 'toMove'> {
  return {
    board: Array.from(pos.board),
    hands: [Array.from(pos.hands[0]), Array.from(pos.hands[1])],
    toMove: pos.side,
  };
}

export function createShogiState(v: ShogiVariant): ShogiState {
  const pos = parsePlacement(v, v.start);
  return {
    ...snapshot(pos),
    history: [],
    notation: [],
    keys: [pos.key()],
    checks: [],
    result: null,
  };
}

export function legalActions(v: ShogiVariant, s: ShogiState): string[] {
  if (s.result) return [];
  const pos = positionOf(v, s);
  return pos.legalMoves().map((m) => moveAction(pos, m));
}

export function isLegalAction(v: ShogiVariant, s: ShogiState, action: unknown): action is string {
  return typeof action === 'string' && legalActions(v, s).includes(action);
}

/** Western notation; `legal` are the legal moves of `pos` (for disambiguation). */
export function notationFor(pos: ShogiPosition, m: ShogiMove, legal: ShogiMove[]): string {
  const v = pos.v;
  const letter = v.kinds[m.kind]!.letter;
  const to = squareName(v, m.to);
  if (m.from < 0) return `${letter}*${to}`;
  const rivals = legal.some(
    (o) =>
      o.from >= 0 && o.from !== m.from && o.to === m.to && pos.board[o.from] === pos.board[m.from],
  );
  const origin = rivals ? squareName(v, m.from) : '';
  const canPromote =
    v.kinds[m.kind]!.promotesTo > 0 &&
    legal.some((o) => o.from === m.from && o.to === m.to && o.promote);
  const declined = canPromote && !m.promote && v.optionalPromotion;
  return `${letter}${origin}${m.captured ? 'x' : '-'}${to}${m.promote ? '+' : declined ? '=' : ''}`;
}

/** Plays `action` on `pos` (mutated) and returns the next state. */
function advance(v: ShogiVariant, pos: ShogiPosition, s: ShogiState, action: string): ShogiState {
  if (s.result) throw new IllegalActionError('The game is over');
  const before = pos.legalMoves();
  const move = before.find((m) => moveAction(pos, m) === action);
  if (!move) throw new IllegalActionError(`Move ${action} is not legal`);
  const mover = pos.side;
  const notation = notationFor(pos, move, before);
  pos.make(move);
  const opponent = pos.side;
  const givesCheck = pos.inCheck(opponent);
  const key = pos.key();
  const keys = [...s.keys, key];
  const checks = [...s.checks, givesCheck];
  const plies = s.history.length + 1;
  let result: ShogiResult | null = null;
  const onFarRow = (o: Owner) =>
    pos.kings[o] >= 0 && pos.farDistance(Math.floor(pos.kings[o] / pos.cols), o) === 0;

  if (move.captured !== 0 && v.kinds[Math.abs(move.captured)]!.royal) {
    result = { kind: 'win', winner: mover, reason: 'capture' };
  } else if (v.tryRule && onFarRow(mover) && !pos.isAttacked(pos.kings[mover], opponent)) {
    result = { kind: 'win', winner: mover, reason: 'try' };
  } else if (v.tryRule && onFarRow(opponent)) {
    // The opponent's royal piece reached the far row last turn and was not captured.
    result = { kind: 'win', winner: opponent, reason: 'try' };
  } else if (v.goal === 'checkmate' ? pos.legalMoves().length === 0 : !pos.hasLegalMove()) {
    result = { kind: 'win', winner: mover, reason: givesCheck ? 'checkmate' : 'no-moves' };
  }
  if (!result) {
    const first = keys.indexOf(key);
    const count = keys.filter((k) => k === key).length;
    if (count >= v.repetitionLimit) {
      result = { kind: 'draw', reason: 'repetition' };
      if (v.perpetualCheckLoses) {
        // Plies first..plies-1 form the cycle; ply j was played by Sente when j is even.
        const span = checks.slice(first);
        const allChecks = (o: Owner) =>
          span.every((c, i) => (first + i) % 2 !== o || c) &&
          span.some((_, i) => (first + i) % 2 === o);
        if (allChecks(mover)) result = { kind: 'win', winner: opponent, reason: 'perpetual-check' };
        else if (allChecks(opponent))
          result = { kind: 'win', winner: mover, reason: 'perpetual-check' };
      }
    } else if (plies >= v.maxPlies) result = { kind: 'draw', reason: 'move-limit' };
  }
  return {
    ...snapshot(pos),
    history: [...s.history, action],
    notation: [...s.notation, notation],
    keys,
    checks,
    result,
  };
}

export function applyShogiAction(v: ShogiVariant, s: ShogiState, action: string): ShogiState {
  return advance(v, positionOf(v, s), s, action);
}

/** Recent replays, so that validating consecutive states of one game stays linear. */
const replayCache: { variant: string; state: ShogiState }[] = [];

export function replayShogi(v: ShogiVariant, history: readonly string[]): ShogiState {
  let cached: ShogiState | null = null;
  for (const e of replayCache) {
    const h = e.state.history;
    if (e.variant !== v.id || h.length > history.length) continue;
    if ((cached?.history.length ?? -1) >= h.length) continue;
    if (h.every((a, i) => a === history[i])) cached = e.state;
  }
  let s = cached ?? createShogiState(v);
  const pos = positionOf(v, s);
  for (let i = s.history.length; i < history.length; i++) s = advance(v, pos, s, history[i]!);
  replayCache.unshift({ variant: v.id, state: s });
  if (replayCache.length > 12) replayCache.pop();
  return s;
}

export function isValidShogiState(v: ShogiVariant, data: unknown): data is ShogiState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayShogi(v, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}

/** Plies played by `seat` (Sente always moves first). */
export const pliesBy = (s: ShogiState, seat: Owner) =>
  s.history.filter((_, i) => i % 2 === seat).length;
