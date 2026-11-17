/**
 * Blocky Arena: a free-for-all arena shooter on blocky height-map arenas. Fixed 60 Hz steps. Players
 * run (7 u/s), crouch, slide (crouching at speed boosts you and drops friction), jump and chain
 * jumps (holding jump hops again on landing without losing speed, and air strafing adds a little),
 * walk up half-unit steps and drop from ledges. Weapons are hitscan with spread (hip, aimed, moving,
 * bloom), recoil, magazines and reloads; head hits deal extra damage. Health regenerates after four
 * seconds without damage; the dead respawn after three seconds at the spawn farthest from enemies.
 * The match ends when someone reaches the kill goal or time runs out. Bots navigate with A* over
 * the height map, see within a field of view (line of sight is traced through the blocks), react
 * after a delay and aim with turning limits and decaying error. All randomness is seeded.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import { CELL, MAPS, SIZE, STEP, heightAt, levelAt, type ArenaMap } from './maps';
import { LOADOUTS, WEAPONS, type Loadout, type WeaponId } from './weapons';

export const HZ = 60;
const DT = 1 / HZ;
export const GRAVITY = 24;
export const JUMP = 8.2;
export const RUN = 7;
const CROUCH_SPEED = 3.4;
const AIM_SPEED = 4.6;
const GROUND_ACCEL = 10;
const AIR_ACCEL = 10;
const AIR_CAP = 0.9;
const FRICTION = 6;
const SLIDE_FRICTION = 0.5;
export const RADIUS = 0.35;
const RESPAWN = 180;
const REGEN_DELAY = 240;
const REGEN = 25 / HZ;

export type Level = 'easy' | 'normal' | 'hard';

export interface Input {
  /** Forward and sideways intent in [-1, 1]. */
  fx: number;
  sx: number;
  /** Look change this step (radians; positive yaw turns left, positive pitch looks up). */
  dyaw: number;
  dpitch: number;
  fire: boolean;
  aim: boolean;
  jump: boolean;
  crouch: boolean;
  reload: boolean;
  swap: boolean;
}

export const NO_INPUT: Input = {
  fx: 0,
  sx: 0,
  dyaw: 0,
  dpitch: 0,
  fire: false,
  aim: false,
  jump: false,
  crouch: false,
  reload: false,
  swap: false,
};

export interface Mind {
  target: number;
  /** Step the current target was first seen. */
  seen: number;
  strafe: number;
  strafeT: number;
  path: number[];
  repath: number;
  errYaw: number;
  errPitch: number;
  lastX: number;
  lastZ: number;
  lastT: number;
  stuck: number;
}

export interface Fighter {
  id: number;
  name: string;
  hue: number;
  bot: boolean;
  loadout: Loadout;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  hp: number;
  alive: boolean;
  respawn: number;
  weapon: 0 | 1;
  ammo: [number, number];
  reload: number;
  cooldown: number;
  crouch: boolean;
  slide: number;
  ground: boolean;
  lastHit: number;
  lastHitBy: number;
  kills: number;
  deaths: number;
  streak: number;
  bestStreak: number;
  headshots: number;
  aiming: boolean;
  bloom: number;
  prev: { fire: boolean; crouch: boolean; reload: boolean; swap: boolean };
  mind: Mind | null;
}

export interface Shot {
  from: [number, number, number];
  to: [number, number, number];
  by: number;
  t: number;
}

export interface Kill {
  killer: number;
  victim: number;
  weapon: WeaponId;
  head: boolean;
  t: number;
}

export interface Match {
  map: string;
  rng: RngState;
  t: number;
  level: Level;
  goal: number;
  limit: number;
  fighters: Fighter[];
  shots: Shot[];
  feed: Kill[];
  over: boolean;
  events: string[];
}

export const BOT_NAMES = [
  'Brick',
  'Pixel',
  'Voxel',
  'Cubert',
  'Blocky',
  'Chunk',
  'Crate',
  'Tetra',
  'Stack',
  'Quad',
  'Slab',
  'Prism',
];

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

