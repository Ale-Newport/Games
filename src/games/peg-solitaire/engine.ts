/**
 * Peg Solitaire rules and solver. Jump a peg over a neighbouring peg into an empty hole straight
 * beyond it, removing the jumped peg; finish with one peg (on the centre hole for the classic
 * goal). Boards: the English cross (33 holes), the European board (37) and the triangle (15, with
 * diagonal jumps along its three directions).
 */

export interface BoardShape {
  id: string;
  /** Rows of '.' (hole) and ' ' (off the board). */
  rows: string[];
  /** Jump directions as [dx, dy]. */
  dirs: [number, number][];
  /** The hole left empty at the start (and where the last peg should end, when `centreGoal`). */
  start: number;
  centreGoal: boolean;
}

const ORTHO: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export const SHAPES: Record<string, BoardShape> = {
  english: {
    id: 'english',
    rows: ['  ...  ', '  ...  ', '.......', '.......', '.......', '  ...  ', '  ...  '],
    dirs: ORTHO,
    start: 24,
    centreGoal: true,
  },
  european: {
    id: 'european',
    rows: ['  ...  ', ' ..... ', '.......', '.......', '.......', ' ..... ', '  ...  '],
    dirs: ORTHO,
    start: 8,
    centreGoal: false,
  },
  triangle: {
    id: 'triangle',
    // A triangle on a square grid: row r has r+1 holes at x = 0..r; jumps across, down and along
    // the diagonal stand for the triangle's three directions.
    rows: ['.    ', '..   ', '...  ', '.... ', '.....'],
    dirs: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
    ],
    start: 0,
    centreGoal: false,
  },
};

export interface Geometry {
  width: number;
  height: number;
  /** Hole index per cell (-1 off the board) and cell per hole. */
  holeAt: number[];
  cellOf: number[];
  /** Every jump as [from, over, to] hole indices. */
  jumps: [number, number, number][];
}

const geoCache = new Map<string, Geometry>();
export function geometry(shape: BoardShape): Geometry {
  const cached = geoCache.get(shape.id);
  if (cached) return cached;
  const height = shape.rows.length;
  const width = Math.max(...shape.rows.map((r) => r.length));
  const holeAt: number[] = [];
  const cellOf: number[] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (shape.rows[y]![x] === '.') {
        holeAt.push(cellOf.length);
        cellOf.push(y * width + x);
      } else holeAt.push(-1);
    }
  const jumps: [number, number, number][] = [];
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height ? holeAt[y * width + x]! : -1;
  cellOf.forEach((cell, h) => {
    const x = cell % width;
    const y = Math.floor(cell / width);
    for (const [dx, dy] of shape.dirs) {
      const over = at(x + dx, y + dy);
      const to = at(x + 2 * dx, y + 2 * dy);
      if (over >= 0 && to >= 0) jumps.push([h, over, to]);
    }
  });
  const g = { width, height, holeAt, cellOf, jumps };
  geoCache.set(shape.id, g);
  return g;
}

/** Pegs as a bit mask over holes (bigint: the European board has 37 holes). */
export type Pegs = bigint;

export const bit = (h: number) => 1n << BigInt(h);
export const has = (p: Pegs, h: number) => (p & bit(h)) !== 0n;
export function count(p: Pegs): number {
  let n = 0;
  for (let x = p; x; x &= x - 1n) n++;
  return n;
}

export function initialPegs(shape: BoardShape): Pegs {
  const g = geometry(shape);
  return (bit(g.cellOf.length) - 1n) & ~bit(shape.start);
}

export function legalJumps(shape: BoardShape, p: Pegs): [number, number, number][] {
  return geometry(shape).jumps.filter(([a, b, c]) => has(p, a) && has(p, b) && !has(p, c));
}

export const jump = (p: Pegs, [a, b, c]: [number, number, number]): Pegs =>
  (p & ~bit(a) & ~bit(b)) | bit(c);

export const isWin = (shape: BoardShape, p: Pegs) =>
  count(p) === 1 && (!shape.centreGoal || has(p, shape.start));

/**
 * Depth-first search for a finishing sequence, remembering positions known to fail. Returns the
 * jumps, or null when none exists or the node budget runs out (`exhausted` tells which).
 */
