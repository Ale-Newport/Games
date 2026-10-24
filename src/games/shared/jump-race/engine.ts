/**
 * Shared rules for the jump-race games (#065 Halma, #066 Chinese Checkers): two armies start in
 * opposite camps and race to fill each other's camp. A move either steps a piece to an adjacent
 * empty cell, or makes a chain of jumps — each over one adjacent piece (either color) to the empty
 * cell straight beyond it — stopping wherever the player likes. Nothing is captured.
 *
 * - A piece that has reached the opponent's camp may move inside it but not leave it.
 * - You win when every cell of the target camp is occupied and at least one by your pieces (so an
 *   opponent cannot block a camp by never leaving home).
 * - A player with no legal move loses (it does not arise in practice). After the ply limit the
 *   player whose pieces are closer to home in total wins (equal is a draw).
 *
 * Geometry is a graph of cells with a neighbor table per direction; a jump goes two steps in one
 * direction. Actions: "from-to" (cell indices; the path of a jump chain does not matter).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export interface JumpRaceGeometry {
  /** Display coordinates of each cell (board units). */
  xy: readonly { x: number; y: number }[];
  /** neighbors[d][cell] = adjacent cell in direction d, or −1. */
  neighbors: readonly (readonly number[])[];
  /** camps[seat] = the cells where seat starts (and the other seat must reach). */
  camps: readonly [readonly number[], readonly number[]];
  /** dist[seat][cell] = how far the cell is from where seat must go (0 at the far tip). */
  dist: readonly [readonly number[], readonly number[]];
  /** Human-readable cell names. */
  names: readonly string[];
}

export interface JumpRaceVariant {
  id: string;
  shape: 'square' | 'star';
  geometry: JumpRaceGeometry;
  plyLimit: number;
}

export type JumpRaceReason = 'camp' | 'stuck' | 'limit';

export interface JumpRaceState {
  /** 0 empty, 1 seat 0, 2 seat 1. */
  board: number[];
  toMove: 0 | 1;
  /** Who moved first this round (rounds may alternate the opener). */
  first: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 | null; reason: JumpRaceReason } | null;
}

export const cellCount = (v: JumpRaceVariant) => v.geometry.xy.length;
/** Target camp of `seat` = the opponent's starting camp. */
export const targetCamp = (v: JumpRaceVariant, seat: 0 | 1) => v.geometry.camps[1 - seat]!;

export function createJumpRaceState(v: JumpRaceVariant, first: 0 | 1 = 0): JumpRaceState {
  const board = new Array<number>(cellCount(v)).fill(0);
  v.geometry.camps.forEach((camp, seat) => camp.forEach((c) => (board[c] = seat + 1)));
  return { board, toMove: first, first, history: [], result: null };
}