function hashRand(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

export const mapOf = (m: Match): ArenaMap => MAPS[m.map]!;
export const weaponOf = (f: Fighter) => WEAPONS[LOADOUTS[f.loadout][f.weapon]];
export const eyeHeight = (f: Fighter) => (f.crouch ? 1.05 : 1.6);
export const bodyHeight = (f: Fighter) => (f.crouch ? 1.2 : 1.8);

export function direction(yaw: number, pitch: number): [number, number, number] {
  return [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
}

/** The highest ground under a player's footprint at (x, z). */
function groundUnder(map: ArenaMap, x: number, z: number): number {
  let h = 0;
  for (const dx of [-RADIUS, RADIUS])
    for (const dz of [-RADIUS, RADIUS]) h = Math.max(h, heightAt(map, x + dx, z + dz));
  return h;
}

/** Spawn cell farthest from living enemies of `id`. */
function spawnPoint(m: Match, id: number, salt: number): [number, number, number] {
  const map = mapOf(m);
  let best = map.spawns[0]!;
  let bestD = -1;
  map.spawns.forEach((s, i) => {
    const sx = (s[0] + 0.5) * CELL;
    const sz = (s[1] + 0.5) * CELL;
    let d = 1e9;
    for (const f of m.fighters)
      if (f.id !== id && f.alive) d = Math.min(d, Math.hypot(f.x - sx, f.z - sz));
    d += hashRand(salt, i) * 4;
    if (d > bestD) {
      bestD = d;
      best = s;
    }
  });
  const x = (best[0] + 0.5) * CELL;
  const z = (best[1] + 0.5) * CELL;
  return [x, heightAt(map, x, z), z];
}

function fresh(f: Fighter, at: [number, number, number]): Fighter {
  const [w0, w1] = LOADOUTS[f.loadout];
  const centre = (SIZE * CELL) / 2;
  return {
    ...f,
    x: at[0],
    y: at[1],
    z: at[2],
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: Math.atan2(-(centre - at[0]), -(centre - at[2])),
    pitch: 0,
    hp: 100,
    alive: true,
    respawn: 0,
    weapon: 0,
    ammo: [WEAPONS[w0].mag, WEAPONS[w1].mag],
    reload: 0,
    cooldown: 0,
    crouch: false,
    slide: 0,
    ground: true,
    aiming: false,
    bloom: 0,
    mind: f.bot ? emptyMind() : null,
  };
}

const emptyMind = (): Mind => ({
  target: -1,
  seen: 0,
  strafe: 1,
  strafeT: 0,
  path: [],
  repath: 0,
  errYaw: 0,
  errPitch: 0,
  lastX: 0,
  lastZ: 0,
  lastT: -9999,
  stuck: 0,
});

export function newMatch(
  seed: number,
  opts: {
    map: string;
    loadout: Loadout;
    bots: number;
    level: Level;
    goal: number;
    minutes: number;
  },
): Match {
  let rng = seedRng(seed >>> 0);
  let m: Match = {
    map: opts.map,
    rng,
    t: 0,
    level: opts.level,
    goal: opts.goal,
    limit: opts.minutes * 60 * HZ,
    fighters: [],
    shots: [],
    feed: [],
    over: false,
    events: [],
  };
  const blank = (
    id: number,
    name: string,
    hue: number,
    bot: boolean,
    loadout: Loadout,
  ): Fighter => ({
    id,
    name,
    hue,
    bot,
    loadout,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    pitch: 0,
    hp: 100,
    alive: false,
    respawn: 0,
    weapon: 0,
    ammo: [0, 0],
    reload: 0,
    cooldown: 0,
    crouch: false,
    slide: 0,
    ground: true,
    lastHit: -9999,
    lastHitBy: -1,
    kills: 0,
    deaths: 0,
    streak: 0,
    bestStreak: 0,
    headshots: 0,
    aiming: false,
    bloom: 0,
    prev: { fire: false, crouch: false, reload: false, swap: false },
    mind: null,
  });
  const people: Fighter[] = [blank(0, '', 210, false, opts.loadout)];
  for (let i = 0; i < opts.bots; i++) {
    const [h, r1] = rand(rng);
    const [l, r2] = rand(r1);
    rng = r2;
    people.push(
      blank(
        i + 1,
        BOT_NAMES[i % BOT_NAMES.length]!,
        Math.floor(h * 360),
        true,
        l < 0.25 ? 'marksman' : 'rifleman',
      ),
    );
  }
  m = { ...m, rng };
  const placed: Fighter[] = [];
  for (const f of people) {
    const at = spawnPoint({ ...m, fighters: placed }, f.id, seed + f.id);
    placed.push(fresh(f, at));
  }
  return { ...m, fighters: placed };
}

// ── Movement ────────────────────────────────────────────────────────────────

function blocked(map: ArenaMap, x: number, z: number, y: number, allowance: number): boolean {
  for (const dx of [-RADIUS, RADIUS])
    for (const dz of [-RADIUS, RADIUS])
      if (heightAt(map, x + dx, z + dz) > y + allowance) return true;
  return false;
}

function accelerate(
  v: [number, number],
  wx: number,
  wz: number,
  wishspeed: number,
  accel: number,
  cap: number,
) {
  const cur = v[0] * wx + v[1] * wz;
  const add = Math.min(wishspeed, cap) - cur;
  if (add <= 0) return;
  const acc = Math.min(accel * DT * wishspeed, add);
  v[0] += acc * wx;
  v[1] += acc * wz;
}

export function move(map: ArenaMap, f: Fighter, input: Input): Fighter {
  const g = { ...f };
  g.yaw = f.yaw + input.dyaw;
  g.pitch = Math.max(-1.45, Math.min(1.45, f.pitch + input.dpitch));
  const pressedCrouch = input.crouch && !f.prev.crouch;
  const v: [number, number] = [f.vx, f.vz];
  const speed = Math.hypot(v[0], v[1]);
  // Slide: crouching while running fast on the ground.
  if (pressedCrouch && f.ground && speed > 5) {
    g.slide = 36;
    const boost = Math.min(12, speed * 1.2) / speed;
    v[0] *= boost;
    v[1] *= boost;
  } else if (g.slide > 0) g.slide--;
  g.crouch = input.crouch;
  // Wish direction.
  const fx = Math.max(-1, Math.min(1, input.fx));
  const sx = Math.max(-1, Math.min(1, input.sx));
  let wx = -Math.sin(g.yaw) * fx + Math.cos(g.yaw) * sx;
  let wz = -Math.cos(g.yaw) * fx - Math.sin(g.yaw) * sx;
  const wl = Math.hypot(wx, wz);
  if (wl > 0) {
    wx /= wl;
    wz /= wl;
  }
  const w = weaponOf(f);
  const max =
    g.crouch && g.slide === 0
      ? CROUCH_SPEED
      : f.aiming
        ? w.id === 'sniper'
          ? 3.8
          : AIM_SPEED
        : RUN;
  let vy = f.vy;
  let ground = f.ground;
  if (ground && input.jump) {
    // Jumping straight away on landing skips friction: chained jumps keep their speed.
    vy = JUMP;
    ground = false;
    g.slide = 0;
  } else if (ground) {
    const sp = Math.hypot(v[0], v[1]);
    if (sp > 0) {
      const drop = Math.max(sp, 1) * (g.slide > 0 ? SLIDE_FRICTION : FRICTION) * DT;
      const k = Math.max(0, sp - drop) / sp;
      v[0] *= k;
      v[1] *= k;
    }
    if (wl > 0 && g.slide === 0) accelerate(v, wx, wz, max, GROUND_ACCEL, max);
  }
  if (!ground && wl > 0) accelerate(v, wx, wz, max, AIR_ACCEL, AIR_CAP);
  vy -= GRAVITY * DT;
  // Horizontal motion, one axis at a time, against the blocks.
  const allowance = f.ground ? STEP : 0.02;
  let x = f.x;
  let z = f.z;
  const nx = x + v[0] * DT;
  if (blocked(map, nx, z, f.y, allowance)) v[0] = 0;
  else x = nx;
  const nz = z + v[1] * DT;
  if (blocked(map, x, nz, f.y, allowance)) v[1] = 0;
  else z = nz;
  // Vertical motion.
  const floor = groundUnder(map, x, z);
  let y = f.y;
  if (ground) {
    if (floor > y && floor - y <= STEP + 0.01) y = floor;
    else if (floor < y - 0.05) ground = false;
    vy = ground ? 0 : vy;
  }
  if (!ground) {
    y += vy * DT;
    if (y <= floor) {
      y = floor;
      vy = 0;
      ground = true;
    }
  }
  return { ...g, x, y, z, vx: v[0], vy, vz: v[1], ground };
}

// ── Shooting ────────────────────────────────────────────────────────────────

/** Distance along a ray to the first block it enters (or `max`). */
export function traceBlocks(
  map: ArenaMap,
  o: [number, number, number],
  d: [number, number, number],
  max: number,
): number {
  for (let t = 0; t < max; t += 0.1) {
    const x = o[0] + d[0] * t;
    const y = o[1] + d[1] * t;
    const z = o[2] + d[2] * t;
    if (y < heightAt(map, x, z) || y < 0) return t;
  }
  return max;
}

function slab(
  o: [number, number, number],
  d: [number, number, number],
  lo: number[],
  hi: number[],
): number {
  let t0 = 0;
  let t1 = Infinity;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]!) < 1e-9) {
      if (o[a]! < lo[a]! || o[a]! > hi[a]!) return Infinity;
      continue;
    }
    let ta = (lo[a]! - o[a]!) / d[a]!;
    let tb = (hi[a]! - o[a]!) / d[a]!;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return Infinity;
  }
  return t0;
}

