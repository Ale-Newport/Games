/**
 * Go rules for #025–#027 (9×9, 13×13, 19×19): captures, no suicide, positional superko,
 * passing, area scoring (stones + territory, Tromp–Taylor style) with komi. Pure and immutable at
 * the API; a small mutable `GoBoardState` helper backs move generation and the playout engine.
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export type Color = 1 | 2; // 1 = Black (moves first), 2 = White
export const EMPTY = 0;
export const PASS = -1;

export interface GoRules {
  size: number;
  komi: number;
  /** Plies after which the game is scored as it stands. */
  maxPlies: number;
}

export interface GoResult {
  kind: 'win';
  winner: 0 | 1;
  reason: 'score';
  /** Black's area and White's area plus komi. */
  score: [number, number];
}

export interface GoState {
  size: number;
  /** 0 empty, 1 black, 2 white; row 0 at the top. */
  board: number[];
  /** Seat to move: 0 = Black, 1 = White. */
  toMove: 0 | 1;
  /** Point indices, or -1 for a pass. */
  history: number[];
  /** Stones captured by Black and by White. */
  captures: [number, number];
  /** Position hashes of every board so far (positional superko). */
  hashes: number[];
  /** Consecutive passes at the end of the history. */
  passes: number;
  result: GoResult | null;
}

const zCache = new Map<number, [Uint32Array, Uint32Array]>();
function zobrist(size: number) {
  let z = zCache.get(size);
  if (!z) {
    let x = 0x60b0 + size;
    const next = () => {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>>= 0);
    };
    z = [
      Uint32Array.from({ length: size * size * 3 }, next),
      Uint32Array.from({ length: size * size * 3 }, next),
    ];
    zCache.set(size, z);
  }
  return z;
}

/** Board hash (stones only, side to move excluded: positional superko). */
export function boardHash(board: ArrayLike<number>, size: number): number {
  const [hi, lo] = zobrist(size);
  let h = 0;
  let l = 0;
  for (let i = 0; i < board.length; i++) {
    const s = board[i]!;
    if (s) {
      h ^= hi[i * 3 + s]!;
      l ^= lo[i * 3 + s]!;
    }
  }
  return (h >>> 11) * 4294967296 + (l >>> 0);
}

const neighborCache = new Map<number, number[][]>();
export function neighbors(size: number): number[][] {
  let n = neighborCache.get(size);
  if (!n) {
    n = Array.from({ length: size * size }, (_, i) => {
      const r = Math.floor(i / size);
      const c = i % size;
      const out: number[] = [];
      if (r > 0) out.push(i - size);
      if (r < size - 1) out.push(i + size);
      if (c > 0) out.push(i - 1);
      if (c < size - 1) out.push(i + 1);
      return out;
    });
    neighborCache.set(size, n);
  }
  return n;
}

