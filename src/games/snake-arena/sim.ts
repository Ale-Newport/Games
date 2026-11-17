/**
 * Snake Arena: a round arena full of glowing pellets and computer snakes. Every snake moves forward
 * all the time and turns at a limited rate towards where it is steered; its body follows the path of
 * its head. Eating pellets adds mass, which makes the snake longer and thicker. Boosting doubles the
 * speed but burns mass, dropping small pellets behind. A snake whose head touches another snake's
 * body (or the arena wall) dies and its body turns into a trail of big pellets. Your run ends when
 * you die; your score is the longest you grew. 30 steps a second; all randomness is seeded.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const HZ = 30;
export const ARENA_R = 2200;
export const SPEED = 4;
export const BOOST_SPEED = 8;
export const START_MASS = 10;
export const MIN_BOOST_MASS = 12;
const BOOST_BURN = 0.1;
const FOOD_TARGET = 1800;
const CELL = 48;
const MAX_POINTS = 500;

export type Level = 'easy' | 'normal' | 'hard';

export interface Snake {
  id: number;
  name: string;
  hue: number;
  /** Flat [x0, y0, x1, y1, …], head first. */
  body: number[];
  angle: number;
  mass: number;
  boost: boolean;
  alive: boolean;
  kills: number;
  bot: boolean;
  /** Bots: the heading they drift towards when nothing else matters. */
  wander: number;
  /** Bots: steps left before a dead bot is replaced. */
  respawn: number;
  best: number;
}

export interface Arena {
  rng: RngState;
  t: number;
  level: Level;
  bots: number;
  snakes: Snake[];
  /** Flat [x, y, value, hue] per pellet. */
  food: number[];
  nextId: number;
  over: boolean;
  killedBy: string | null;
  /** Your best rank on the leaderboard (1 = top). */
  bestRank: number;
  events: string[];
}

export const BOT_NAMES = [
  'Noodle',
  'Zigzag',
  'Pixel',
  'Comet',
  'Mango',
  'Ripple',
  'Orbit',
  'Fizz',
  'Nova',
  'Pebble',
  'Squiggle',
  'Tango',
  'Echo',
  'Kiwi',
  'Marble',
  'Neon',
  'Sprout',
  'Twister',
  'Velvet',
  'Waffle',
  'Zephyr',
  'Biscuit',
  'Cinder',
  'Dazzle',
  'Ember',
  'Frost',
  'Glimmer',
  'Hopper',
  'Inky',
  'Jelly',
  'Lumen',
  'Mochi',
  'Nimbus',
  'Opal',
  'Puddle',
  'Quill',
  'Rascal',
  'Saffron',
  'Taffy',
  'Wobble',
];

export const radius = (mass: number) => 7 + 2.6 * Math.log2(1 + mass / 12);
export const points = (mass: number) =>
  Math.min(MAX_POINTS, Math.round(6 + 0.9 * Math.pow(Math.max(1, mass), 0.75)));
const spacing = (mass: number) => radius(mass) * 0.5;
const turnRate = (mass: number) => 0.14 * Math.pow(9 / radius(mass), 0.3);

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

/** A small generator for one decision, so bots never consume the shared stream. */
function hashRand(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

function makeSnake(
  id: number,
  name: string,
  hue: number,
  x: number,
  y: number,
  angle: number,
  mass: number,
  bot: boolean,
): Snake {
  const n = points(mass);
  const sp = spacing(mass);
  const body: number[] = [];
  for (let i = 0; i < n; i++) body.push(x - Math.cos(angle) * sp * i, y - Math.sin(angle) * sp * i);
  return {
    id,
    name,
    hue,
    body,
    angle,
    mass,
    boost: false,
    alive: true,
    kills: 0,
    bot,
    wander: angle,
    respawn: 0,
    best: mass,
  };
}

/** A random spot inside the arena, at least `margin` from the wall. */
function spot(rng: RngState, margin: number): [number, number, RngState] {
  let r = rng;
  for (;;) {
    const [a, r1] = rand(r);
    const [b, r2] = rand(r1);
    r = r2;
    const x = (a * 2 - 1) * ARENA_R;
    const y = (b * 2 - 1) * ARENA_R;
    if (Math.hypot(x, y) < ARENA_R - margin) return [x, y, r];
  }
}

function spawnFood(food: number[], rng: RngState, count: number): RngState {
  let r = rng;
  for (let i = 0; i < count; i++) {
    const [x, y, r1] = spot(r, 20);
    const [v, r2] = rand(r1);
    const [h, r3] = rand(r2);
    r = r3;
    food.push(x, y, 0.4 + v * 0.8, Math.floor(h * 360));
  }
  return r;
}

function spawnBot(
  a: Arena,
  rng: RngState,
  id: number,
  avoid: [number, number] | null,
): [Snake, RngState] {
  let r = rng;
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 20; tries++) {
    [x, y, r] = spot(r, 300);
    if (!avoid || Math.hypot(x - avoid[0], y - avoid[1]) > 700) break;
  }
  const [m, r1] = rand(r);
  const [h, r2] = rand(r1);
  const [ang, r3] = rand(r2);
  const mass =
    START_MASS + Math.floor(m * m * (a.level === 'hard' ? 260 : a.level === 'normal' ? 160 : 90));
  const name = BOT_NAMES[id % BOT_NAMES.length]!;
  return [makeSnake(id, name, Math.floor(h * 360), x, y, ang * Math.PI * 2, mass, true), r3];
}