/** Where a ray hits a fighter: distance and whether it is the head (Infinity when it misses). */
export function hitFighter(
  g: Fighter,
  o: [number, number, number],
  d: [number, number, number],
): [number, boolean] {
  const h = bodyHeight(g);
  const head = slab(
    o,
    d,
    [g.x - 0.22, g.y + h - 0.45, g.z - 0.22],
    [g.x + 0.22, g.y + h, g.z + 0.22],
  );
  const body = slab(
    o,
    d,
    [g.x - RADIUS, g.y, g.z - RADIUS],
    [g.x + RADIUS, g.y + h - 0.45, g.z + RADIUS],
  );
  return head <= body ? [head, true] : [body, false];
}

/** Can a fighter at `a` see point p? */
export function sees(map: ArenaMap, a: Fighter, p: [number, number, number]): boolean {
  const o: [number, number, number] = [a.x, a.y + eyeHeight(a), a.z];
  const dx = p[0] - o[0];
  const dy = p[1] - o[1];
  const dz = p[2] - o[2];
  const len = Math.hypot(dx, dy, dz);
  return traceBlocks(map, o, [dx / len, dy / len, dz / len], len) >= len - 0.05;
}

// ── Bots ────────────────────────────────────────────────────────────────────

/** Reaction (steps), turn rate (rad/step), initial aim error, steady wobble, field of view (half angle), view distance, headshot preference, jump rate, share of time spent firing. */
const BOT: Record<
  Level,
  {
    react: number;
    turn: number;
    error: number;
    wobble: number;
    fov: number;
    view: number;
    head: number;
    jump: number;
    trigger: number;
  }
