/**
 * Yoté on a 5 × 6 board. Each player starts with 12 pieces in hand; light (seat 0) moves first.
 * A turn is one of: place a piece from hand on any empty square; step a piece on the board one
 * square orthogonally to an empty square; or capture by jumping orthogonally over an adjacent
 * enemy piece into the empty square beyond. After a capture the capturer also removes one more
 * enemy piece of their choice — from the board, or from the hand if none is on the board (the
 * bonus removal, a separate action by the same player).
 *
 * A player who has lost every piece (board and hand) or has no legal move loses. When both sides
 * are down to three pieces or fewer, or after threefold repetition or 200 plies, the game is a
 * draw.
 *
 * Actions: "+p" (place), "f-t" (step or jump), "xq" (bonus removal of the piece on q), "xh"
 * (bonus removal from the hand). Squares are row·6 + col, row 0 at the top.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const ROWS = 5;
export const COLS = 6;
export const HAND = 12;
export const PLY_LIMIT = 200;

export interface YoteState {
  /** 0 empty, 1 = seat 0, 2 = seat 1. */
  board: number[];
  hands: [number, number];
  toMove: 0 | 1;
  /** Set right after a capture: the capturer still owes a bonus removal. */
  bonus: boolean;
  movers: (0 | 1)[];
  history: string[];
  keys: string[];
  result: {
    winner: 0 | 1 | null;
    reason: 'wiped' | 'stuck' | 'few' | 'repetition' | 'limit';
  } | null;
}

const keyOf = (s: Pick<YoteState, 'board' | 'hands' | 'toMove'>) =>
  `${s.board.join('')}|${s.hands.join(',')}|${s.toMove}`;

export function createYoteState(): YoteState {
  const s: YoteState = {
    board: new Array<number>(ROWS * COLS).fill(0),
    hands: [HAND, HAND],
    toMove: 0,
    bonus: false,
    movers: [],
    history: [],
    keys: [],
    result: null,
  };
  s.keys = [keyOf(s)];
  return s;
}

export const neighbors = (p: number): [number, number][] => {
  const r = Math.floor(p / COLS);
  const c = p % COLS;
  const out: [number, number][] = [];
  if (r > 0) out.push([p - COLS, r > 1 ? p - 2 * COLS : -1]);
  if (r < ROWS - 1) out.push([p + COLS, r < ROWS - 2 ? p + 2 * COLS : -1]);
  if (c > 0) out.push([p - 1, c > 1 ? p - 2 : -1]);
  if (c < COLS - 1) out.push([p + 1, c < COLS - 2 ? p + 2 : -1]);
  return out;
};

const total = (s: Pick<YoteState, 'board' | 'hands'>, seat: 0 | 1) =>
  s.hands[seat] + s.board.filter((x) => x === seat + 1).length;

function movesFor(s: Pick<YoteState, 'board' | 'hands' | 'bonus'>, seat: 0 | 1): string[] {
  const me = seat + 1;
  const out: string[] = [];
  if (s.bonus) {
    const enemy = s.board.flatMap((x, p) => (x === 3 - me ? [`x${p}`] : []));
    if (enemy.length) return enemy;
    return s.hands[1 - seat]! > 0 ? ['xh'] : [];
  }
  s.board.forEach((x, p) => {
    if (x === 0 && s.hands[seat] > 0) out.push(`+${p}`);
    if (x !== me) return;
    for (const [n, beyond] of neighbors(p)) {
      if (s.board[n] === 0) out.push(`${p}-${n}`);
      else if (s.board[n] === 3 - me && beyond >= 0 && s.board[beyond] === 0)
        out.push(`${p}-${beyond}`);
    }
  });
  return out;
}

export function legalYoteActions(s: YoteState): string[] {
  return s.result ? [] : movesFor(s, s.toMove);
}

export function applyYoteAction(s: YoteState, a: string): YoteState {
  if (s.result || !legalYoteActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove;
  const board = s.board.slice();
  const hands: [number, number] = [...s.hands];
  let captured = false;
  if (a === 'xh') hands[1 - me]!--;
  else if (a.startsWith('x')) board[Number(a.slice(1))] = 0;
  else if (a.startsWith('+')) {
    board[Number(a.slice(1))] = me + 1;
    hands[me]--;
  } else {
    const [from, to] = a.split('-').map(Number) as [number, number];
    board[to] = board[from]!;
    board[from] = 0;
    const between =
      Math.abs(to - from) === 2 || Math.abs(to - from) === 2 * COLS ? (from + to) / 2 : -1;
    if (between >= 0) {
      board[between] = 0;
      captured = true;
    }
  }
  const movers = [...s.movers, me];
  const history = [...s.history, a];
  const pending = captured && movesFor({ board, hands, bonus: true }, me).length > 0;
  if (pending) return { ...s, board, hands, bonus: true, movers, history };
  const toMove = (1 - me) as 0 | 1;
  const base = { board, hands, toMove };
  const keys = [...s.keys, keyOf(base)];
  const next: YoteState = { ...base, bonus: false, movers, history, keys, result: null };
  if (total(next, toMove) === 0) next.result = { winner: me, reason: 'wiped' };
  else if (movesFor(next, toMove).length === 0) next.result = { winner: me, reason: 'stuck' };
  else if (total(next, 0) <= 3 && total(next, 1) <= 3)
    next.result = { winner: null, reason: 'few' };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    next.result = { winner: null, reason: 'repetition' };
  else if (history.length >= PLY_LIMIT) next.result = { winner: null, reason: 'limit' };
  return next;
}

export function replayYote(history: readonly string[]): YoteState {
  return history.reduce((s, a) => applyYoteAction(s, a), createYoteState());
}

export function isValidYoteState(data: unknown): data is YoteState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayYote(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
