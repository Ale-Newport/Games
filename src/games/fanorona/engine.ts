/**
 * Fanorona on the 5 × 9 board: 22 pieces each, only the center point empty. Pieces move one step
 * along the drawn lines (orthogonal everywhere, diagonal from the "strong" points where row + column
 * is even) to an empty point.
 *
 * Captures: moving straight toward an enemy piece that ends up adjacent in the direction of travel
 * captures it and the unbroken line of enemy pieces behind it (approach); moving straight away from
 * an adjacent enemy piece captures it and its line (withdrawal). When a move could do both the
 * player chooses. Capturing is compulsory: a non-capturing move (paika) is only allowed when no
 * capture exists. After a capture the same piece may go on capturing, but never in the same
 * direction twice in a row and never onto a point it already visited this turn; continuing is
 * optional ("stop" ends the turn).
 *
 * A player with no pieces loses; a player with no legal move loses. To keep games finite, 30 full
 * turns without a capture, or the same position three times, is a draw.
 *
 * Actions: "f-t" (paika), "f-tA" / "f-tW" (capture by approach / withdrawal), "stop" (end a chain).
 * Points are row·9 + col, row 0 at the top.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const ROWS = 5;
export const COLS = 9;
export const QUIET_LIMIT = 60;

export interface Chain {
  at: number;
  visited: number[];
  lastDir: number;
}

export interface FanoronaState {
  /** 0 empty, 1 = seat 0 (White, bottom), 2 = seat 1 (Black, top). */
  board: number[];
  toMove: 0 | 1;
  /** Set while the mover may continue a capture chain. */
  chain: Chain | null;
  movers: (0 | 1)[];
  history: string[];
  keys: string[];
  quiet: number;
  result: { winner: 0 | 1 | null; reason: 'wiped' | 'stuck' | 'repetition' | 'quiet' } | null;
}

/** The eight directions as [dr, dc]; index used in chains. */
export const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

const inside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const strong = (p: number) => (Math.floor(p / COLS) + (p % COLS)) % 2 === 0;

/** Neighbor of `p` in direction `d` along a drawn line, or −1. */
export function step(p: number, d: number): number {
  if (d >= 4 && !strong(p)) return -1;
  const r = Math.floor(p / COLS) + DIRS[d]![0];
  const c = (p % COLS) + DIRS[d]![1];
  return inside(r, c) ? r * COLS + c : -1;
}

export function createFanoronaState(): FanoronaState {
  const board = new Array<number>(ROWS * COLS).fill(0);
  for (let c = 0; c < COLS; c++) {
    board[c] = 2;
    board[COLS + c] = 2;
    board[3 * COLS + c] = 1;
    board[4 * COLS + c] = 1;
  }
  [2, 1, 2, 1, 0, 2, 1, 2, 1].forEach((v, c) => (board[2 * COLS + c] = v));
  const s: FanoronaState = {
    board,
    toMove: 0,
    chain: null,
    movers: [],
    history: [],
    keys: [],
    quiet: 0,
    result: null,
  };
  s.keys = [keyOf(s)];
  return s;
}

const keyOf = (s: Pick<FanoronaState, 'board' | 'toMove'>) => `${s.board.join('')}|${s.toMove}`;

/** Enemy pieces captured by moving from `f` to `t` in direction `d`, by `kind`. */
export function victims(
  board: readonly number[],
  f: number,
  t: number,
  d: number,
  kind: 'A' | 'W',
): number[] {
  const me = board[f]!;
  const enemy = 3 - me;
  const out: number[] = [];
  if (kind === 'A') {
    for (let p = step(t, d); p >= 0 && board[p] === enemy; p = step(p, d)) out.push(p);
  } else {
    const back = opposite(d);
    for (let p = step(f, back); p >= 0 && board[p] === enemy; p = step(p, back)) out.push(p);
  }
  return out;
}

/** Opposite direction index. */
export function opposite(d: number): number {
  const [dr, dc] = DIRS[d]!;
  return DIRS.findIndex(([r, c]) => r === -dr && c === -dc);
}