> = {
  easy: {
    react: 45,
    turn: 0.045,
    error: 0.09,
    wobble: 0.035,
    fov: 0.9,
    view: 40,
    head: 0,
    jump: 0,
    trigger: 0.45,
  },
  normal: {
    react: 24,
    turn: 0.1,
    error: 0.04,
    wobble: 0.014,
    fov: 1.15,
    view: 60,
    head: 0.3,
    jump: 0.004,
    trigger: 0.75,
  },
  hard: {
    react: 12,
    turn: 0.2,
    error: 0.014,
    wobble: 0.004,
    fov: 1.45,
    view: 80,
    head: 0.6,
    jump: 0.012,
    trigger: 1,
  },
};

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

const walkable = (map: ArenaMap, c: number) => map.levels[c]! < 8;

/** A* over cells: steps up of at most one level, drops of up to six. */
export function findPath(map: ArenaMap, from: number, to: number): number[] {
  if (from === to || !walkable(map, to)) return [];
  const open = new Map<number, number>([[from, 0]]);
  const g = new Map<number, number>([[from, 0]]);
  const came = new Map<number, number>();
  const hx = (c: number) =>
    Math.abs((c % SIZE) - (to % SIZE)) + Math.abs(Math.floor(c / SIZE) - Math.floor(to / SIZE));
  let guard = 0;
  while (open.size && guard++ < 4000) {
    let cur = -1;
    let best = Infinity;
    for (const [c, f] of open)
      if (f < best) {
        best = f;
        cur = c;
      }
    if (cur === to) {
      const path = [cur];
      while (came.has(path[0]!)) path.unshift(came.get(path[0]!)!);
      return path.slice(1);
    }
    open.delete(cur);
    const cx = cur % SIZE;
    const cz = Math.floor(cur / SIZE);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= SIZE || nz >= SIZE) continue;
      const n = nz * SIZE + nx;
      if (!walkable(map, n)) continue;
      const diff = levelAt(map, nx, nz) - levelAt(map, cx, cz);
      if (diff > 1 || diff < -6) continue;
      const cost = g.get(cur)! + 1;
      if (cost < (g.get(n) ?? Infinity)) {
        g.set(n, cost);
        came.set(n, cur);
        open.set(n, cost + hx(n));
      }
    }
  }
  return [];
}

