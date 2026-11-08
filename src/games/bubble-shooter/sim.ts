/**
 * Bubble Cannon: a bubble shooter with an original name and look, at 60 steps a second. Coloured
 * bubbles hang from the ceiling in a honeycomb. A cannon at the bottom fires one bubble at a time;
 * it bounces off the side walls and sticks where it touches. Three or more of a colour touching
 * pop, and anything left hanging from nothing drops (worth double). Every few shots without a pop
 * a new row pushes the honeycomb down; a bubble below the line ends the game. Clearing the board
 * starts the next, fuller level with more colours.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const COLS = 10;
export const R = 10;
export const ROW_H = R * Math.sqrt(3);
export const W = COLS * 2 * R;
export const H = 320;
export const CANNON_X = W / 2;
export const CANNON_Y = 296;
/** Bubbles whose centre is below this line end the game. */
export const DEADLINE = 262;
export const MAX_ROWS = Math.floor((DEADLINE - R) / ROW_H) + 1;
const SPEED = 8;
/** Aim angles: 65 steps from 80° left of straight up to 80° right. */
export const AIMS = 65;
const AIM_MAX = (80 * Math.PI) / 180;
export const angleOf = (k: number) => -AIM_MAX + (2 * AIM_MAX * k) / (AIMS - 1);

export type BubbleAction =
  'idle' | 'left' | 'right' | 'fire' | 'swap' | `aim-${number}` | `shoot-${number}`;
export const ACTIONS: readonly BubbleAction[] = [
  'idle',
  'left',
  'right',
  'fire',
  'swap',
  ...Array.from({ length: AIMS }, (_, k) => `aim-${k}` as const),
  ...Array.from({ length: AIMS }, (_, k) => `shoot-${k}` as const),
];

/** A colour index, or -1 for an empty cell. */
export type Cell = number;

export interface Flying {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colour: number;
}

