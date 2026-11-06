/**
 * Hunt games on a board of points joined by lines (catalog #057 Fox and Geese, #058 Bagh-Chal).
 * Seat 0 is the prey (geese / goats, many pieces, moves first), seat 1 the hunters (the fox /
 * four tigers). Pieces move one step along a line to an empty point. Hunters capture by jumping
 * over an adjacent prey piece along a straight line into the empty point beyond (the fox may chain
 * several jumps; tigers jump once). Prey never capture.
 *
 * Variant options: prey that may not step backward (geese), prey that start in hand and are first
 * placed one per turn (goats), diagonal lines on some points, the number of captures that wins for
 * the hunters. The prey win when no hunter can move. A side with no legal move loses; threefold
 * repetition or the ply limit is a draw — or, where the prey could stall forever (geese moving
 * sideways), a win for the hunters.
 *
 * Actions: "f-t" (step or jump; a chained fox jump is a further "f-t" by the same player), "+p"
 * (place a prey piece on point p), "stop" (end a fox's jump chain). Points are row·size + col.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export interface HuntVariant {
  id: string;
  size: number;
  /** Points that exist on the board. */
  points: readonly number[];
  /** Whether diagonal lines run through a point. */
  diagonal: (r: number, c: number) => boolean;
  hunters: readonly number[];
  prey: readonly number[];
  /** Prey pieces placed during play instead of starting on the board. */
  preyInHand: number;
  /** Prey may not step to a lower-index row (they advance down the board). */
  preyNoBackward: boolean;
  multiJump: boolean;
  /** Captures that win for the hunters. */
  huntersWinAt: number;
  plyLimit: number;
  /** Who a threefold repetition or the ply limit favors: nobody, or the hunters (the prey failed). */
  stalled: 'draw' | 'hunters';
}

const crossPoint = (r: number, c: number) => !((r < 2 || r > 4) && (c < 2 || c > 4));