const cellOf = (x: number, z: number) => Math.floor(z / CELL) * SIZE + Math.floor(x / CELL);

/** A bot's input for this step and its updated mind. */
export function think(m: Match, i: number, level: Level = m.level): [Input, Mind] {
  const f = m.fighters[i]!;
  const map = mapOf(m);
  const p = BOT[level];
  let mind: Mind = f.mind ? { ...f.mind } : emptyMind();
  if (!f.alive) return [NO_INPUT, mind];
  const w = weaponOf(f);
  const eye: [number, number, number] = [f.x, f.y + eyeHeight(f), f.z];
  // Targeting, re-checked every 4 steps.
  if ((m.t + i) % 4 === 0) {
    const current = m.fighters.find((g) => g.id === mind.target);
    const visible = (g: Fighter) => {
      if (!g.alive || g.id === f.id) return false;
      const dist = Math.hypot(g.x - f.x, g.z - f.z);
      if (dist > p.view) return false;
      const ang = Math.abs(wrap(Math.atan2(-(g.x - f.x), -(g.z - f.z)) - f.yaw));
      const heard = dist < 6 || (g.id === f.lastHitBy && m.t - f.lastHit < 60);
      if (ang > p.fov && !heard) return false;
      return (
        sees(map, f, [g.x, g.y + bodyHeight(g) - 0.3, g.z]) || sees(map, f, [g.x, g.y + 0.9, g.z])
      );
    };
    if (!current || !visible(current)) {
      let best: Fighter | null = null;
      let bestD = Infinity;
      for (const g of m.fighters) {
        if (!visible(g)) continue;
        const d = Math.hypot(g.x - f.x, g.z - f.z);
        if (d < bestD) {
          bestD = d;
          best = g;
        }
      }
      if (best && best.id !== mind.target) {
        const s1 = hashRand(f.id * 13 + m.t, 1) < 0.5 ? -1 : 1;
        const s2 = hashRand(f.id * 17 + m.t, 2) < 0.5 ? -1 : 1;
        mind = {
          ...mind,
          target: best.id,
          seen: m.t,
          errYaw: s1 * p.error * (1 + hashRand(f.id, m.t)),
          errPitch: s2 * p.error * hashRand(m.t, f.id),
        };
      } else if (!best) mind = { ...mind, target: -1 };
    }
  }
  const target = m.fighters.find((g) => g.id === mind.target && g.alive);
  const input: Input = { ...NO_INPUT };
  if (target) {
    const aimHead = hashRand(f.id, Math.floor(m.t / 120)) < p.head;
    const ty = target.y + (aimHead ? bodyHeight(target) - 0.2 : bodyHeight(target) * 0.55);
    const dx = target.x - eye[0];
    const dz = target.z - eye[2];
    const flat = Math.hypot(dx, dz);
    mind.errYaw *= 0.97;
    mind.errPitch *= 0.97;
    const wob = (k: number) => (hashRand(f.id * 7 + k, Math.floor(m.t / 6)) * 2 - 1) * p.wobble;
    const wantYaw = Math.atan2(-dx, -dz) + mind.errYaw + wob(1);
    const wantPitch = Math.atan2(ty - eye[1], flat) + mind.errPitch + wob(2);
    const dyaw = wrap(wantYaw - f.yaw);
    const dpitch = wantPitch - f.pitch;
    input.dyaw = Math.max(-p.turn, Math.min(p.turn, dyaw));
    input.dpitch = Math.max(-p.turn, Math.min(p.turn, dpitch));
    const off =
      Math.hypot(dyaw - input.dyaw, dpitch - input.dpitch) +
      Math.hypot(mind.errYaw, mind.errPitch) * 0.3;
    const sniper = w.id === 'sniper';
    input.aim = sniper || (flat > 20 && w.id === 'rifle');
    const tol = sniper ? 0.015 : 0.05 + Math.min(0.08, 1.5 / Math.max(1, flat));
    const ready = m.t - mind.seen >= p.react && (!sniper || f.aiming);
    const trigger = hashRand(f.id * 11, Math.floor(m.t / 20)) < p.trigger;
    input.fire = ready && trigger && off < tol && f.reload === 0 && !(f.prev.fire && !w.auto);
    // Strafe while fighting; keep a sensible range.
    if (m.t >= mind.strafeT) {
      mind.strafe = hashRand(f.id, m.t) < 0.5 ? -1 : 1;
      mind.strafeT = m.t + 30 + Math.floor(hashRand(m.t, f.id) * 45);
    }
    input.sx = level === 'easy' ? 0 : mind.strafe;
    input.fx = flat > (sniper ? 40 : 22) ? 1 : flat < 6 ? -0.6 : 0;
    input.jump = hashRand(f.id * 3, m.t) < p.jump;
    mind.lastX = target.x;
    mind.lastZ = target.z;
    mind.lastT = m.t;
    mind.path = [];
  } else {
    // Roam: towards the last place an enemy was seen, else a random spawn.
    const here = cellOf(f.x, f.z);
    mind.repath--;
    if (!mind.path.length || mind.repath <= 0) {
      let goal: number;
      if (m.t - mind.lastT < 360) goal = cellOf(mind.lastX, mind.lastZ);
      else {
        const s =
          map.spawns[Math.floor(hashRand(f.id, Math.floor(m.t / 300)) * map.spawns.length)]!;
        goal = s[1] * SIZE + s[0];
        if (goal === here)
          goal =
            map.spawns[(map.spawns.indexOf(s) + 3) % map.spawns.length]![1] * SIZE +
            map.spawns[(map.spawns.indexOf(s) + 3) % map.spawns.length]![0];
      }
      mind.path = findPath(map, here, goal);
      mind.repath = 150;
      if (m.t - mind.lastT < 360 && !mind.path.length) mind.lastT = -9999;
    }
    if (mind.path[0] === here) mind.path = mind.path.slice(1);
    const next = mind.path[0];
    if (next !== undefined) {
      const tx = ((next % SIZE) + 0.5) * CELL;
      const tz = (Math.floor(next / SIZE) + 0.5) * CELL;
      const want = Math.atan2(-(tx - f.x), -(tz - f.z));
      const d = wrap(want - f.yaw);
      input.dyaw = Math.max(-p.turn, Math.min(p.turn, d));
      input.dpitch = Math.max(-0.05, Math.min(0.05, -f.pitch));
      input.fx = Math.abs(d) < 0.7 ? 1 : 0.3;
      const speed = Math.hypot(f.vx, f.vz);
      mind.stuck = speed < 1 && input.fx > 0.5 ? mind.stuck + 1 : 0;
      if (mind.stuck > 20) {
        input.jump = true;
        if (mind.stuck > 60) mind.path = [];
      }
    }
    input.reload = f.ammo[f.weapon] < w.mag * 0.5 && f.reload === 0;
  }
  return [input, mind];
}