export interface Bubbles {
  rng: RngState;
  /** Rows from the ceiling down; `odd` rows have COLS - 1 cells and sit half a bubble right. */
  grid: Cell[][];
  /** Whether row 0 is a short (offset) row. */
  shift: number;
  colours: number;
  level: number;
  /** The aim, as an index into the 65 angles. */
  aim: number;
  current: number;
  next: number;
  flying: Flying | null;
  /** Shots left before a new row comes down. */
  untilRow: number;
  shots: number;
  popped: number;
  dropped: number;
  score: number;
  /** Steps of the "level clear" pause. */
  pause: number;
  over: boolean;
  events: string[];
  steps: number;
  /** Whether a finger is aiming (the shot fires when it lifts). */
  touchAim: boolean;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const isShort = (s: Pick<Bubbles, 'shift'>, row: number) => (row + s.shift) % 2 === 1;
export const rowLength = (s: Pick<Bubbles, 'shift'>, row: number) =>
  isShort(s, row) ? COLS - 1 : COLS;
export const cellX = (s: Pick<Bubbles, 'shift'>, row: number, col: number) =>
  R + col * 2 * R + (isShort(s, row) ? R : 0);
export const cellY = (row: number) => R + row * ROW_H;

/** Neighbouring cells in the honeycomb. */
export function neighbours(
  s: Pick<Bubbles, 'shift'>,
  row: number,
  col: number,
): [number, number][] {
  const short = isShort(s, row);
  const d = short ? [0, 1] : [-1, 0];
  const out: [number, number][] = [
    [row, col - 1],
    [row, col + 1],
    [row - 1, col + d[0]!],
    [row - 1, col + d[1]!],
    [row + 1, col + d[0]!],
    [row + 1, col + d[1]!],
  ];
  return out.filter(([r, c]) => r >= 0 && c >= 0 && c < rowLength(s, r));
}

const at = (s: Pick<Bubbles, 'grid'>, r: number, c: number) => s.grid[r]?.[c] ?? -1;

/** Colours still on the board. */
export function present(s: Pick<Bubbles, 'grid'>): number[] {
  const set = new Set<number>();
  for (const row of s.grid) for (const c of row) if (c >= 0) set.add(c);
  return [...set].sort((a, b) => a - b);
}

function pick(rng: RngState, s: Pick<Bubbles, 'grid' | 'colours'>): [number, RngState] {
  const cols = present(s);
  const pool = cols.length ? cols : Array.from({ length: s.colours }, (_, i) => i);
  const [r, n] = rand(rng);
  return [pool[Math.floor(r * pool.length)]!, n];
}

function newRow(rng: RngState, length: number, colours: number): [Cell[], RngState] {
  const row: Cell[] = [];
  for (let c = 0; c < length; c++) {
    const [r, n] = rand(rng);
    rng = n;
    // Neighbours along the row often share a colour, so the boards have clumps to aim for.
    row.push(c > 0 && r < 0.35 ? row[c - 1]! : Math.floor(rand(rng)[0] * colours));
    rng = rand(rng)[1];
  }
  return [row, rng];
}

function newLevel(
  rng: RngState,
  level: number,
): Pick<Bubbles, 'grid' | 'shift' | 'colours' | 'rng'> {
  const colours = Math.min(6, 3 + level);
  const rows = Math.min(9, 4 + level);
  const grid: Cell[][] = [];
  for (let r = 0; r < MAX_ROWS; r++) {
    if (r < rows) {
      const [row, n] = newRow(rng, r % 2 ? COLS - 1 : COLS, colours);
      rng = n;
      grid.push(row);
    } else grid.push(Array<Cell>(r % 2 ? COLS - 1 : COLS).fill(-1));
  }
  return { grid, shift: 0, colours, rng };
}

const rowsBetween = (level: number) => Math.max(4, 8 - level);

export function newBubbles(seed: number): Bubbles {
  const lv = newLevel(seedRng(seed >>> 0), 1);
  let rng = lv.rng;
  const [current, n1] = pick(rng, lv);
  const [next, n2] = pick(n1, lv);
  rng = n2;
  return {
    ...lv,
    rng,
    level: 1,
    aim: (AIMS - 1) / 2,
    current,
    next,
    flying: null,
    untilRow: rowsBetween(1),
    shots: 0,
    popped: 0,
    dropped: 0,
    score: 0,
    pause: 0,
    over: false,
    events: [],
    steps: 0,
    touchAim: false,
  };
}

/** The same-coloured group around a cell. */
function group(s: Pick<Bubbles, 'grid' | 'shift'>, r0: number, c0: number): [number, number][] {
  const colour = at(s, r0, c0);
  const seen = new Set([`${r0},${c0}`]);
  const out: [number, number][] = [[r0, c0]];
  for (let i = 0; i < out.length; i++) {
    const [r, c] = out[i]!;
    for (const [nr, nc] of neighbours(s, r, c)) {
      const k = `${nr},${nc}`;
      if (!seen.has(k) && at(s, nr, nc) === colour) {
        seen.add(k);
        out.push([nr, nc]);
      }
    }
  }
  return out;
}

/** Bubbles not connected to the ceiling. */
function floating(s: Pick<Bubbles, 'grid' | 'shift'>): [number, number][] {
  const seen = new Set<string>();
  const queue: [number, number][] = [];
  s.grid[0]?.forEach((v, c) => {
    if (v >= 0) {
      seen.add(`0,${c}`);
      queue.push([0, c]);
    }
  });
  for (let i = 0; i < queue.length; i++) {
    const [r, c] = queue[i]!;
    for (const [nr, nc] of neighbours(s, r, c))
      if (at(s, nr, nc) >= 0 && !seen.has(`${nr},${nc}`)) {
        seen.add(`${nr},${nc}`);
        queue.push([nr, nc]);
      }
  }
  const out: [number, number][] = [];
  s.grid.forEach((row, r) =>
    row.forEach((v, c) => v >= 0 && !seen.has(`${r},${c}`) && out.push([r, c])),
  );
  return out;
}

/**
 * Flies a bubble from the cannon along an aim until it sticks; returns the cell it ends in (or null
 * if no cell is free there). Shared by the game (step by step) and the AI.
 */
export function advance(
  s: Pick<Bubbles, 'grid' | 'shift'>,
  f: Flying,
): { f: Flying; cell: [number, number] | null; stuck: boolean } {
  const g = { ...f };
  // Move in small sub-steps so a bubble never skips past another.
  for (let k = 0; k < 4; k++) {
    g.x += g.vx / 4;
    g.y += g.vy / 4;
    if (g.x < R) {
      g.x = 2 * R - g.x;
      g.vx = -g.vx;
    } else if (g.x > W - R) {
      g.x = 2 * (W - R) - g.x;
      g.vx = -g.vx;
    }
    let hit = g.y <= R;
    if (!hit)
      for (let r = 0; r < s.grid.length && !hit; r++) {
        if (Math.abs(cellY(r) - g.y) > 2 * R) continue;
        const row = s.grid[r]!;
        for (let c = 0; c < row.length; c++)
          if (row[c]! >= 0 && Math.hypot(cellX(s, r, c) - g.x, cellY(r) - g.y) < 2 * R - 3) {
            hit = true;
            break;
          }
      }
    if (hit) return { f: g, cell: snap(s, g.x, g.y), stuck: true };
  }
  return { f: g, cell: null, stuck: false };
}

/** The free cell nearest a point (preferring cells next to a bubble or on the top row). */
function snap(s: Pick<Bubbles, 'grid' | 'shift'>, x: number, y: number): [number, number] | null {
  let best: [number, number] | null = null;
  let bd = Infinity;
  for (let r = 0; r < s.grid.length; r++) {
    if (Math.abs(cellY(r) - y) > 2 * ROW_H) continue;
    for (let c = 0; c < rowLength(s, r); c++) {
      if (at(s, r, c) >= 0) continue;
      if (r > 0 && !neighbours(s, r, c).some(([nr, nc]) => at(s, nr, nc) >= 0)) continue;
      const d = Math.hypot(cellX(s, r, c) - x, cellY(r) - y);
      if (d < bd) {
        bd = d;
        best = [r, c];
      }
    }
  }
  return best;
}

export const launch = (aim: number, colour: number): Flying => {
  const a = angleOf(aim);
  return { x: CANNON_X, y: CANNON_Y, vx: Math.sin(a) * SPEED, vy: -Math.cos(a) * SPEED, colour };
};

/** Where a shot along `aim` would stick (the AI's view of the same flight). */
export function landing(s: Pick<Bubbles, 'grid' | 'shift'>, aim: number): [number, number] | null {
  let f = launch(aim, 0);
  for (let k = 0; k < 400; k++) {
    const r = advance(s, f);
    if (r.stuck) return r.cell;
    f = r.f;
  }
  return null;
}

/** What placing a colour in a cell would pop and drop. */
export function outcome(
  s: Pick<Bubbles, 'grid' | 'shift'>,
  cell: [number, number],
  colour: number,
): { pop: number; drop: number; grid: Cell[][] } {
  const grid = s.grid.map((row) => [...row]);
  grid[cell[0]]![cell[1]] = colour;
  const t = { grid, shift: s.shift };
  const g = group(t, cell[0], cell[1]);
  if (g.length < 3) return { pop: 0, drop: 0, grid };
  for (const [r, c] of g) grid[r]![c] = -1;
  const fl = floating(t);
  for (const [r, c] of fl) grid[r]![c] = -1;
  return { pop: g.length, drop: fl.length, grid };
}

const lowest = (grid: Cell[][]) => {
  let low = -1;
  grid.forEach((row, r) => row.some((v) => v >= 0) && (low = r));
  return low;
};

function settle(s: Bubbles, cell: [number, number] | null, colour: number) {
  s.flying = null;
  s.shots++;
  if (!cell) {
    s.over = true;
    s.events.push('over');
    return;
  }
  const res = outcome(s, cell, colour);
  s.grid = res.grid;
  if (res.pop) {
    s.popped += res.pop;
    s.dropped += res.drop;
    s.score += res.pop * 10 + res.drop * 20;
    s.events.push(res.drop ? 'drop' : 'pop');
  } else {
    s.events.push('stick');
    s.untilRow--;
  }
  if (s.untilRow <= 0) {
    // A new row pushes the honeycomb down.
    s.untilRow = rowsBetween(s.level);
    s.shift ^= 1;
    const [row, n] = newRow(s.rng, isShort(s, 0) ? COLS - 1 : COLS, s.colours);
    s.rng = n;
    s.grid = [row, ...s.grid.slice(0, MAX_ROWS - 1)];
    s.events.push('row');
  }
  if (lowest(s.grid) >= MAX_ROWS - 1 || s.grid.flat().length === 0) {
    s.over = true;
    s.events.push('over');
    return;
  }
  if (lowest(s.grid) < 0) {
    s.score += 1000 * s.level;
    s.pause = 90;
    s.events.push('clear');
    return;
  }
  // Only colours still on the board come up next.
  const cols = present(s);
  s.current = cols.includes(s.next) ? s.next : cols[0]!;
  const [nx, n] = pick(s.rng, s);
  s.next = nx;
  s.rng = n;
}

export function stepBubbles(s0: Bubbles, action: BubbleAction): Bubbles {
  if (s0.over) return s0;
  const s: Bubbles = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.pause > 0) {
    s.pause--;
    if (s.pause === 0) {
      s.level++;
      const lv = newLevel(s.rng, s.level);
      Object.assign(s, lv);
      s.untilRow = rowsBetween(s.level);
      const [c, n1] = pick(s.rng, s);
      const [nx, n2] = pick(n1, s);
      s.current = c;
      s.next = nx;
      s.rng = n2;
      s.events.push('level');
    }
    return s;
  }
  if (action === 'left') s.aim = Math.max(0, s.aim - 0.5);
  else if (action === 'right') s.aim = Math.min(AIMS - 1, s.aim + 0.5);
  let fire = action === 'fire';
  if (action.startsWith('aim-')) {
    s.aim = Math.max(0, Math.min(AIMS - 1, Number(action.slice(4))));
    s.touchAim = true;
  } else if (action.startsWith('shoot-')) {
    s.aim = Math.max(0, Math.min(AIMS - 1, Number(action.slice(6))));
    fire = true;
  }
  if (s.flying) {
    const r = advance(s, s.flying);
    if (r.stuck) settle(s, r.cell, s.flying.colour);
    else s.flying = r.f;
    return s;
  }
  if (action === 'swap' && s.current !== s.next) {
    [s.current, s.next] = [s.next, s.current];
    s.events.push('swap');
  }
  if (fire) {
    s.flying = launch(Math.round(s.aim), s.current);
    s.touchAim = false;
    s.events.push('fire');
  }
  return s;
}

