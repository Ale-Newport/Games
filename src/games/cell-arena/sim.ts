/**
 * Cell Arena: a square petri dish where every player is one or more round cells. Cells drift
 * towards where their owner steers, slower the bigger they are. A cell swallows anything with at
 * most 80 % of its mass that it covers: pellets, ejected mass, other players' cells. Splitting
 * halves every cell of 35+ mass and fires the halves forward (up to 16 cells); a player's cells
 * merge back after a cooldown. Ejecting fires a small blob of mass. Green spiky viruses hide small
 * cells but burst a bigger cell that eats one into many pieces; feeding a virus seven blobs makes
 * it shoot out a new one. Your run ends when all your cells are eaten. 30 steps a second, seeded.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const HZ = 30;
export const HALF = 2500;
export const START_MASS = 12;
export const MAX_CELLS = 16;
export const SPLIT_MIN = 35;
export const EJECT_MIN = 35;
export const EJECT_MASS = 13;
export const EJECT_COST = 16;
export const VIRUS_MASS = 100;
export const EAT_RATIO = 1.25;
const FOOD_TARGET = 3200;
const VIRUS_COUNT = 22;
const CELL = 64;

export type Level = 'easy' | 'normal' | 'hard';

export interface Cell {
  id: number;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  /** Step from which it may merge with its owner's other cells. */
  merge: number;
}

export interface Player {
  id: number;
  name: string;
  hue: number;
  bot: boolean;
  alive: boolean;
  kills: number;
  best: number;
  respawn: number;
  /** Bots: the drift heading. */
  wander: number;
  /** The step of the last eject (ejecting repeats at most every 3 steps). */
  ejectT: number;
}

/** A free blob: ejected mass or a virus. */
export interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  hue: number;
  virus: boolean;
  /** Viruses: blobs fed so far. */
  fed: number;
}

export interface Dish {
  rng: RngState;
  t: number;
  level: Level;
  bots: number;
  players: Player[];
  cells: Cell[];
  /** Flat [x, y, hue] per pellet (each worth 1). */
  food: number[];
  blobs: Blob[];
  nextCell: number;
  nextPlayer: number;
  over: boolean;
  killedBy: string | null;
  bestRank: number;
  /** Whether you asked to split on the previous step (a split needs a fresh press). */
  prevSplit: boolean;
  events: string[];
}

export const BOT_NAMES = [
  'Blob',
  'Dot',
  'Puff',
  'Bubble',
  'Gumdrop',
  'Pip',
  'Speck',
  'Mote',
  'Orb',
  'Nucleus',
  'Plankton',
  'Amoeba',
  'Spore',
  'Pearl',
  'Button',
  'Droplet',
  'Marble',
  'Cherry',
  'Olive',
  'Bean',
  'Comet',
  'Moon',
  'Pebble',
  'Donut',
  'Pixel',
  'Muffin',
  'Bagel',
  'Lychee',
  'Gnocchi',
  'Pom',
];

export const radius = (mass: number) => 4 * Math.sqrt(mass) + 2;
export const speed = (mass: number) => 9 * Math.pow(mass, -0.22);
const mergeDelay = (mass: number) => Math.round((20 + mass * 0.015) * HZ);

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