// ── The step ────────────────────────────────────────────────────────────────

function shoot(
  m: Match,
  fi: number,
  fighters: Fighter[],
  rng: RngState,
  events: string[],
  shots: Shot[],
  feed: Kill[],
): RngState {
  const f = fighters[fi]!;
  const map = mapOf(m);
  const w = weaponOf(f);
  const moving = Math.hypot(f.vx, f.vz) > 1.2 || !f.ground;
  const spread = (f.aiming ? w.aimed : w.hip) + (moving ? w.moving : 0) + f.bloom;
  const [a, r1] = rand(rng);
  const [b, r2] = rand(r1);
  const yaw = f.yaw + (a * 2 - 1) * spread;
  const pitch = f.pitch + (b * 2 - 1) * spread;
  const o: [number, number, number] = [f.x, f.y + eyeHeight(f), f.z];
  const d = direction(yaw, pitch);
  let t = traceBlocks(map, o, d, w.range);
  let victim = -1;
  let head = false;
  fighters.forEach((g, gi) => {
    if (gi === fi || !g.alive) return;
    const [tt, hh] = hitFighter(g, o, d);
    if (tt < t) {
      t = tt;
      victim = gi;
      head = hh;
    }
  });
  shots.push({
    from: o,
    to: [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t],
    by: f.id,
    t: m.t,
  });
  fighters[fi] = {
    ...f,
    ammo: f.weapon === 0 ? [f.ammo[0] - 1, f.ammo[1]] : [f.ammo[0], f.ammo[1] - 1],
    cooldown: w.rate,
    bloom: Math.min(w.bloomMax, f.bloom + w.bloom),
    pitch: Math.min(1.45, f.pitch + w.kick),
  };
  if (f.id === 0) events.push(`shot-${w.id}`);
  if (victim < 0) return r2;
  const g = fighters[victim]!;
  const falloff = w.id !== 'sniper' && t > 40 ? 0.8 : 1;
  const dmg = Math.round(w.damage * (head ? w.head : 1) * falloff);
  const hp = g.hp - dmg;
  if (f.id === 0) events.push(head ? 'hit-head' : 'hit');
  if (g.id === 0) events.push('hurt');
  if (hp > 0) {
    fighters[victim] = { ...g, hp, lastHit: m.t, lastHitBy: f.id };
    return r2;
  }
  fighters[victim] = {
    ...g,
    hp: 0,
    alive: false,
    respawn: RESPAWN,
    deaths: g.deaths + 1,
    streak: 0,
    lastHit: m.t,
    lastHitBy: f.id,
  };
  const k = fighters[fi]!;
  const streak = k.streak + 1;
  fighters[fi] = {
    ...k,
    kills: k.kills + 1,
    streak,
    bestStreak: Math.max(k.bestStreak, streak),
    headshots: k.headshots + (head ? 1 : 0),
  };
  feed.push({ killer: f.id, victim: g.id, weapon: w.id, head, t: m.t });
  if (f.id === 0) events.push(head ? 'kill-head' : 'kill');
  if (g.id === 0) events.push('die');
  return r2;
}