/** How well a shot along `aim` does for the colour about to be fired. */
function shotValue(s: Bubbles, aim: number, colour: number): number {
  const cell = landing(s, aim);
  if (!cell) return -1e6;
  const res = outcome(s, cell, colour);
  if (res.pop) return 100 + res.pop * 10 + res.drop * 25;
  // No pop: next to its own colour (builds a group), high up rather than low.
  const same = neighbours(s, cell[0], cell[1]).filter(([r, c]) => at(s, r, c) === colour).length;
  return same * 12 - cell[0] * 4 - (cell[0] >= MAX_ROWS - 2 ? 500 : 0);
}

/**
 * An aimer: tries all 65 angles (bank shots included) for the bubble in the cannon and for the one
 * it could swap in, using the real flight, and fires the shot that pops the most (drops count more);
 * failing a pop, it puts the bubble next to its own colour, as high as it can.
 */
export function aimerPolicy(s: Bubbles): BubbleAction {
  if (s.over || s.flying || s.pause) return 'idle';
  let best = -Infinity;
  let pickAim = 0;
  let swap = false;
  for (const [colour, sw] of [
    [s.current, false],
    [s.next, true],
  ] as const) {
    if (sw && s.next === s.current) continue;
    for (let k = 0; k < AIMS; k++) {
      const v = shotValue(s, k, colour) - (sw ? 1 : 0);
      if (v > best) {
        best = v;
        pickAim = k;
        swap = sw;
      }
    }
  }
  return swap ? 'swap' : `shoot-${pickAim}`;
}