function hashRand(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

function point(rng: RngState, margin: number): [number, number, RngState] {
  const [a, r1] = rand(rng);
  const [b, r2] = rand(r1);
  return [(a * 2 - 1) * (HALF - margin), (b * 2 - 1) * (HALF - margin), r2];
}

function addFood(food: number[], rng: RngState, n: number): RngState {
  let r = rng;
  for (let i = 0; i < n; i++) {
    const [x, y, r1] = point(r, 10);
    const [h, r2] = rand(r1);
    r = r2;
    food.push(x, y, Math.floor(h * 360));
  }
  return r;
}

export const massOf = (d: Dish, owner: number) =>
  d.cells.reduce((m, c) => (c.owner === owner ? m + c.mass : m), 0);

export function centre(d: Dish, owner: number): [number, number] {
  let x = 0;
  let y = 0;
  let m = 0;
  for (const c of d.cells)
    if (c.owner === owner) {
      x += c.x * c.mass;
      y += c.y * c.mass;
      m += c.mass;
    }
  return m ? [x / m, y / m] : [0, 0];
}

function spawnPlayer(
  d: Dish,
  rng: RngState,
  p: Player,
  mass: number,
  avoid: [number, number] | null,
): [Cell, RngState] {
  let r = rng;
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 30; tries++) {
    [x, y, r] = point(r, 200);
    const far = !avoid || Math.hypot(x - avoid[0], y - avoid[1]) > 900;
    const clear = d.cells.every((c) => Math.hypot(c.x - x, c.y - y) > radius(c.mass) + 200);
    if (far && clear) break;
  }
  return [{ id: d.nextCell, owner: p.id, x, y, vx: 0, vy: 0, mass, merge: 0 }, r];
}

export function newDish(seed: number, bots: number, level: Level): Dish {
  let rng = seedRng(seed >>> 0);
  let d: Dish = {
    rng,
    t: 0,
    level,
    bots,
    players: [
      {
        id: 0,
        name: '',
        hue: 200,
        bot: false,
        alive: true,
        kills: 0,
        best: START_MASS,
        respawn: 0,
        wander: 0,
        ejectT: -10,
      },
    ],
    cells: [{ id: 0, owner: 0, x: 0, y: 0, vx: 0, vy: 0, mass: START_MASS, merge: 0 }],
    food: [],
    blobs: [],
    nextCell: 1,
    nextPlayer: 1,
    over: false,
    killedBy: null,
    bestRank: bots + 1,
    prevSplit: false,
    events: [],
  };
  for (let i = 0; i < bots; i++) {
    const [h, r1] = rand(rng);
    const [m, r2] = rand(r1);
    rng = r2;
    const p: Player = {
      id: d.nextPlayer,
      name: BOT_NAMES[i % BOT_NAMES.length]!,
      hue: Math.floor(h * 360),
      bot: true,
      alive: true,
      kills: 0,
      best: 0,
      respawn: 0,
      wander: h * 7,
      ejectT: -10,
    };
    const mass =
      START_MASS + Math.floor(m * m * (level === 'hard' ? 400 : level === 'normal' ? 250 : 120));
    const [c, r3] = spawnPlayer(d, rng, p, mass, [0, 0]);
    rng = r3;
    d = {
      ...d,
      players: [...d.players, { ...p, best: mass }],
      cells: [...d.cells, c],
      nextCell: d.nextCell + 1,
      nextPlayer: d.nextPlayer + 1,
    };
  }
  const food: number[] = [];
  rng = addFood(food, rng, FOOD_TARGET);
  const blobs: Blob[] = [];
  for (let i = 0; i < VIRUS_COUNT; i++) {
    const [x, y, r] = point(rng, 150);
    rng = r;
    blobs.push({ x, y, vx: 0, vy: 0, mass: VIRUS_MASS, hue: 120, virus: true, fed: 0 });
  }
  return { ...d, rng, food, blobs };
}

export interface Order {
  /** Where to head (a world point), or null to hold still. */
  tx: number | null;
  ty: number | null;
  split: boolean;
  eject: boolean;
}

export const ACTIONS: string[] = (() => {
  const out = ['idle', 's', 'w'];
  for (let i = 0; i < 16; i++) out.push(`d${i}`, `d${i}s`, `d${i}w`);
  return out;
})();

export function orderFor(d: Dish, owner: number, action: string): Order {
  const split = action.endsWith('s');
  const eject = action.endsWith('w');
  const core = split || eject ? action.slice(0, -1) : action;
  if (!core.startsWith('d')) return { tx: null, ty: null, split, eject };
  const a = (Number(core.slice(1)) / 16) * Math.PI * 2;
  const [cx, cy] = centre(d, owner);
  return { tx: cx + Math.cos(a) * 1200, ty: cy + Math.sin(a) * 1200, split, eject };
}

