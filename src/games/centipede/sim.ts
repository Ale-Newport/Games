/**
 * Garden Guard: a crawler shooter with an original name and look, at 60 steps a second. A
 * caterpillar of twelve segments winds down a garden of stones: it crawls sideways a cell at a time
 * and, at a stone or the edge, drops a row and turns. The gardener at the bottom squirts water
 * upwards, one drop in the air at a time. A hit segment turns into a stone and splits the
 * caterpillar in two (the part behind grows a head of its own). Stones take three hits. A beetle
 * zigzags through the gardener's patch now and then, eating stones; acorns drop straight down
 * leaving stones when the patch is bare. Clearing a caterpillar brings a faster one; touching a
 * segment, the beetle or an acorn costs a life (three, one more every 12 000).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const COLS = 30;
export const ROWS = 32;
export const CELL = 8;
export const W = COLS * CELL;
export const H = ROWS * CELL;
/** The gardener's patch: the bottom six rows. */
export const PATCH = ROWS - 6;
const SEGMENTS = 12;

type Dir8 = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
export type GuardAction = 'idle' | 'fire' | Dir8 | `${Dir8}-fire`;
const DIRS: Dir8[] = [
  'up',
  'down',
  'left',
  'right',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
];
export const ACTIONS: readonly GuardAction[] = [
  'idle',
  'fire',
  ...DIRS,
  ...DIRS.map((d) => `${d}-fire` as GuardAction),
];

export interface Segment {
  c: number;
  r: number;
  /** Sideways direction and whether the caterpillar is heading down (or back up, in the patch). */
  dx: 1 | -1;
  dy: 1 | -1;
  head: boolean;
}

export interface Guard {
  rng: RngState;
  wave: number;
  /** Stone hit points by cell (0 = none). */
  stones: number[];
  segments: Segment[];
  /** Steps per crawl step, and the countdown. */
  pace: number;
  tick: number;
  x: number;
  y: number;
  shot: { x: number; y: number } | null;
  beetle: { x: number; y: number; vx: number; vy: number } | null;
  beetleIn: number;
  acorn: { x: number; y: number; hp: number } | null;
  lives: number;
  nextLife: number;
  score: number;
  dying: number;
  over: boolean;
  events: string[];
  steps: number;
  heads: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const idx = (c: number, r: number) => r * COLS + c;

function caterpillar(wave: number): Segment[] {
  // From wave 2, some of the twelve come as loose heads.
  const loose = Math.min(6, wave - 1);
  const segs: Segment[] = [];
  for (let i = 0; i < SEGMENTS - loose; i++)
    segs.push({ c: COLS / 2 - i, r: 0, dx: 1, dy: 1, head: i === 0 });
  for (let i = 0; i < loose; i++)
    segs.push({ c: (i * 7 + 3) % COLS, r: 0, dx: i % 2 ? 1 : -1, dy: 1, head: true });
  return segs;
}

export function newGuard(seed: number): Guard {
  let rng = seedRng(seed >>> 0);
  const stones = new Array<number>(COLS * ROWS).fill(0);
  for (let k = 0; k < 40; k++) {
    const [a, n1] = rand(rng);
    const [b, n2] = rand(n1);
    rng = n2;
    stones[idx(Math.floor(a * COLS), 1 + Math.floor(b * (PATCH - 2)))] = 3;
  }
  return {
    rng,
    wave: 1,
    stones,
    segments: caterpillar(1),
    pace: 6,
    tick: 6,
    x: W / 2,
    y: H - 12,
    shot: null,
    beetle: null,
    beetleIn: 300,
    acorn: null,
    lives: 3,
    nextLife: 12000,
    score: 0,
    dying: 0,
    over: false,
    events: [],
    steps: 0,
    heads: 0,
  };
}

/** One crawl step of every segment: sideways, or down a row and turn at stones and edges. */
function crawl(segs: Segment[], stones: number[]): Segment[] {
  return segs.map((s0) => {
    const s = { ...s0 };
    const nc = s.c + s.dx;
    if (nc < 0 || nc >= COLS || stones[idx(nc, s.r)]! > 0) {
      // Down (or, in the patch, bounce between its top and the bottom row).
      if (s.r >= ROWS - 1) s.dy = -1;
      else if (s.dy < 0 && s.r <= PATCH) s.dy = 1;
      s.r += s.dy;
      s.dx = -s.dx as 1 | -1;
    } else s.c = nc;
    return s;
  });
}

const touches = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) =>
  Math.abs(ax - bx) < ar + br && Math.abs(ay - by) < ar + br;