export function newArena(seed: number, bots: number, level: Level): Arena {
  let rng = seedRng(seed >>> 0);
  const base: Arena = {
    rng,
    t: 0,
    level,
    bots,
    snakes: [],
    food: [],
    nextId: 1,
    over: false,
    killedBy: null,
    bestRank: bots + 1,
    events: [],
  };
  const [a, r1] = rand(rng);
  rng = r1;
  const you = makeSnake(0, '', 200, 0, 0, a * Math.PI * 2, START_MASS, false);
  const snakes = [you];
  for (let i = 0; i < bots; i++) {
    const [s, r] = spawnBot(base, rng, i + 1, [0, 0]);
    rng = r;
    snakes.push(s);
  }
  const food: number[] = [];
  rng = spawnFood(food, rng, FOOD_TARGET);
  return { ...base, rng, snakes, food, nextId: bots + 1 };
}

/** Spatial hash of body points: key → flat [snake index, point index, …]. */
type Grid = Map<number, number[]>;
const key = (x: number, y: number) =>
  (Math.floor(x / CELL) + 512) * 4096 + (Math.floor(y / CELL) + 512);

function bodyGrid(snakes: Snake[]): Grid {
  const g: Grid = new Map();
  snakes.forEach((s, si) => {
    if (!s.alive) return;
    for (let i = 0; i < s.body.length; i += 2) {
      const k = key(s.body[i]!, s.body[i + 1]!);
      let cell = g.get(k);
      if (!cell) g.set(k, (cell = []));
      cell.push(si, i);
    }
  });
  return g;
}

function foodGrid(food: number[]): Grid {
  const g: Grid = new Map();
  for (let i = 0; i < food.length; i += 4) {
    const k = key(food[i]!, food[i + 1]!);
    let cell = g.get(k);
    if (!cell) g.set(k, (cell = []));
    cell.push(i);
  }
  return g;
}

function near(
  g: Grid,
  x: number,
  y: number,
  r: number,
  visit: (entry: number[], j: number) => void,
) {
  const x0 = Math.floor((x - r) / CELL);
  const x1 = Math.floor((x + r) / CELL);
  const y0 = Math.floor((y - r) / CELL);
  const y1 = Math.floor((y + r) / CELL);
  for (let gx = x0; gx <= x1; gx++)
    for (let gy = y0; gy <= y1; gy++) {
      const cell = g.get((gx + 512) * 4096 + (gy + 512));
      if (cell) visit(cell, 0);
    }
}

/** Is there another snake's body (or the wall) within `clear` of (x, y)? */
function blocked(a: Arena, g: Grid, self: number, x: number, y: number, clear: number): boolean {
  if (Math.hypot(x, y) > ARENA_R - clear) return true;
  let hit = false;
  near(g, x, y, clear + 30, (cell) => {
    if (hit) return;
    for (let j = 0; j < cell.length; j += 2) {
      const si = cell[j]!;
      if (si === self) continue;
      const o = a.snakes[si]!;
      const px = o.body[cell[j + 1]!]!;
      const py = o.body[cell[j + 1]! + 1]!;
      if (Math.hypot(px - x, py - y) < clear + radius(o.mass)) {
        hit = true;
        return;
      }
    }
  });
  return hit;
}

export interface Steer {
  angle: number;
  boost: boolean;
}

const LOOK: Record<Level, number> = { easy: 55, normal: 100, hard: 150 };

const wrap = (a: number) => {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
};