export function actionFor(angle: number | null, extra: '' | 's' | 'w'): string {
  if (angle === null) return extra || 'idle';
  const n = ((Math.round((angle / (Math.PI * 2)) * 16) % 16) + 16) % 16;
  return `d${n}${extra}`;
}

/** The leaderboard: living players by total mass. */
export function ranking(d: Dish): { p: Player; mass: number }[] {
  return d.players
    .filter((p) => p.alive)
    .map((p) => ({ p, mass: massOf(d, p.id) }))
    .sort((a, b) => b.mass - a.mass || a.p.id - b.p.id);
}

/** A bot's (or the watch policy's) action. */
export function botAction(d: Dish, owner: number, level: Level): string {
  const mine = d.cells.filter((c) => c.owner === owner);
  if (!mine.length) return 'idle';
  const p = d.players.find((q) => q.id === owner)!;
  const [cx, cy] = centre(d, owner);
  const biggest = mine.reduce((a, b) => (b.mass > a.mass ? b : a));
  const smallest = mine.reduce((a, b) => (b.mass < a.mass ? b : a));
  const vision =
    (level === 'easy' ? 350 : level === 'normal' ? 550 : 750) + radius(biggest.mass) * 2;
  // Flee from cells that could eat our smallest cell.
  let fx = 0;
  let fy = 0;
  let threat = false;
  for (const c of d.cells) {
    if (c.owner === owner) continue;
    if (c.mass < smallest.mass * EAT_RATIO) continue;
    const dist = Math.hypot(c.x - cx, c.y - cy) - radius(c.mass);
    const reach = level === 'easy' ? 120 : 220 + (c.mass > biggest.mass * 2.6 ? 250 : 0);
    if (dist < reach) {
      const w = 1 / Math.max(10, dist);
      fx -= ((c.x - cx) / Math.max(1, Math.hypot(c.x - cx, c.y - cy))) * w;
      fy -= ((c.y - cy) / Math.max(1, Math.hypot(c.x - cx, c.y - cy))) * w;
      threat = true;
    }
  }
  // Viruses are a threat to big cells.
  if (biggest.mass > VIRUS_MASS * EAT_RATIO && mine.length < MAX_CELLS)
    for (const b of d.blobs) {
      if (!b.virus) continue;
      const dist = Math.hypot(b.x - biggest.x, b.y - biggest.y) - radius(biggest.mass);
      if (dist < 80) {
        fx -=
          (b.x - biggest.x) /
          Math.max(1, Math.hypot(b.x - biggest.x, b.y - biggest.y)) /
          Math.max(10, dist);
        fy -=
          (b.y - biggest.y) /
          Math.max(1, Math.hypot(b.x - biggest.x, b.y - biggest.y)) /
          Math.max(10, dist);
        threat = true;
      }
    }
  // Keep off the edges.
  const edge = 150 + radius(biggest.mass);
  if (cx > HALF - edge) fx -= 0.02;
  if (cx < -HALF + edge) fx += 0.02;
  if (cy > HALF - edge) fy -= 0.02;
  if (cy < -HALF + edge) fy += 0.02;
  if (threat) return actionFor(Math.atan2(fy, fx), '');
  // Hunt: the most valuable cell we can eat.
  let prey: Cell | null = null;
  let preyScore = 0;
  for (const c of d.cells) {
    if (c.owner === owner || biggest.mass < c.mass * EAT_RATIO) continue;
    const dist = Math.hypot(c.x - biggest.x, c.y - biggest.y);
    if (dist > vision) continue;
    const s = c.mass / (dist + 100);
    if (s > preyScore) {
      preyScore = s;
      prey = c;
    }
  }
  if (prey && level !== 'easy') {
    const dist = Math.hypot(prey.x - biggest.x, prey.y - biggest.y) - radius(biggest.mass);
    const ang = Math.atan2(prey.y - biggest.y, prey.x - biggest.x);
    // Split-kill when half of us still out-masses it and it is within a split's reach.
    const canSplit =
      mine.length < (level === 'hard' ? 4 : 2) &&
      biggest.mass / 2 > prey.mass * EAT_RATIO &&
      biggest.mass >= SPLIT_MIN;
    if (
      canSplit &&
      dist < 260 + radius(biggest.mass) * 0.5 &&
      hashRand(owner, Math.floor(d.t / 10)) < (level === 'hard' ? 0.5 : 0.2)
    )
      return actionFor(ang, 's');
    return actionFor(ang, '');
  }
  if (prey) return actionFor(Math.atan2(prey.y - biggest.y, prey.x - biggest.x), '');
  // Food: head for the densest nearby direction.
  let bx = 0;
  let by = 0;
  for (let i = 0; i < d.food.length; i += 3) {
    const dx = d.food[i]! - cx;
    const dy = d.food[i + 1]! - cy;
    const dd = dx * dx + dy * dy;
    if (dd > 300 * 300 || dd < 1) continue;
    const w = 1 / dd;
    bx += dx * w;
    by += dy * w;
  }
  for (const b of d.blobs) {
    if (b.virus) continue;
    const dx = b.x - cx;
    const dy = b.y - cy;
    const dd = dx * dx + dy * dy;
    if (dd > 400 * 400 || dd < 1) continue;
    bx += (dx * 8) / dd;
    by += (dy * 8) / dd;
  }
  if (bx || by) return actionFor(Math.atan2(by, bx), '');
  return actionFor(p.wander, '');
}