export function stepMatch(m: Match, input0: Input): Match {
  if (m.over) return m;
  const map = mapOf(m);
  const events: string[] = [];
  const t = m.t + 1;
  // Decide.
  const inputs: Input[] = [];
  const minds: (Mind | null)[] = [];
  m.fighters.forEach((_f, i) => {
    if (i === 0) {
      // Your own mind is tracked too, so the watch policy (the bot brain on your seat) remembers.
      inputs.push(input0);
      minds.push(think(m, 0, 'hard')[1]);
    } else {
      const [inp, mind] = think(m, i);
      inputs.push(inp);
      minds.push(mind);
    }
  });
  let rng = m.rng;
  const shots = m.shots.filter((s) => t - s.t < 8);
  const feed = m.feed.filter((k) => t - k.t < 360).slice(-5);
  const fighters: Fighter[] = m.fighters.map((f, i) => ({ ...f, mind: minds[i] ?? null }));
  for (let i = 0; i < fighters.length; i++) {
    let f = fighters[i]!;
    const input = inputs[i]!;
    if (!f.alive) {
      if (f.respawn > 1) fighters[i] = { ...f, respawn: f.respawn - 1 };
      else {
        fighters[i] = fresh(f, spawnPoint({ ...m, fighters }, f.id, t));
        if (i === 0) events.push('spawn');
      }
      continue;
    }
    f = move(map, f, input);
    // Weapon handling.
    const pressed = (k: 'crouch' | 'reload' | 'swap') => input[k] && !f.prev[k];
    if (pressed('swap')) {
      f = {
        ...f,
        weapon: f.weapon === 0 ? 1 : 0,
        reload: 0,
        cooldown: 20,
        aiming: false,
        bloom: 0,
      };
      if (i === 0) events.push('swap');
    }
    const w = weaponOf(f);
    if (
      f.reload === 0 &&
      f.ammo[f.weapon] < w.mag &&
      (pressed('reload') || f.ammo[f.weapon] === 0)
    ) {
      f = { ...f, reload: w.reload, aiming: false };
      if (i === 0) events.push('reload');
    } else if (f.reload > 0) {
      const reload = f.reload - 1;
      f =
        reload === 0
          ? { ...f, reload, ammo: f.weapon === 0 ? [w.mag, f.ammo[1]] : [f.ammo[0], w.mag] }
          : { ...f, reload };
    }
    f = {
      ...f,
      cooldown: Math.max(0, f.cooldown - 1),
      aiming: input.aim && f.reload === 0,
      bloom: f.bloom * 0.92,
    };
    // Health comes back after a while without damage.
    if (f.hp < 100 && t - f.lastHit > REGEN_DELAY) f = { ...f, hp: Math.min(100, f.hp + REGEN) };
    const wantShot = input.fire && (w.auto || !f.prev.fire);
    f = {
      ...f,
      prev: { fire: input.fire, crouch: input.crouch, reload: input.reload, swap: input.swap },
    };
    fighters[i] = f;
    if (wantShot && f.cooldown === 0 && f.reload === 0 && f.ammo[f.weapon] > 0)
      rng = shoot({ ...m, t }, i, fighters, rng, events, shots, feed);
    else if (wantShot && i === 0 && f.ammo[f.weapon] === 0) events.push('empty');
  }
  const leader = Math.max(...fighters.map((f) => f.kills));
  const over = leader >= m.goal || t >= m.limit;
  if (over) events.push(place({ ...m, fighters }) === 1 ? 'win' : 'lose');
  return { ...m, rng, t, fighters, shots, feed: feed.slice(-5), over, events };
}