export function stepGuard(s0: Guard, action: GuardAction): Guard {
  if (s0.over) return s0;
  let s: Guard = { ...s0, events: [], steps: s0.steps + 1 };
  let rng = s.rng;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    // Damaged stones grow back (5 points each) and the caterpillar starts again from the top.
    let score = s.score;
    const stones = s.stones.map((h) => {
      if (h > 0 && h < 3) {
        score += 5;
        return 3;
      }
      return h;
    });
    return {
      ...s,
      lives,
      score,
      stones,
      segments: caterpillar(s.wave),
      x: W / 2,
      y: H - 12,
      shot: null,
      beetle: null,
      acorn: null,
      beetleIn: 300,
      tick: s.pace,
    };
  }

  // The gardener moves within the patch, never into a stone.
  const dir = action.replace('-fire', '');
  const fire = action === 'fire' || action.endsWith('-fire');
  const mx = dir.includes('left') ? -1.6 : dir.includes('right') ? 1.6 : 0;
  const my = dir.startsWith('up') ? -1.6 : dir.startsWith('down') ? 1.6 : 0;
  const free = (x: number, y: number) => {
    if (x < 4 || x > W - 4 || y < PATCH * CELL + 4 || y > H - 4) return false;
    for (const [ox, oy] of [
      [-3, -3],
      [3, -3],
      [-3, 3],
      [3, 3],
    ] as const)
      if (s.stones[idx(Math.floor((x + ox) / CELL), Math.floor((y + oy) / CELL))]! > 0)
        return false;
    return true;
  };
  if (mx && free(s.x + mx, s.y)) s.x += mx;
  if (my && free(s.x, s.y + my)) s.y += my;

  // One drop in the air at a time.
  if (fire && !s.shot) {
    s.shot = { x: s.x, y: s.y - 6 };
    s.events.push('squirt');
  }
  let stones = s.stones;
  let segments = s.segments;
  const hitStone = (c: number, r: number) => {
    stones = stones.slice();
    stones[idx(c, r)] = stones[idx(c, r)]! - 1;
    if (stones[idx(c, r)] === 0) s.score += 1;
  };
  if (s.shot) {
    let shot: { x: number; y: number } | null = { ...s.shot };
    // Move in small hops so nothing is skipped.
    for (let k = 0; k < 4 && shot; k++) {
      shot.y -= 2;
      if (shot.y < 0) {
        shot = null;
        break;
      }
      const c = Math.floor(shot.x / CELL);
      const r = Math.floor(shot.y / CELL);
      const segI = segments.findIndex((g) => g.c === c && g.r === r);
      if (segI >= 0) {
        const seg = segments[segI]!;
        s.score += seg.head ? 100 : 10;
        if (seg.head) s.heads++;
        stones = stones.slice();
        stones[idx(c, r)] = 3;
        // The segment behind (if any) becomes a head.
        const behind = segments[segI + 1];
        segments = segments.filter((_, i) => i !== segI);
        if (behind && !behind.head)
          segments = segments.map((g) => (g === behind ? { ...g, head: true } : g));
        s.events.push(seg.head ? 'head' : 'segment');
        shot = null;
        break;
      }
      if (stones[idx(c, r)]! > 0) {
        hitStone(c, r);
        s.events.push('stone');
        shot = null;
        break;
      }
      if (s.beetle && touches(shot.x, shot.y, 1, s.beetle.x, s.beetle.y, 6)) {
        const dist = s.y - s.beetle.y;
        s.score += dist < 16 ? 900 : dist < 40 ? 600 : 300;
        s.beetle = null;
        s.beetleIn = 240 + Math.floor(roll() * 240);
        s.events.push('beetle');
        shot = null;
        break;
      }
      if (s.acorn && touches(shot.x, shot.y, 1, s.acorn.x, s.acorn.y, 4)) {
        s.acorn = { ...s.acorn, hp: s.acorn.hp - 1 };
        if (s.acorn.hp <= 0) {
          s.score += 200;
          s.acorn = null;
          s.events.push('acorn');
        }
        shot = null;
        break;
      }
    }
    s.shot = shot;
  }

  // The caterpillar crawls.
  s.tick--;
  if (s.tick <= 0) {
    s.tick = s.pace;
    segments = crawl(segments, stones);
  }

  // The beetle zigzags through the patch, eating stones it crosses.
  s.beetleIn--;
  if (!s.beetle && s.beetleIn <= 0) {
    const left = roll() < 0.5;
    s.beetle = {
      x: left ? 0 : W,
      y: PATCH * CELL + 8,
      vx: (left ? 1 : -1) * (0.8 + s.wave * 0.05),
      vy: 1.2,
    };
  }
  if (s.beetle) {
    const b = { ...s.beetle };
    b.x += b.vx;
    b.y += b.vy;
    if (b.y > H - 6 || b.y < (PATCH - 2) * CELL) b.vy = -b.vy;
    if (roll() < 0.02) b.vy = -b.vy;
    const c = Math.floor(b.x / CELL);
    const r = Math.floor(b.y / CELL);
    if (c >= 0 && c < COLS && stones[idx(c, r)]! > 0 && roll() < 0.1) {
      stones = stones.slice();
      stones[idx(c, r)] = 0;
    }
    s.beetle = b.x < -8 || b.x > W + 8 ? null : b;
    if (!s.beetle) s.beetleIn = 240 + Math.floor(roll() * 240);
  }

  // Acorns drop when the patch is nearly bare of stones.
  if (!s.acorn) {
    let inPatch = 0;
    for (let r = PATCH; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (stones[idx(c, r)]! > 0) inPatch++;
    if (inPatch < 4 && roll() < 0.004 + s.wave * 0.001)
      s.acorn = { x: (Math.floor(roll() * COLS) + 0.5) * CELL, y: 0, hp: 2 };
  } else {
    const a = { ...s.acorn, y: s.acorn.y + 2.5 };
    const r = Math.floor(a.y / CELL);
    const c = Math.floor(a.x / CELL);
    if (r < ROWS - 1 && r > 0 && stones[idx(c, r)] === 0 && roll() < 0.08) {
      stones = stones.slice();
      stones[idx(c, r)] = 3;
    }
    s.acorn = a.y > H ? null : a;
  }

  s = { ...s, rng, stones, segments };

  // Anything touching the gardener.
  const hurt =
    segments.some((g) => touches(s.x, s.y, 4, (g.c + 0.5) * CELL, (g.r + 0.5) * CELL, 3.5)) ||
    (s.beetle !== null && touches(s.x, s.y, 4, s.beetle.x, s.beetle.y, 5)) ||
    (s.acorn !== null && touches(s.x, s.y, 4, s.acorn.x, s.acorn.y, 4));
  if (hurt) return { ...s, dying: 90, events: [...s.events, 'hurt'] };

  if (s.score >= s.nextLife) {
    s.lives++;
    s.nextLife += 12000;
    s.events.push('extra');
  }
  if (segments.length === 0) {
    const wave = s.wave + 1;
    const pace = Math.max(3, 6 - Math.floor(wave / 2));
    return {
      ...s,
      wave,
      pace,
      tick: pace,
      segments: caterpillar(wave),
      events: [...s.events, 'wave'],
    };
  }
  return s;
}