type Grid = Map<number, number[]>;
const key = (x: number, y: number) =>
  (Math.floor(x / CELL) + 256) * 1024 + (Math.floor(y / CELL) + 256);

function foodGrid(food: number[]): Grid {
  const g: Grid = new Map();
  for (let i = 0; i < food.length; i += 3) {
    const k = key(food[i]!, food[i + 1]!);
    let c = g.get(k);
    if (!c) g.set(k, (c = []));
    c.push(i);
  }
  return g;
}

const clamp = (v: number, r: number) => Math.max(-HALF + r, Math.min(HALF - r, v));

export function stepDish(d0: Dish, action: string): Dish {
  if (d0.over) return d0;
  const t = d0.t + 1;
  const events: string[] = [];
  let rng = d0.rng;
  let nextCell = d0.nextCell;
  let cells = d0.cells.map((c) => ({ ...c }));
  let blobs = d0.blobs.map((b) => ({ ...b }));
  const players = d0.players.map((p) => ({ ...p }));
  // Orders.
  const orders = new Map<number, Order>();
  for (const p of players) {
    if (!p.alive) continue;
    const a = p.id === 0 ? action : botAction(d0, p.id, d0.level);
    orders.set(p.id, orderFor(d0, p.id, a));
    if (p.bot && t % 120 === p.id % 120) p.wander += (hashRand(p.id, t) - 0.5) * 3;
  }
  // Split and eject.
  const prevSplit = orders.get(0)?.split ?? false;
  for (const [owner, o] of orders) {
    if (o.split && !(owner === 0 && d0.prevSplit)) {
      const own = cells.filter((c) => c.owner === owner).sort((a, b) => b.mass - a.mass);
      let count = own.length;
      for (const c of own) {
        if (count >= MAX_CELLS || c.mass < SPLIT_MIN) continue;
        const ang =
          o.tx === null ? Math.atan2(c.vy, c.vx) || 0 : Math.atan2(o.ty! - c.y, o.tx - c.x);
        c.mass /= 2;
        c.merge = t + mergeDelay(c.mass * 2);
        const boost = 18 + radius(c.mass) * 0.12;
        cells.push({
          id: nextCell++,
          owner,
          x: c.x + Math.cos(ang) * radius(c.mass),
          y: c.y + Math.sin(ang) * radius(c.mass),
          vx: Math.cos(ang) * boost,
          vy: Math.sin(ang) * boost,
          mass: c.mass,
          merge: c.merge,
        });
        count++;
        if (owner === 0) events.push('split');
      }
    }
    const ejector = players.find((p) => p.id === owner)!;
    if (o.eject && t - ejector.ejectT >= 3) {
      ejector.ejectT = t;
      for (const c of cells) {
        if (c.owner !== owner || c.mass < EJECT_MIN) continue;
        const ang = o.tx === null ? 0 : Math.atan2(o.ty! - c.y, o.tx - c.x);
        c.mass -= EJECT_COST;
        const r = radius(c.mass) + 8;
        const hue = players.find((p) => p.id === owner)!.hue;
        blobs.push({
          x: c.x + Math.cos(ang) * r,
          y: c.y + Math.sin(ang) * r,
          vx: Math.cos(ang) * 22,
          vy: Math.sin(ang) * 22,
          mass: EJECT_MASS,
          hue,
          virus: false,
          fed: 0,
        });
        if (owner === 0) events.push('eject');
      }
    }
  }
  // Move cells: towards the order's point, or together when holding still; cells free to merge
  // also drift towards their owner's centre.
  const centres = new Map<number, [number, number]>();
  const counts = new Map<number, number>();
  for (const o of orders.keys()) centres.set(o, centre({ ...d0, cells }, o));
  for (const c of cells) counts.set(c.owner, (counts.get(c.owner) ?? 0) + 1);
  for (const c of cells) {
    const o = orders.get(c.owner);
    const [gx, gy] = centres.get(c.owner) ?? [c.x, c.y];
    const tx = o && o.tx !== null ? o.tx : gx;
    const ty = o && o.ty !== null ? o.ty : gy;
    const dx = tx - c.x;
    const dy = ty - c.y;
    const dist = Math.hypot(dx, dy);
    const sp = speed(c.mass) * Math.min(1, dist / 60);
    if (dist > 1) {
      c.x += (dx / dist) * sp;
      c.y += (dy / dist) * sp;
    }
    if (t >= c.merge && o && o.tx !== null && (counts.get(c.owner) ?? 0) > 1) {
      const cd = Math.hypot(gx - c.x, gy - c.y);
      if (cd > 1) {
        c.x += ((gx - c.x) / cd) * speed(c.mass) * 0.35;
        c.y += ((gy - c.y) / cd) * speed(c.mass) * 0.35;
      }
    }
    c.x += c.vx;
    c.y += c.vy;
    c.vx *= 0.88;
    c.vy *= 0.88;
    if (Math.abs(c.vx) < 0.05) c.vx = 0;
    if (Math.abs(c.vy) < 0.05) c.vy = 0;
    // Big cells slowly lose mass.
    if (c.mass > 200) c.mass *= 1 - 0.00008;
    const r = radius(c.mass);
    c.x = clamp(c.x, r * 0.5);
    c.y = clamp(c.y, r * 0.5);
  }
  // A player's own cells push apart until they may merge, then merge when they overlap.
  const merged = new Set<number>();
  for (let i = 0; i < cells.length; i++) {
    const a = cells[i]!;
    if (merged.has(a.id)) continue;
    for (let j = i + 1; j < cells.length; j++) {
      const b = cells[j]!;
      if (b.owner !== a.owner || merged.has(b.id)) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const ra = radius(a.mass);
      const rb = radius(b.mass);
      if (t >= a.merge && t >= b.merge) {
        if (dist < Math.max(ra, rb) * 0.9) {
          a.x = (a.x * a.mass + b.x * b.mass) / (a.mass + b.mass);
          a.y = (a.y * a.mass + b.y * b.mass) / (a.mass + b.mass);
          a.mass += b.mass;
          merged.add(b.id);
          if (a.owner === 0) events.push('merge');
        }
      } else if (dist < ra + rb) {
        const push = (ra + rb - dist) * 0.5;
        const wa = b.mass / (a.mass + b.mass);
        a.x -= (dx / dist) * push * wa;
        a.y -= (dy / dist) * push * wa;
        b.x += (dx / dist) * push * (1 - wa);
        b.y += (dy / dist) * push * (1 - wa);
      }
    }
  }
  if (merged.size) cells = cells.filter((c) => !merged.has(c.id));
  // Blobs drift.
  for (const b of blobs) {
    b.x = clamp(b.x + b.vx, radius(b.mass));
    b.y = clamp(b.y + b.vy, radius(b.mass));
    b.vx *= 0.9;
    b.vy *= 0.9;
    if (Math.abs(b.vx) < 0.05) b.vx = 0;
    if (Math.abs(b.vy) < 0.05) b.vy = 0;
  }
  // Ejected blobs feed viruses; the seventh makes the virus shoot a new one.
  const fedAway = new Set<Blob>();
  for (const v of blobs) {
    if (!v.virus) continue;
    for (const b of blobs) {
      if (b.virus || fedAway.has(b)) continue;
      if (Math.hypot(b.x - v.x, b.y - v.y) < radius(v.mass)) {
        fedAway.add(b);
        v.fed++;
        v.mass += b.mass * 0.5;
        if (v.fed >= 7) {
          const ang = Math.atan2(b.vy, b.vx) || 0;
          v.fed = 0;
          v.mass = VIRUS_MASS;
          blobs.push({
            x: v.x,
            y: v.y,
            vx: Math.cos(ang) * 26,
            vy: Math.sin(ang) * 26,
            mass: VIRUS_MASS,
            hue: 120,
            virus: true,
            fed: 0,
          });
        }
      }
    }
  }
  if (fedAway.size) blobs = blobs.filter((b) => !fedAway.has(b));
  // Eating pellets.
  let food = d0.food;
  const fg = foodGrid(food);
  const eatenFood = new Set<number>();
  for (const c of cells) {
    const r = radius(c.mass);
    const x0 = Math.floor((c.x - r) / CELL);
    const x1 = Math.floor((c.x + r) / CELL);
    const y0 = Math.floor((c.y - r) / CELL);
    const y1 = Math.floor((c.y + r) / CELL);
    for (let gx = x0; gx <= x1; gx++)
      for (let gy = y0; gy <= y1; gy++) {
        const list = fg.get((gx + 256) * 1024 + (gy + 256));
        if (!list) continue;
        for (const i of list) {
          if (eatenFood.has(i)) continue;
          if (Math.hypot(food[i]! - c.x, food[i + 1]! - c.y) < r) {
            eatenFood.add(i);
            c.mass += 1;
            if (c.owner === 0 && t % 2 === 0) events.push('eat');
          }
        }
      }
  }
  if (eatenFood.size) {
    const kept: number[] = [];
    for (let i = 0; i < food.length; i += 3)
      if (!eatenFood.has(i)) kept.push(food[i]!, food[i + 1]!, food[i + 2]!);
    food = kept;
  } else food = [...food];
  // Eating blobs and viruses.
  const goneBlobs = new Set<Blob>();
  const popped: Cell[] = [];
  for (const c of cells) {
    const r = radius(c.mass);
    for (const b of blobs) {
      if (goneBlobs.has(b)) continue;
      if (c.mass < b.mass * EAT_RATIO) continue;
      if (Math.hypot(b.x - c.x, b.y - c.y) > r - radius(b.mass) * 0.4) continue;
      goneBlobs.add(b);
      c.mass += b.mass;
      if (b.virus) popped.push(c);
      else if (c.owner === 0) events.push('gulp');
    }
  }
  if (goneBlobs.size) blobs = blobs.filter((b) => !goneBlobs.has(b));
  // A cell that eats a virus bursts into as many pieces as it may have.
  for (const c of popped) {
    const count = cells.filter((x) => x.owner === c.owner).length;
    const pieces = Math.min(MAX_CELLS - count, Math.floor(c.mass / 20), 12);
    if (c.owner === 0) events.push('pop');
    if (pieces < 1) continue;
    const each = c.mass / (pieces + 1);
    c.mass = each;
    c.merge = t + mergeDelay(each * (pieces + 1));
    for (let i = 0; i < pieces; i++) {
      const ang = (i / pieces) * Math.PI * 2 + hashRand(c.id, t) * 6;
      cells.push({
        id: nextCell++,
        owner: c.owner,
        x: c.x,
        y: c.y,
        vx: Math.cos(ang) * 14,
        vy: Math.sin(ang) * 14,
        mass: each,
        merge: c.merge,
      });
    }
  }
  // Cells eating cells.
  const eaten = new Map<number, number>();
  const byMass = [...cells].sort((a, b) => b.mass - a.mass);
  for (const a of byMass) {
    if (eaten.has(a.id)) continue;
    const ra = radius(a.mass);
    for (const b of byMass) {
      if (b === a || b.owner === a.owner || eaten.has(b.id)) continue;
      if (a.mass < b.mass * EAT_RATIO) continue;
      if (Math.hypot(b.x - a.x, b.y - a.y) > ra - radius(b.mass) * 0.4) continue;
      a.mass += b.mass;
      eaten.set(b.id, a.owner);
      if (a.owner === 0) events.push('gulp');
      if (b.owner === 0) events.push('lost');
    }
  }
  const killedOwner = new Map<number, number>();
  if (eaten.size) {
    for (const [id, by] of eaten) killedOwner.set(cells.find((c) => c.id === id)!.owner, by);
    cells = cells.filter((c) => !eaten.has(c.id));
  }
  // Players with no cells left are out.
  let over = false;
  let killedBy: string | null = null;
  for (const p of players) {
    if (!p.alive) continue;
    if (cells.some((c) => c.owner === p.id)) continue;
    p.alive = false;
    p.respawn = 60;
    const by = killedOwner.get(p.id);
    const killer = by === undefined ? undefined : players.find((q) => q.id === by);
    if (killer) {
      killer.kills++;
      if (killer.id === 0) events.push('kill');
    }
    if (p.id === 0) {
      over = true;
      killedBy = killer?.name ?? '';
      events.push('die');
    }
  }
  // Records.
  for (const p of players)
    if (p.alive)
      p.best = Math.max(
        p.best,
        cells.reduce((m, c) => (c.owner === p.id ? m + c.mass : m), 0),
      );
  // Replenish pellets and viruses; replace dead bots.
  const missing = FOOD_TARGET - food.length / 3;
  if (missing > 0) rng = addFood(food, rng, Math.min(missing, 25));
  if (blobs.filter((b) => b.virus).length < VIRUS_COUNT && t % 60 === 0) {
    const [x, y, r] = point(rng, 150);
    rng = r;
    blobs.push({ x, y, vx: 0, vy: 0, mass: VIRUS_MASS, hue: 120, virus: true, fed: 0 });
  }
  let next: Dish = {
    ...d0,
    rng,
    t,
    players,
    cells,
    food,
    blobs,
    nextCell,
    over,
    killedBy,
    prevSplit,
    events,
  };
  const you = centre(next, 0);
  for (const p of players) {
    if (!p.bot || p.alive) continue;
    if (p.respawn > 1) {
      p.respawn--;
      continue;
    }
    const [h, r1] = rand(next.rng);
    const [m, r2] = rand(r1);
    const mass = START_MASS + Math.floor(m * m * 60);
    const fresh: Player = {
      ...p,
      id: next.nextPlayer,
      name: BOT_NAMES[next.nextPlayer % BOT_NAMES.length]!,
      hue: Math.floor(h * 360),
      alive: true,
      kills: 0,
      best: mass,
      respawn: 0,
    };
    const [c, r3] = spawnPlayer(next, r2, fresh, mass, over ? null : you);
    Object.assign(p, fresh);
    next = {
      ...next,
      rng: r3,
      cells: [...next.cells, { ...c, id: next.nextCell }],
      nextCell: next.nextCell + 1,
      nextPlayer: next.nextPlayer + 1,
    };
  }
  const rank = ranking(next).findIndex((r) => r.p.id === 0) + 1;
  return { ...next, players, bestRank: rank > 0 ? Math.min(d0.bestRank, rank) : d0.bestRank };
}

export function isDish(v: unknown): v is Dish {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Dish;
  return (
    Array.isArray(d.rng) &&
    typeof d.prevSplit === 'boolean' &&
    Array.isArray(d.players) &&
    Array.isArray(d.cells) &&
    Array.isArray(d.food) &&
    Array.isArray(d.blobs) &&
    typeof d.t === 'number'
  );
}