/** Stones of the group at `p` and whether it has any liberty. */
function group(
  board: ArrayLike<number>,
  size: number,
  p: number,
): { stones: number[]; libs: number } {
  const color = board[p]!;
  const nb = neighbors(size);
  const seen = new Set<number>([p]);
  const libs = new Set<number>();
  const stack = [p];
  const stones: number[] = [];
  while (stack.length) {
    const q = stack.pop()!;
    stones.push(q);
    for (const n of nb[q]!) {
      const s = board[n]!;
      if (s === EMPTY) libs.add(n);
      else if (s === color && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return { stones, libs: libs.size };
}

/**
 * Plays `color` at `p` on a copy of `board`; returns the new board and the number of captured
 * stones, or null when the move is suicide (or the point is occupied).
 */
export function playOn(
  board: readonly number[],
  size: number,
  p: number,
  color: Color,
): { board: number[]; captured: number } | null {
  if (board[p] !== EMPTY) return null;
  const next = board.slice();
  next[p] = color;
  const enemy = (3 - color) as Color;
  let captured = 0;
  for (const n of neighbors(size)[p]!) {
    if (next[n] !== enemy) continue;
    const g = group(next, size, n);
    if (g.libs === 0) {
      for (const s of g.stones) next[s] = EMPTY;
      captured += g.stones.length;
    }
  }
  if (group(next, size, p).libs === 0) return null; // suicide
  return { board: next, captured };
}

export function createGoState(rules: GoRules): GoState {
  const board = new Array<number>(rules.size * rules.size).fill(EMPTY);
  return {
    size: rules.size,
    board,
    toMove: 0,
    history: [],
    captures: [0, 0],
    hashes: [boardHash(board, rules.size)],
    passes: 0,
    result: null,
  };
}

const colorOf = (seat: 0 | 1): Color => (seat === 0 ? 1 : 2);

/** Whether placing at `p` is legal (empty, not suicide, no repeated board). */
export function isLegalPoint(s: GoState, p: number): boolean {
  if (p < 0 || p >= s.board.length || s.board[p] !== EMPTY) return false;
  const after = playOn(s.board, s.size, p, colorOf(s.toMove));
  return !!after && !s.hashes.includes(boardHash(after.board, s.size));
}

export function legalGoActions(s: GoState): number[] {
  if (s.result) return [];
  const out: number[] = [];
  for (let p = 0; p < s.board.length; p++) if (isLegalPoint(s, p)) out.push(p);
  out.push(PASS);
  return out;
}

/** Area score: stones on the board plus empty regions touching only that color. */
export function areaScore(
  board: readonly number[],
  size: number,
): {
  black: number;
  white: number;
  territory: number[]; // per point: 0 neutral/stone, 1 black territory, 2 white territory
} {
  const nb = neighbors(size);
  const territory = new Array<number>(board.length).fill(0);
  let black = 0;
  let white = 0;
  const seen = new Uint8Array(board.length);
  for (let p = 0; p < board.length; p++) {
    if (board[p] === 1) black++;
    else if (board[p] === 2) white++;
    if (board[p] !== EMPTY || seen[p]) continue;
    const region: number[] = [];
    const stack = [p];
    seen[p] = 1;
    let touches = 0;
    while (stack.length) {
      const q = stack.pop()!;
      region.push(q);
      for (const n of nb[q]!) {
        const s = board[n]!;
        if (s === EMPTY) {
          if (!seen[n]) {
            seen[n] = 1;
            stack.push(n);
          }
        } else touches |= s;
      }
    }
    if (touches === 1 || touches === 2) {
      for (const q of region) territory[q] = touches;
      if (touches === 1) black += region.length;
      else white += region.length;
    }
  }
  return { black, white, territory };
}

export function scoreOf(rules: GoRules, s: GoState): [number, number] {
  const { black, white } = areaScore(s.board, s.size);
  return [black, white + rules.komi];
}

export function applyGoAction(rules: GoRules, s: GoState, p: number): GoState {
  if (s.result) throw new IllegalActionError('The game is over');
  const history = [...s.history, p];
  let next: GoState;
  if (p === PASS) {
    next = { ...s, toMove: (1 - s.toMove) as 0 | 1, history, passes: s.passes + 1 };
  } else {
    if (!Number.isInteger(p) || !isLegalPoint(s, p))
      throw new IllegalActionError(`Illegal point ${p}`);
    const after = playOn(s.board, s.size, p, colorOf(s.toMove))!;
    const captures: [number, number] = [s.captures[0], s.captures[1]];
    captures[s.toMove] += after.captured;
    next = {
      ...s,
      board: after.board,
      toMove: (1 - s.toMove) as 0 | 1,
      history,
      captures,
      hashes: [...s.hashes, boardHash(after.board, s.size)],
      passes: 0,
    };
  }
  if (next.passes >= 2 || history.length >= rules.maxPlies) {
    const score = scoreOf(rules, next);
    next = {
      ...next,
      result: { kind: 'win', winner: score[0] > score[1] ? 0 : 1, reason: 'score', score },
    };
  }
  return next;
}

export function replayGo(rules: GoRules, history: readonly number[]): GoState {
  return history.reduce((s, p) => applyGoAction(rules, s, p), createGoState(rules));
}

export function undoGo(rules: GoRules, s: GoState, plies: number): GoState {
  return replayGo(rules, s.history.slice(0, Math.max(0, s.history.length - plies)));
}

export function isValidGoState(rules: GoRules, data: unknown): data is GoState {
  if (!isRecord(data) || data.size !== rules.size || !Array.isArray(data.history)) return false;
  if (!data.history.every((p) => Number.isInteger(p))) return false;
  try {
    return JSON.stringify(replayGo(rules, data.history as number[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