/** A bot's steering: dodge bodies and the wall, otherwise hunt smaller heads or go for food. */
export function botSteer(a: Arena, g: Grid, fg: Grid, si: number, level: Level): Steer {
  const s = a.snakes[si]!;
  const hx = s.body[0]!;
  const hy = s.body[1]!;
  const r = radius(s.mass);
  let want = s.wander;
  let boost = false;
  // Food: the best value for distance nearby.
  let bestV = 0;
  near(fg, hx, hy, 220, (cell) => {
    for (const i of cell) {
      const d = Math.hypot(a.food[i]! - hx, a.food[i + 1]! - hy);
      const ahead = Math.cos(Math.atan2(a.food[i + 1]! - hy, a.food[i]! - hx) - s.angle);
      const v = (a.food[i + 2]! / (d + 40)) * (1.2 + ahead);
      if (v > bestV) {
        bestV = v;
        want = Math.atan2(a.food[i + 1]! - hy, a.food[i]! - hx);
        boost = level !== 'easy' && a.food[i + 2]! > 3 && d < 160 && s.mass > 40;
      }
    }
  });
  // Hunting: cut in front of a nearby head.
  const huntChance = level === 'hard' ? 0.6 : level === 'normal' ? 0.25 : 0;
  if (huntChance > 0 && hashRand(s.id, Math.floor(a.t / 60)) < huntChance) {
    let bestD = level === 'hard' ? 320 : 220;
    a.snakes.forEach((o, oi) => {
      if (oi === si || !o.alive) return;
      const d = Math.hypot(o.body[0]! - hx, o.body[1]! - hy);
      if (d < bestD && o.mass < s.mass && s.mass > 30) {
        bestD = d;
        const lead = 50 + radius(o.mass) * 3;
        want = Math.atan2(
          o.body[1]! + Math.sin(o.angle) * lead - hy,
          o.body[0]! + Math.cos(o.angle) * lead - hx,
        );
        boost = d < 200 && s.mass > MIN_BOOST_MASS + 10 && (level === 'hard' || d < 120);
      }
    });
  }
  // Keep away from the wall.
  if (Math.hypot(hx, hy) > ARENA_R - 260) want = Math.atan2(-hy, -hx);
  // Dodge: follow arcs at fixed turning rates and keep the ones that stay clear the longest,
  // preferring the arc that heads closest to what we want.
  const look = LOOK[level] + r * 2;
  const turn = turnRate(s.mass);
  const speed = boost ? BOOST_SPEED : SPEED;
  const steps = Math.ceil(look / speed);
  // Heads close enough to cross our path, moving on their current heading.
  const heads = a.snakes
    .map((o, oi) => [o, oi] as const)
    .filter(
      ([o, oi]) =>
        oi !== si && o.alive && Math.hypot(o.body[0]! - hx, o.body[1]! - hy) < look * 2 + 60,
    );
  const headNear = (x: number, y: number, n: number) =>
    heads.some(([o]) => {
      const sp = o.boost ? BOOST_SPEED : SPEED;
      return (
        Math.hypot(
          o.body[0]! + Math.cos(o.angle) * sp * n - x,
          o.body[1]! + Math.sin(o.angle) * sp * n - y,
        ) <
        r + radius(o.mass) + 8
      );
    });
  let best: { angle: number; clear: number; miss: number } | null = null;
  for (const k of [0, -0.5, 0.5, -1, 1]) {
    let ang = s.angle;
    let x = hx;
    let y = hy;
    let clear = steps;
    for (let n = 1; n <= steps; n++) {
      ang += k * turn;
      x += Math.cos(ang) * speed;
      y += Math.sin(ang) * speed;
      if (n % 3 === 0 || n === steps) {
        if (blocked(a, g, si, x, y, r * 0.9 + 3) || headNear(x, y, n)) {
          clear = n;
          break;
        }
      }
    }
    // Where this arc leaves us pointing, against where we want to go.
    const miss = Math.abs(wrap(want - (s.angle + k * turn * Math.min(steps, 8))));
    if (!best || clear > best.clear || (clear === best.clear && miss < best.miss))
      best = { angle: s.angle + k * 1.5, clear, miss };
  }
  const safe = best!.clear === steps;
  if (safe && Math.abs(wrap(want - s.angle)) < 1.5) {
    // When the way we want is clear, steer straight for it.
    let ok = true;
    for (let n = 3; n <= steps; n += 3)
      if (
        blocked(
          a,
          g,
          si,
          hx + Math.cos(want) * speed * n,
          hy + Math.sin(want) * speed * n,
          r * 0.9 + 3,
        ) ||
        headNear(hx + Math.cos(want) * speed * n, hy + Math.sin(want) * speed * n, n)
      )
        ok = false;
    if (ok) return { angle: want, boost };
  }
  return { angle: best!.angle, boost: boost && safe };
}