export const FOX_AND_GEESE: HuntVariant = {
  id: 'fox-and-geese',
  size: 7,
  points: Array.from({ length: 49 }, (_, p) => p).filter((p) =>
    crossPoint(Math.floor(p / 7), p % 7),
  ),
  diagonal: () => false,
  hunters: [24],
  prey: [2, 3, 4, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
  preyInHand: 0,
  preyNoBackward: true,
  multiJump: true,
  huntersWinAt: 8,
  plyLimit: 250,
  // The geese can shuffle sideways forever; if they cannot close the trap, the fox has escaped.
  stalled: 'hunters',
};

export const BAGH_CHAL: HuntVariant = {
  id: 'bagh-chal',
  size: 5,
  points: Array.from({ length: 25 }, (_, p) => p),
  diagonal: (r, c) => (r + c) % 2 === 0,
  hunters: [0, 4, 20, 24],
  prey: [],
  preyInHand: 20,
  preyNoBackward: false,
  multiJump: false,
  huntersWinAt: 5,
  plyLimit: 300,
  stalled: 'draw',
};

export interface HuntState {
  /** 0 empty, 1 prey, 2 hunter, −1 off the board. */
  board: number[];
  inHand: number;
  captured: number;
  toMove: 0 | 1;
  /** The fox's position while it may continue a jump chain. */
  chain: number | null;
  movers: (0 | 1)[];
  history: string[];
  keys: string[];
  result: {
    winner: 0 | 1 | null;
    reason: 'trapped' | 'captures' | 'stuck' | 'repetition' | 'limit';
  } | null;
}

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

const keyOf = (s: Pick<HuntState, 'board' | 'inHand' | 'toMove'>) =>
  `${s.board.join(',')}|${s.inHand}|${s.toMove}`;

export function createHuntState(v: HuntVariant): HuntState {
  const board = new Array<number>(v.size * v.size).fill(-1);
  for (const p of v.points) board[p] = 0;
  for (const p of v.prey) board[p] = 1;
  for (const p of v.hunters) board[p] = 2;
  const s: HuntState = {
    board,
    inHand: v.preyInHand,
    captured: 0,
    toMove: 0,
    chain: null,
    movers: [],
    history: [],
    keys: [],
    result: null,
  };
  s.keys = [keyOf(s)];
  return s;
}

/** The point one step from `p` in direction `d` along a drawn line, or −1. */
export function stepFrom(v: HuntVariant, board: readonly number[], p: number, d: number): number {
  const r = Math.floor(p / v.size);
  const c = p % v.size;
  if (d >= 4 && !v.diagonal(r, c)) return -1;
  const rr = r + DIRS[d]![0];
  const cc = c + DIRS[d]![1];
  if (rr < 0 || rr >= v.size || cc < 0 || cc >= v.size) return -1;
  const q = rr * v.size + cc;
  return board[q] === -1 ? -1 : q;
}

/** Jumps from `p` for a hunter: [over, to] pairs. */
export function jumpsFrom(v: HuntVariant, board: readonly number[], p: number): [number, number][] {
  const out: [number, number][] = [];
  for (let d = 0; d < 8; d++) {
    const over = stepFrom(v, board, p, d);
    if (over < 0 || board[over] !== 1) continue;
    const to = stepFrom(v, board, over, d);
    if (to >= 0 && board[to] === 0) out.push([over, to]);
  }
  return out;
}

function movesFor(
  v: HuntVariant,
  s: Pick<HuntState, 'board' | 'inHand' | 'chain'>,
  seat: 0 | 1,
): string[] {
  const out: string[] = [];
  const n = v.size;
  if (seat === 1 && s.chain !== null) {
    for (const [, to] of jumpsFrom(v, s.board, s.chain)) out.push(`${s.chain}-${to}`);
    return out;
  }
  if (seat === 0 && s.inHand > 0) {
    s.board.forEach((x, p) => {
      if (x === 0) out.push(`+${p}`);
    });
    return out;
  }
  s.board.forEach((x, p) => {
    if (x !== seat + 1) return;
    for (let d = 0; d < 8; d++) {
      const q = stepFrom(v, s.board, p, d);
      if (q < 0 || s.board[q] !== 0) continue;
      if (seat === 0 && v.preyNoBackward && Math.floor(q / n) < Math.floor(p / n)) continue;
      out.push(`${p}-${q}`);
    }
    if (seat === 1) for (const [, to] of jumpsFrom(v, s.board, p)) out.push(`${p}-${to}`);
  });
  return out;
}

export function legalHuntActions(v: HuntVariant, s: HuntState): string[] {
  if (s.result) return [];
  const moves = movesFor(v, s, s.toMove);
  return s.chain !== null ? [...moves, 'stop'] : moves;
}

function finishTurn(
  v: HuntVariant,
  s: HuntState,
  board: number[],
  inHand: number,
  captured: number,
  a: string,
): HuntState {
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  const base = { board, inHand, toMove };
  const keys = [...s.keys, keyOf(base)];
  const next: HuntState = {
    ...base,
    captured,
    chain: null,
    movers: [...s.movers, me],
    history: [...s.history, a],
    keys,
    result: null,
  };
  if (captured >= v.huntersWinAt) next.result = { winner: 1, reason: 'captures' };
  else if (movesFor(v, next, toMove).length === 0)
    next.result = { winner: me, reason: toMove === 1 ? 'trapped' : 'stuck' };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    next.result = { winner: v.stalled === 'hunters' ? 1 : null, reason: 'repetition' };
  else if (next.history.length >= v.plyLimit)
    next.result = { winner: v.stalled === 'hunters' ? 1 : null, reason: 'limit' };
  return next;
}

export function applyHuntAction(v: HuntVariant, s: HuntState, a: string): HuntState {
  if (s.result || !legalHuntActions(v, s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  if (a === 'stop')
    return finishTurn(
      v,
      { ...s, movers: s.movers, history: s.history },
      s.board,
      s.inHand,
      s.captured,
      a,
    );
  const board = s.board.slice();
  if (a.startsWith('+')) {
    board[Number(a.slice(1))] = 1;
    return finishTurn(v, s, board, s.inHand - 1, s.captured, a);
  }
  const [from, to] = a.split('-').map(Number) as [number, number];
  const piece = board[from]!;
  board[from] = 0;
  board[to] = piece;
  const jumped = jumpsFrom(v, s.board, from).find(([, t]) => t === to);
  if (piece === 2 && jumped) {
    board[jumped[0]] = 0;
    const captured = s.captured + 1;
    if (v.multiJump && captured < v.huntersWinAt && jumpsFrom(v, board, to).length > 0) {
      // The fox may keep jumping: same player, chain continues.
      return {
        ...s,
        board,
        captured,
        chain: to,
        movers: [...s.movers, 1],
        history: [...s.history, a],
      };
    }
    return finishTurn(v, s, board, s.inHand, captured, a);
  }
  return finishTurn(v, s, board, s.inHand, s.captured, a);
}

export function replayHunt(v: HuntVariant, history: readonly string[]): HuntState {
  return history.reduce((s, a) => applyHuntAction(v, s, a), createHuntState(v));
}

export function isValidHuntState(v: HuntVariant, data: unknown): data is HuntState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayHunt(v, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