/** Your place in the standings (1 = first; ties share the better place). */
export function place(m: Match): number {
  const mine = m.fighters[0]!.kills;
  return 1 + m.fighters.filter((f) => f.kills > mine).length;
}

export function standings(m: Match): Fighter[] {
  return [...m.fighters].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths || a.id - b.id);
}

/** Did you win outright? */
export function won(m: Match): boolean {
  const mine = m.fighters[0]!.kills;
  return m.fighters.every((f) => f.id === 0 || f.kills < mine);
}

// ── Discrete actions for the AI environment ─────────────────────────────────

const MOVES: Record<string, [number, number]> = {
  '': [0, 0],
  f: [1, 0],
  b: [-1, 0],
  l: [0, -1],
  r: [0, 1],
  fl: [1, -1],
  fr: [1, 1],
  bl: [-1, -1],
  br: [-1, 1],
};
const YAWS: Record<string, number> = { '': 0, L: 0.08, R: -0.08, '<': 0.02, '>': -0.02 };
const PITCHES: Record<string, number> = { '': 0, '^': 0.02, v: -0.02 };

/** `move` + `yaw` + `pitch` + `!` (fire); `idle` for none: 270 actions. */
export const ACTIONS: string[] = (() => {
  const out: string[] = [];
  for (const mv of Object.keys(MOVES))
    for (const y of Object.keys(YAWS))
      for (const p of Object.keys(PITCHES))
        for (const fire of ['', '!']) out.push(`${mv}${y}${p}${fire}` || 'idle');
  return out;
})();

const ACTION_INPUT = new Map<string, Input>();
for (const mv of Object.keys(MOVES))
  for (const y of Object.keys(YAWS))
    for (const p of Object.keys(PITCHES))
      for (const fire of ['', '!'])
        ACTION_INPUT.set(`${mv}${y}${p}${fire}` || 'idle', {
          ...NO_INPUT,
          fx: MOVES[mv]![0],
          sx: MOVES[mv]![1],
          dyaw: YAWS[y]!,
          dpitch: PITCHES[p]!,
          fire: fire === '!',
        });

export function actionInput(a: string): Input {
  return ACTION_INPUT.get(a) ?? NO_INPUT;
}

/** The nearest discrete action to an input. */
export function toAction(i: Input): string {
  const mv = `${i.fx > 0.3 ? 'f' : i.fx < -0.3 ? 'b' : ''}${i.sx < -0.3 ? 'l' : i.sx > 0.3 ? 'r' : ''}`;
  const y =
    i.dyaw > 0.05 ? 'L' : i.dyaw < -0.05 ? 'R' : i.dyaw > 0.008 ? '<' : i.dyaw < -0.008 ? '>' : '';
  const p = i.dpitch > 0.008 ? '^' : i.dpitch < -0.008 ? 'v' : '';
  return `${mv}${y}${p}${i.fire ? '!' : ''}` || 'idle';
}

export function isMatch(v: unknown): v is Match {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as Match;
  return (
    typeof m.map === 'string' &&
    m.map in MAPS &&
    Array.isArray(m.rng) &&
    Array.isArray(m.fighters) &&
    m.fighters.length > 0 &&
    typeof m.t === 'number'
  );
}