export type SnakeAction = string;
/** `idle` keeps the heading, `l`/`r` turn, `dN` steers to direction N of 16; a trailing `b` boosts. */
export const ACTIONS: SnakeAction[] = (() => {
  const out = ['idle', 'l', 'r', 'b', 'lb', 'rb'];
  for (let i = 0; i < 16; i++) out.push(`d${i}`, `d${i}b`);
  return out;
})();

export function parseAction(s: Snake, action: SnakeAction): Steer {
  const boost = action.endsWith('b') && action !== 'idle';
  const core = boost ? action.slice(0, -1) : action;
  if (core === 'l') return { angle: s.angle - 1, boost };
  if (core === 'r') return { angle: s.angle + 1, boost };
  if (core.startsWith('d')) return { angle: (Number(core.slice(1)) / 16) * Math.PI * 2, boost };
  return { angle: s.angle, boost };
}

/** The action nearest to a steering (for the watch policy and the touch/pointer controls). */
export function toAction(st: Steer): SnakeAction {
  const n = ((Math.round((st.angle / (Math.PI * 2)) * 16) % 16) + 16) % 16;
  return `d${n}${st.boost ? 'b' : ''}`;
}

function move(s: Snake, steer: Steer, drops: number[], t: number): Snake {
  const turn = turnRate(s.mass);
  const angle = wrap(s.angle + Math.max(-turn, Math.min(turn, wrap(steer.angle - s.angle))));
  const boost = steer.boost && s.mass > MIN_BOOST_MASS;
  const speed = boost ? BOOST_SPEED : SPEED;
  let mass = s.mass;
  if (boost) {
    mass -= BOOST_BURN;
    if (t % 5 === 0) {
      const n = s.body.length;
      drops.push(s.body[n - 2]!, s.body[n - 1]!, BOOST_BURN * 5 * 0.7, s.hue);
    }
  }
  const sp = spacing(mass);
  const want = points(mass) * 2;
  const body = s.body.slice(0, Math.min(s.body.length, want));
  body[0] = body[0]! + Math.cos(angle) * speed;
  body[1] = body[1]! + Math.sin(angle) * speed;
  for (let i = 2; i < body.length; i += 2) {
    const dx = body[i]! - body[i - 2]!;
    const dy = body[i + 1]! - body[i - 1]!;
    const d = Math.hypot(dx, dy);
    if (d > sp) {
      body[i] = body[i - 2]! + (dx / d) * sp;
      body[i + 1] = body[i - 1]! + (dy / d) * sp;
    }
  }
  while (body.length < want) body.push(body[body.length - 2]!, body[body.length - 1]!);
  return { ...s, body, angle, mass, boost };
}

/** The leaderboard: living snakes by mass. */
export function ranking(a: Arena): Snake[] {
  return a.snakes.filter((s) => s.alive).sort((x, y) => y.mass - x.mass || x.id - y.id);
}