/** A sprayer: fires straight at the bubble nearest the cannon of its colour if it can see one, else anywhere. */
export function sprayerPolicy(s: Bubbles): BubbleAction {
  if (s.over || s.flying || s.pause) return 'idle';
  let target: [number, number] | null = null;
  let bd = Infinity;
  for (let r = 0; r < s.grid.length; r++)
    for (let c = 0; c < s.grid[r]!.length; c++) {
      if (s.grid[r]![c] !== s.current) continue;
      const d = Math.hypot(cellX(s, r, c) - CANNON_X, cellY(r) - CANNON_Y);
      if (d < bd) {
        bd = d;
        target = [r, c];
      }
    }
  if (!target) return `shoot-${(s.shots * 17) % AIMS}`;
  const [r, c] = target as [number, number];
  const a = Math.atan2(cellX(s, r, c) - CANNON_X, CANNON_Y - cellY(r));
  const k = Math.round(((a + AIM_MAX) / (2 * AIM_MAX)) * (AIMS - 1));
  return `shoot-${Math.max(0, Math.min(AIMS - 1, k))}`;
}

export function isBubbles(d: unknown): d is Bubbles {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Bubbles;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.grid) &&
    s.grid.every((row) => Array.isArray(row)) &&
    Number.isFinite(s.aim) &&
    Number.isFinite(s.score)
  );
}