const move = (dx: number, dy: number, fire: boolean): GuardAction => {
  const v = dy < 0 ? 'up' : dy > 0 ? 'down' : '';
  const h = dx < 0 ? 'left' : dx > 0 ? 'right' : '';
  const d = [v, h].filter(Boolean).join('-');
  if (!d) return fire ? 'fire' : 'idle';
  return (fire ? `${d}-fire` : d) as GuardAction;
};

/**
 * A gunner: keeps firing, slides under the column the lowest segment will reach next, keeps to the
 * bottom of the patch, and steps away from the beetle, falling acorns and segments in the patch.
 */
export function gunnerPolicy(s: Guard): GuardAction {
  if (s.over || s.dying) return 'idle';
  let tx = s.x;
  const lowest = [...s.segments].sort((a, b) => b.r - a.r || (a.head ? -1 : 1))[0];
  if (lowest) tx = (lowest.c + lowest.dx * 2 + 0.5) * CELL;
  let dx = Math.abs(tx - s.x) > 2 ? Math.sign(tx - s.x) : 0;
  let dy = s.y < H - 10 ? 1 : 0;
  const threats: [number, number][] = [];
  if (s.beetle) threats.push([s.beetle.x, s.beetle.y]);
  if (s.acorn) threats.push([s.acorn.x, s.acorn.y + 20]);
  for (const g of s.segments)
    if (g.r >= PATCH - 1) threats.push([(g.c + 0.5) * CELL + g.dx * 6, (g.r + 0.5) * CELL]);
  for (const [x, y] of threats) {
    if (Math.abs(x - s.x) < 22 && Math.abs(y - s.y) < 22) {
      dx = x > s.x ? -1 : 1;
      dy = y > s.y ? -1 : y < s.y ? 1 : dy;
    }
  }
  return move(dx, dy, true);
}

/** A simple player: holds fire in the middle and only drifts under the lowest segment. */
export function sprinklerPolicy(s: Guard): GuardAction {
  if (s.over || s.dying) return 'idle';
  const lowest = [...s.segments].sort((a, b) => b.r - a.r)[0];
  const tx = lowest ? (lowest.c + 0.5) * CELL : W / 2;
  return move(Math.abs(tx - s.x) > 3 ? Math.sign(tx - s.x) : 0, 0, true);
}

export function isGuard(d: unknown): d is Guard {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Guard;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.stones) &&
    s.stones.length === COLS * ROWS &&
    Array.isArray(s.segments) &&
    Number.isFinite(s.score)
  );
}