export function stepArena(a: Arena, action: SnakeAction): Arena {
  if (a.over) return a;
  const events: string[] = [];
  const t = a.t + 1;
  let rng = a.rng;
  const g0 = bodyGrid(a.snakes);
  const fg0 = foodGrid(a.food);
  const drops: number[] = [];
  // Steer and move everyone.
  let snakes = a.snakes.map((s, i) => {
    if (!s.alive) return s;
    const steer = i === 0 ? parseAction(s, action) : botSteer(a, g0, fg0, i, a.level);
    const moved = move(s, steer, drops, t);
    if (i === 0 && moved.boost && !s.boost) events.push('boost');
    // Bots pick a new drifting direction now and then.
    if (i > 0 && t % 90 === s.id % 90) moved.wander = moved.angle + (hashRand(s.id, t) - 0.5) * 2.4;
    return moved;
  });
  // Collisions: a head touching another body (or the wall) dies.
  const g = bodyGrid(snakes);
  const dead = new Map<number, number | null>();
  snakes.forEach((s, si) => {
    if (!s.alive) return;
    const hx = s.body[0]!;
    const hy = s.body[1]!;
    const r = radius(s.mass);
    if (Math.hypot(hx, hy) > ARENA_R - r) {
      dead.set(si, null);
      return;
    }
    near(g, hx, hy, r + 40, (cell) => {
      if (dead.has(si)) return;
      for (let j = 0; j < cell.length; j += 2) {
        const oi = cell[j]!;
        if (oi === si) continue;
        const o = snakes[oi]!;
        const px = o.body[cell[j + 1]!]!;
        const py = o.body[cell[j + 1]! + 1]!;
        if (Math.hypot(px - hx, py - hy) < (r + radius(o.mass)) * 0.8) {
          dead.set(si, oi);
          return;
        }
      }
    });
  });
  let food = a.food;
  if (dead.size) {
    food = [...food];
    snakes = snakes.map((s, si) => {
      if (!dead.has(si)) return s;
      // The body becomes a trail of big pellets.
      const n = s.body.length / 2;
      const every = Math.max(1, Math.floor(n / Math.min(n, 4 + s.mass / 3)));
      const count = Math.ceil(n / every);
      const value = (s.mass * 0.75) / count;
      for (let i = 0; i < n; i += every) {
        const j = hashRand(s.id * 7 + i, t);
        food.push(
          s.body[i * 2]! + (j - 0.5) * 14,
          s.body[i * 2 + 1]! + (hashRand(i, s.id + t) - 0.5) * 14,
          value,
          s.hue,
        );
      }
      if (si === 0) events.push('die');
      return { ...s, alive: false, respawn: 60 };
    });
    for (const [si, by] of dead) {
      if (by === null || by === si) continue;
      snakes[by] = { ...snakes[by]!, kills: snakes[by]!.kills + 1 };
      if (by === 0) events.push('kill');
    }
  }
  // Eating.
  if (drops.length) food = [...food, ...drops];
  const fg = foodGrid(food);
  const eaten = new Set<number>();
  snakes = snakes.map((s, si) => {
    if (!s.alive) return s;
    const hx = s.body[0]!;
    const hy = s.body[1]!;
    const reach = radius(s.mass) + 10;
    let gain = 0;
    near(fg, hx, hy, reach + 8, (cell) => {
      for (const i of cell) {
        if (eaten.has(i)) continue;
        const pr = 2 + Math.sqrt(food[i + 2]!) * 2;
        if (Math.hypot(food[i]! - hx, food[i + 1]! - hy) < reach + pr) {
          eaten.add(i);
          gain += food[i + 2]!;
        }
      }
    });
    if (!gain) return s;
    if (si === 0) events.push(gain > 2 ? 'gulp' : 'eat');
    const mass = s.mass + gain;
    return { ...s, mass, best: Math.max(s.best, mass) };
  });
  if (eaten.size) {
    const kept: number[] = [];
    for (let i = 0; i < food.length; i += 4)
      if (!eaten.has(i)) kept.push(food[i]!, food[i + 1]!, food[i + 2]!, food[i + 3]!);
    food = kept;
  } else if (food === a.food) food = [...food];
  // Top up the pellets.
  const missing = FOOD_TARGET - food.length / 4;
  if (missing > 0) rng = spawnFood(food, rng, Math.min(missing, 12));
  // Replace dead bots.
  let nextId = a.nextId;
  const you = snakes[0]!;
  snakes = snakes.map((s, si) => {
    if (si === 0 || s.alive) return s;
    if (s.respawn > 1) return { ...s, respawn: s.respawn - 1 };
    nextId++;
    const [b, r] = spawnBot(a, rng, nextId, you.alive ? [you.body[0]!, you.body[1]!] : null);
    rng = r;
    return b;
  });
  const over = !snakes[0]!.alive;
  const rank = ranking({ ...a, snakes }).findIndex((s) => s.id === 0) + 1;
  const killedBy = over ? (dead.get(0) === null ? '' : (snakes[dead.get(0)!]?.name ?? '')) : null;
  return {
    ...a,
    rng,
    t,
    snakes,
    food,
    nextId,
    over,
    killedBy,
    bestRank: rank > 0 ? Math.min(a.bestRank, rank) : a.bestRank,
    events,
  };
}

/** The watch policy: your snake steered by the bot brain. */
export function policy(a: Arena, level: Level = 'hard'): SnakeAction {
  if (a.over) return 'idle';
  return toAction(botSteer(a, bodyGrid(a.snakes), foodGrid(a.food), 0, level));
}

export function length(s: Snake): number {
  return Math.floor(s.mass);
}

export function isArena(v: unknown): v is Arena {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Arena;
  return (
    Array.isArray(a.rng) &&
    Array.isArray(a.snakes) &&
    a.snakes.length > 0 &&
    Array.isArray(a.food) &&
    typeof a.t === 'number' &&
    Array.isArray(a.snakes[0]!.body)
  );
}
