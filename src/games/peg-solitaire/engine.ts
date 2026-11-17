/**
 * Peg Solitaire rules and solver. Jump a peg over a neighbouring peg into an empty hole straight
 * beyond it, removing the jumped peg; finish with one peg (on a given hole, for boards with a goal).
 * Square boards jump across and down: the English cross (33 holes), the European board (37), the
 * German board (45), the asymmetric 3-3-2-2 cross (39) and the diamond (41). Triangular boards also
 * jump along a diagonal of the grid, which stands for the third direction of a triangular lattice:
 * the triangles of 15 and 21 holes and the hexagon (37).
 */

export type Jump = [number, number, number];

export interface BoardShape {
  id: string;
  /** Rows of '.' (hole) and ' ' (off the board). */
  rows: string[];
  /** 'square': jumps across and down; 'triangular': six directions, drawn on a triangular lattice. */
  lattice: 'square' | 'triangular';
  /** Jump directions as [dx, dy]. */
  dirs: [number, number][];
  /** The hole left empty at the start. */
  start: number;
  /** The hole the last peg must end on, or null for anywhere. */
  goal: number | null;
  /**
   * A known finishing line from the start, for boards where a quick search from the opening is
   * not enough (found offline by a beam search; the tests replay it).
   */
  line?: Jump[];
}

const ORTHO: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** On a triangular lattice stored row by row, the third direction is the (1, 1) diagonal. */
const SIX: [number, number][] = [...ORTHO, [1, 1], [-1, -1]];

const square = (
  id: string,
  rows: string[],
  start: number,
  goal: number | null,
  line?: Jump[],
): BoardShape => ({ id, rows, lattice: 'square', dirs: ORTHO, start, goal, line });

const triangular = (
  id: string,
  rows: string[],
  start: number,
  goal: number | null,
): BoardShape => ({ id, rows, lattice: 'triangular', dirs: SIX, start, goal });

export const SHAPES: Record<string, BoardShape> = {
  english: square(
    'english',
    ['  ...  ', '  ...  ', '.......', '.......', '.......', '  ...  ', '  ...  '],
    16,
    16,
  ),
  european: square(
    'european',
    ['  ...  ', ' ..... ', '.......', '.......', '.......', ' ..... ', '  ...  '],
    8,
    null,
  ),
  german: square(
    'german',
    [
      '   ...   ',
      '   ...   ',
      '   ...   ',
      '.........',
      '.........',
      '.........',
      '   ...   ',
      '   ...   ',
      '   ...   ',
    ],
    22,
    22,
    // prettier-ignore
    [[7,13,22],[11,12,13],[3,6,12],[5,4,3],[14,8,5],[16,15,14],[34,25,16],[17,16,15],[35,26,17],[14,15,16],[17,16,15],[0,3,6],[2,1,0],[12,6,3],[0,3,6],[22,13,7],[6,7,8],[5,8,14],[14,15,16],[23,24,25],[16,25,34],[38,32,23],[34,33,32],[44,41,38],[37,31,22],[43,40,37],[29,30,31],[39,36,30],[27,28,29],[38,37,36],[30,36,39],[32,31,30],[9,10,11],[30,29,28],[11,20,29],[22,21,20],[42,39,36],[28,29,30],[36,30,21],[20,21,22],[18,19,20],[23,22,21],[20,21,22]],
  ),
  asymmetric: square(
    'asymmetric',
    [
      '  ...   ',
      '  ...   ',
      '  ...   ',
      '........',
      '........',
      '........',
      '  ...   ',
      '  ...   ',
    ],
    20,
    20,
    // prettier-ignore
    [[18,19,20],[6,11,19],[27,19,11],[29,28,27],[26,27,28],[31,30,29],[28,29,30],[38,35,29],[37,34,28],[36,33,27],[0,3,6],[6,11,19],[9,10,11],[25,17,9],[12,11,10],[9,10,11],[8,7,6],[1,4,7],[2,5,8],[11,6,3],[8,7,6],[3,6,11],[29,30,31],[32,31,30],[27,28,29],[14,13,12],[29,30,31],[16,15,14],[31,23,15],[15,14,13],[19,11,6],[13,12,11],[6,11,19],[21,22,23],[19,20,21],[24,23,22],[22,21,20]],
  ),
  diamond: square(
    'diamond',
    [
      '    .    ',
      '   ...   ',
      '  .....  ',
      ' ....... ',
      '.........',
      ' ....... ',
      '  .....  ',
      '   ...   ',
      '    .    ',
    ],
    6,
    34,
    // prettier-ignore
    [[0,2,6],[12,6,2],[4,5,6],[19,11,5],[1,5,11],[14,13,12],[3,7,13],[30,22,14],[8,14,22],[12,13,14],[2,6,12],[15,14,13],[12,13,14],[14,22,30],[24,23,22],[21,22,23],[36,30,22],[23,22,21],[10,11,12],[26,18,10],[9,10,11],[16,17,18],[12,11,10],[21,20,19],[28,27,26],[37,33,27],[19,27,33],[25,26,27],[10,18,26],[26,27,28],[28,29,30],[31,30,29],[35,29,21],[33,34,35],[40,38,34],[39,35,29],[21,29,35],[35,34,33],[32,33,34]],
  ),
  // A triangle on a square grid: row r has r+1 holes at x = 0..r.
  triangle: triangular('triangle', ['.    ', '..   ', '...  ', '.... ', '.....'], 0, null),
  triangle21: triangular(
    'triangle21',
    ['.     ', '..    ', '...   ', '....  ', '..... ', '......'],
    0,
    0,
  ),
  // A hexagon of side four: row y holes run from x = max(0, y − 3) to min(6, y + 3).
  hexagon: triangular(
    'hexagon',
    ['....   ', '.....  ', '...... ', '.......', ' ......', '  .....', '   ....'],
    17,
    19,
  ),
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
  count(p) === 1 && (shape.goal === null || has(p, shape.goal));

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
const remembered = new Set<string>();

/** Every position along a board's known line, with the rest of the line from there. */
function rememberLine(shape: BoardShape) {
  if (!shape.line || remembered.has(shape.id)) return;
  remembered.add(shape.id);
  let p = initialPegs(shape);
  shape.line.forEach((j, i) => {
    known.set(`${shape.id}:${hex(p)}`, shape.line!.slice(i));
    p = jump(p, j);
  });
}

/**
 * The next jump of a finishing line from here: from a remembered line when the position is on one,
 * else a fresh search within `budget`. Null with `exhausted` false means no finish exists.
 */
export function nextJump(s: PegState, budget = 400_000): { jump: Jump | null; exhausted: boolean } {
  rememberLine(shapeOf(s));
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