/** Cells the piece on `from` can reach this turn (steps and jump chains), ignoring camp rules. */
export function reachable(v: JumpRaceVariant, board: readonly number[], from: number): number[] {
  const nb = v.geometry.neighbors;
  const out: number[] = [];
  const seen = new Set<number>([from]);
  for (const dir of nb) {
    const n = dir[from]!;
    if (n >= 0 && board[n] === 0 && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  // Jump chains: the mover's own start cell counts as empty once it has left.
  const queue = [from];
  const jumped = new Set<number>([from]);
  while (queue.length) {
    const c = queue.pop()!;
    for (const dir of nb) {
      const over = dir[c]!;
      if (over < 0 || over === from || board[over] === 0) continue;
      const land = dir[over]!;
      if (land < 0 || jumped.has(land) || (board[land] !== 0 && land !== from)) continue;
      jumped.add(land);
      queue.push(land);
      if (!seen.has(land)) {
        seen.add(land);
        out.push(land);
      }
    }
  }
  return out;
}

/** The shortest jump path from `from` to `to` (inclusive), or a direct step. */
export function jumpPath(
  v: JumpRaceVariant,
  board: readonly number[],
  from: number,
  to: number,
): number[] {
  const nb = v.geometry.neighbors;
  if (nb.some((dir) => dir[from] === to)) return [from, to];
  const parent = new Map<number, number>([[from, -1]]);
  const queue = [from];
  while (queue.length) {
    const c = queue.shift()!;
    if (c === to) break;
    for (const dir of nb) {
      const over = dir[c]!;
      if (over < 0 || over === from || board[over] === 0) continue;
      const land = dir[over]!;
      if (land < 0 || parent.has(land) || (board[land] !== 0 && land !== from)) continue;
      parent.set(land, c);
      queue.push(land);
    }
  }
  const path: number[] = [];
  for (let c: number | undefined = to; c !== undefined && c !== -1; c = parent.get(c)) path.push(c);
  return path.reverse();
}

/** Legal destinations of the piece on `from` for the player to move. */
export function destinations(v: JumpRaceVariant, s: JumpRaceState, from: number): number[] {
  if (s.result || s.board[from] !== s.toMove + 1) return [];
  const target = targetCamp(v, s.toMove);
  const locked = target.includes(from);
  const all = reachable(v, s.board, from);
  return locked ? all.filter((c) => target.includes(c)) : all;
}

export function legalJumpRaceActions(v: JumpRaceVariant, s: JumpRaceState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.board.forEach((x, c) => {
    if (x === s.toMove + 1) for (const t of destinations(v, s, c)) out.push(`${c}-${t}`);
  });
  return out;
}

export const parseMove = (a: string) => a.split('-').map(Number) as [number, number];

/** Sum of the distances still to cover by seat's pieces. */
export function remaining(v: JumpRaceVariant, board: readonly number[], seat: 0 | 1): number {
  let total = 0;
  const d = v.geometry.dist[seat]!;
  board.forEach((x, c) => x === seat + 1 && (total += d[c]!));
  return total;
}

export function hasFilledCamp(v: JumpRaceVariant, board: readonly number[], seat: 0 | 1) {
  const camp = targetCamp(v, seat);
  return camp.every((c) => board[c] !== 0) && camp.some((c) => board[c] === seat + 1);
}

export function applyJumpRaceAction(
  v: JumpRaceVariant,
  s: JumpRaceState,
  a: string,
): JumpRaceState {
  if (s.result || typeof a !== 'string' || !/^\d+-\d+$/.test(a))
    throw new IllegalActionError(`Illegal move ${String(a)}`);
  const [f, t] = parseMove(a);
  if (!destinations(v, s, f).includes(t)) throw new IllegalActionError(`Illegal move ${a}`);
  const board = s.board.slice();
  board[t] = board[f]!;
  board[f] = 0;
  const me = s.toMove;
  const next: JumpRaceState = {
    board,
    toMove: (1 - me) as 0 | 1,
    first: s.first,
    history: [...s.history, a],
    result: null,
  };
  if (hasFilledCamp(v, board, me)) next.result = { winner: me, reason: 'camp' };
  else if (legalJumpRaceActions(v, next).length === 0)
    next.result = { winner: me, reason: 'stuck' };
  else if (next.history.length >= v.plyLimit) {
    const a0 = remaining(v, board, 0);
    const a1 = remaining(v, board, 1);
    next.result = { winner: a0 === a1 ? null : a0 < a1 ? 0 : 1, reason: 'limit' };
  }
  return next;
}

export function replayJumpRace(
  v: JumpRaceVariant,
  history: readonly string[],
  first: 0 | 1 = 0,
): JumpRaceState {
  return history.reduce((s, a) => applyJumpRaceAction(v, s, a), createJumpRaceState(v, first));
}

export function isValidJumpRaceState(v: JumpRaceVariant, data: unknown): data is JumpRaceState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  try {
    const replayed = replayJumpRace(v, data.history as string[], data.first);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------------------------
// Geometries

/**
 * Classic Halma: an n × n board, 8 directions, camps in opposite corners: the cells with
 * x + y ≤ k, minus the two cells at the ends of the last diagonal (19 pieces for n = 16, k = 5).
 */
export function squareGeometry(n: number, k: number): JumpRaceGeometry {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ] as const;
  const idx = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x);
  const cells = Array.from({ length: n * n }, (_, i) => ({ x: i % n, y: Math.floor(i / n) }));
  const inCorner = (x: number, y: number) => x + y < k || (x + y === k && x > 0 && y > 0);
  // Seat 0 starts bottom-right (nearest the player), seat 1 top-left.
  const camp1 = cells.filter((c) => inCorner(c.x, c.y)).map((c) => idx(c.x, c.y));
  const camp0 = cells.filter((c) => inCorner(n - 1 - c.x, n - 1 - c.y)).map((c) => idx(c.x, c.y));
  // Distance to the far corner, with a small pull toward its diagonal so the camp is the minimum.
  const toward = (x: number, y: number) => x + y + 0.1 * Math.abs(x - y);
  return {
    xy: cells,
    neighbors: dirs.map(([dx, dy]) => cells.map((c) => idx(c.x + dx, c.y + dy))),
    camps: [camp0, camp1],
    dist: [cells.map((c) => toward(c.x, c.y)), cells.map((c) => toward(n - 1 - c.x, n - 1 - c.y))],
    names: cells.map((c) => `${String.fromCharCode(97 + c.x)}${n - c.y}`),
  };
}

/**
 * The 121-hole six-pointed star: the union of two triangles in axial coordinates (q, r, s = −q−r),
 * {q, r, s ≥ −4} and {q, r, s ≤ 4}. Two players use the bottom (r ≥ 5, seat 0) and top (r ≤ −5)
 * points, ten holes each.
 */
export function starGeometry(): JumpRaceGeometry {
  const cells: { q: number; r: number }[] = [];
  for (let r = -8; r <= 8; r++)
    for (let q = -8; q <= 8; q++) {
      const s = -q - r;
      const a = q >= -4 && r >= -4 && s >= -4;
      const b = q <= 4 && r <= 4 && s <= 4;
      if (a || b) cells.push({ q, r });
    }
  const index = new Map(cells.map((c, i) => [`${c.q},${c.r}`, i]));
  const at = (q: number, r: number) => index.get(`${q},${r}`) ?? -1;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, -1],
    [-1, 1],
  ] as const;
  // Hex distance to a point's tip: the top tip is (4, −8), the bottom one (−4, 8).
  const hex = (q: number, r: number, tq: number, tr: number) =>
    Math.max(Math.abs(q - tq), Math.abs(r - tr), Math.abs(q + r - tq - tr));
  // Rows are numbered from the bottom; holes from the left within each row.
  const names = cells.map((c) => {
    const row = cells.filter((o) => o.r === c.r);
    return `${9 - c.r}·${row.findIndex((o) => o.q === c.q) + 1}`;
  });
  return {
    xy: cells.map((c) => ({ x: c.q + c.r / 2, y: (c.r * Math.sqrt(3)) / 2 })),
    neighbors: dirs.map(([dq, dr]) => cells.map((c) => at(c.q + dq, c.r + dr))),
    camps: [
      cells.flatMap((c, i) => (c.r >= 5 ? [i] : [])),
      cells.flatMap((c, i) => (c.r <= -5 ? [i] : [])),
    ],
    dist: [cells.map((c) => hex(c.q, c.r, 4, -8)), cells.map((c) => hex(c.q, c.r, -4, 8))],
    names,
  };
}