export function solve(
  shape: BoardShape,
  p: Pegs,
  budget = 3_000_000,
): { jumps: [number, number, number][] | null; exhausted: boolean } {
  const failed = new Set<bigint>();
  const path: [number, number, number][] = [];
  let nodes = 0;
  const g = geometry(shape);
  const walk = (x: Pegs): boolean => {
    if (isWin(shape, x)) return true;
    if (failed.has(x) || ++nodes > budget) return false;
    for (const j of g.jumps) {
      if (!has(x, j[0]) || !has(x, j[1]) || has(x, j[2])) continue;
      path.push(j);
      if (walk(jump(x, j))) return true;
      path.pop();
      if (nodes > budget) return false;
    }
    failed.add(x);
    return false;
  };
  const ok = walk(p);
  return { jumps: ok ? [...path] : null, exhausted: !ok && nodes > budget };
}

export type Jump = [number, number, number];

export interface PegState {
  board: string;
  /** Pegs as a hexadecimal bit mask (JSON has no bigint). */
  pegs: string;
  /** Earlier masks, for undo. */
  history: string[];
  jumps: number;
  undos: number;
  hints: number;
  elapsedMs: number;
  status: 'playing' | 'won' | 'stuck';
}

export const shapeOf = (s: { board: string }) => SHAPES[s.board] ?? SHAPES.english!;
export const pegsOf = (s: { pegs: string }): Pegs => BigInt(`0x${s.pegs}`);
const hex = (p: Pegs) => p.toString(16);

function statusOf(shape: BoardShape, p: Pegs): PegState['status'] {
  if (isWin(shape, p)) return 'won';
  return legalJumps(shape, p).length ? 'playing' : 'stuck';
}

export function newPegGame(board: string): PegState {
  const shape = SHAPES[board] ?? SHAPES.english!;
  return {
    board: shape.id,
    pegs: hex(initialPegs(shape)),
    history: [],
    jumps: 0,
    undos: 0,
    hints: 0,
    elapsedMs: 0,
    status: 'playing',
  };
}

export function play(s: PegState, j: Jump, options: { hint?: boolean } = {}): PegState {
  const shape = shapeOf(s);
  const p = pegsOf(s);
  if (s.status !== 'playing') return s;
  if (!legalJumps(shape, p).some((x) => x[0] === j[0] && x[1] === j[1] && x[2] === j[2])) return s;
  const next = jump(p, j);
  return {
    ...s,
    pegs: hex(next),
    history: [...s.history, s.pegs],
    jumps: s.jumps + 1,
    hints: s.hints + (options.hint ? 1 : 0),
    status: statusOf(shape, next),
  };
}

export function undo(s: PegState): PegState {
  const prev = s.history[s.history.length - 1];
  if (prev === undefined || s.status === 'won') return s;
  return {
    ...s,
    pegs: prev,
    history: s.history.slice(0, -1),
    jumps: s.jumps - 1,
    undos: s.undos + 1,
    status: 'playing',
  };
}

const known = new Map<string, Jump[]>();

/**
 * The next jump of a finishing line from here: from a remembered line when the position is on one,
 * else a fresh search within `budget`. Null with `exhausted` false means no finish exists.
 */
export function nextJump(s: PegState, budget = 400_000): { jump: Jump | null; exhausted: boolean } {
  const key = `${s.board}:${s.pegs}`;
  const line = known.get(key);
  if (line?.length) return { jump: line[0]!, exhausted: false };
  const shape = shapeOf(s);
  const r = solve(shape, pegsOf(s), budget);
  if (!r.jumps) return { jump: null, exhausted: r.exhausted };
  let p = pegsOf(s);
  r.jumps.forEach((j, i) => {
    known.set(`${s.board}:${hex(p)}`, r.jumps!.slice(i));
    p = jump(p, j);
  });
  return { jump: r.jumps[0] ?? null, exhausted: false };
}

export function isValidPegState(d: unknown): d is PegState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as PegState;
  const shape = SHAPES[s.board];
  if (!shape) return false;
  for (const k of ['jumps', 'undos', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0) return false;
  if (!Array.isArray(s.history) || s.history.length !== s.jumps) return false;
  const holes = geometry(shape).cellOf.length;
  const masks = [...s.history, s.pegs];
  if (!masks.every((m) => typeof m === 'string' && /^[0-9a-f]+$/.test(m))) return false;
  if (masks[0] !== hex(initialPegs(shape))) return false;
  for (let i = 1; i < masks.length; i++) {
    const a = BigInt(`0x${masks[i - 1]}`);
    const b = BigInt(`0x${masks[i]}`);
    if (b >> BigInt(holes)) return false;
    if (!legalJumps(shape, a).some((j) => jump(a, j) === b)) return false;
  }
  return s.status === statusOf(shape, pegsOf(s));
}