interface Move {
  f: number;
  t: number;
  d: number;
  kind: '' | 'A' | 'W';
}

function captures(s: FanoronaState, from: number[], chain: Chain | null): Move[] {
  const out: Move[] = [];
  for (const f of from) {
    for (let d = 0; d < 8; d++) {
      const t = step(f, d);
      if (t < 0 || s.board[t] !== 0) continue;
      if (chain && (d === chain.lastDir || chain.visited.includes(t))) continue;
      for (const kind of ['A', 'W'] as const)
        if (victims(s.board, f, t, d, kind).length) out.push({ f, t, d, kind });
    }
  }
  return out;
}

function movesOf(s: FanoronaState): Move[] {
  const me = s.toMove + 1;
  if (s.chain) return captures(s, [s.chain.at], s.chain);
  const mine = s.board.flatMap((v, p) => (v === me ? [p] : []));
  const caps = captures(s, mine, null);
  if (caps.length) return caps;
  const out: Move[] = [];
  for (const f of mine)
    for (let d = 0; d < 8; d++) {
      const t = step(f, d);
      if (t >= 0 && s.board[t] === 0) out.push({ f, t, d, kind: '' });
    }
  return out;
}

const encode = (m: Move) => `${m.f}-${m.t}${m.kind}`;

export function legalFanoronaActions(s: FanoronaState): string[] {
  if (s.result) return [];
  const moves = movesOf(s).map(encode);
  return s.chain ? [...moves, 'stop'] : moves;
}

function endTurn(s: FanoronaState, board: number[], captured: boolean, a: string): FanoronaState {
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  const quiet = captured ? 0 : s.quiet + 1;
  const base = {
    board,
    toMove,
    chain: null,
    movers: [...s.movers, me],
    history: [...s.history, a],
  };
  const key = keyOf(base);
  const keys = [...s.keys, key];
  const next: FanoronaState = { ...base, keys, quiet, result: null };
  const enemyLeft = board.some((v) => v === toMove + 1);
  if (!enemyLeft) next.result = { winner: me, reason: 'wiped' };
  else if (movesOf(next).length === 0) next.result = { winner: me, reason: 'stuck' };
  else if (keys.filter((k) => k === key).length >= 3)
    next.result = { winner: null, reason: 'repetition' };
  else if (quiet >= QUIET_LIMIT) next.result = { winner: null, reason: 'quiet' };
  return next;
}

export function applyFanoronaAction(s: FanoronaState, a: string): FanoronaState {
  if (s.result || !legalFanoronaActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  if (a === 'stop') return endTurn(s, s.board, true, a);
  const kind = (a.endsWith('A') ? 'A' : a.endsWith('W') ? 'W' : '') as Move['kind'];
  const [f, t] = a.replace(/[AW]$/, '').split('-').map(Number) as [number, number];
  const d = DIRS.findIndex((_, i) => step(f, i) === t);
  const board = s.board.slice();
  const taken = kind ? victims(board, f, t, d, kind) : [];
  for (const p of taken) board[p] = 0;
  board[t] = board[f]!;
  board[f] = 0;
  if (!kind) return endTurn(s, board, false, a);
  // A capture: the same piece may continue if another capture is open to it.
  const chain: Chain = { at: t, visited: [...(s.chain?.visited ?? [f]), t], lastDir: d };
  const pending: FanoronaState = {
    ...s,
    board,
    chain,
    movers: [...s.movers, s.toMove],
    history: [...s.history, a],
    quiet: 0,
  };
  if (!board.some((v) => v === 2 - s.toMove) || captures(pending, [t], chain).length === 0) {
    // Nothing more to take: the turn ends here (the capture has already been recorded).
    return endTurn({ ...pending, movers: s.movers, history: s.history }, board, true, a);
  }
  return pending;
}

export function replayFanorona(history: readonly string[]): FanoronaState {
  return history.reduce((s, a) => applyFanoronaAction(s, a), createFanoronaState());
}

export function isValidFanoronaState(data: unknown): data is FanoronaState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayFanorona(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
