/**
 * Painted Night Ride: ride a bicycle over moonlit hills around a sleeping village, gather glowing
 * star orbs and carry them to the church steeple, where each one becomes a new star in the swirling
 * sky. Pedal, brake, steer, leap off the ground and spin tricks in the air (a spin finished before
 * landing scores; landing mid-spin is a bail), or get off and walk. Fixed 60 Hz steps; the land and
 * the orbs come from a seed.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const HZ = 60;
const DT = 1 / HZ;
export const WORLD_R = 125;
export const STEEPLE: [number, number] = [0, -14];
export const DELIVER_R = 7;
export const PICK_R = 2.6;
const GRAVITY = 20;

export type Mode = 'starlight' | 'constellation' | 'free';
export const ORBS: Record<Mode, number> = { starlight: 12, constellation: 24, free: 24 };

export interface Orb {
  x: number;
  z: number;
  y: number;
  taken: boolean;
}

/** Houses and trees you cannot ride through: [x, z, radius]. */
export interface World {
  seed: number;
  phase: [number, number, number, number];
  obstacles: [number, number, number][];
}

export interface Ride {
  mode: Mode;
  world: World;
  rng: RngState;
  t: number;
  x: number;
  z: number;
  y: number;
  vy: number;
  yaw: number;
  speed: number;
  ground: boolean;
  walking: boolean;
  /** Trick spin so far (radians) in the current jump, and whether E is held. */
  spin: number;
  spinning: boolean;
  /** Steps left of being dazed after a bail. */
  dazed: number;
  orbs: Orb[];
  carried: number;
  delivered: number;
  tricks: number;
  trickScore: number;
  /** Distance travelled (for wheel and leg animation). */
  travelled: number;
  prevLeap: boolean;
  prevWalk: boolean;
  over: boolean;
  events: string[];
}

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

/** Ground height at (x, z): rolling hills, a flat village in the middle, rising to the rim. */
export function heightAt(w: World, x: number, z: number): number {
  const [a, b, c, d] = w.phase;
  let h =
    4.2 * Math.sin(x * 0.031 + a) * Math.cos(z * 0.027 + b) +
    2.4 * Math.sin(x * 0.067 + z * 0.052 + c) +
    1.1 * Math.sin(z * 0.11 - x * 0.04 + d);
  const r = Math.hypot(x, z - STEEPLE[1] * 0.5);
  const flat = Math.min(1, Math.max(0, (r - 18) / 16));
  h *= flat;
  const rim = Math.hypot(x, z);
  if (rim > WORLD_R - 25) h += (rim - (WORLD_R - 25)) * 0.9;
  return h;
}

export function makeWorld(seed: number): World {
  let r = seedRng(seed >>> 0);
  const p: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [v, n] = rand(r);
    r = n;
    p.push(v * Math.PI * 2);
  }
  const obstacles: [number, number, number][] = [[STEEPLE[0], STEEPLE[1], 3.2]];
  // Village houses in a loose ring, and two cypresses.
  for (let i = 0; i < 14; i++) {
    const [u, n1] = rand(r);
    const [v, n2] = rand(n1);
    r = n2;
    const a = (i / 14) * Math.PI * 2 + u * 0.3;
    const d = 9 + v * 12;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d - 4;
    if (Math.hypot(x - STEEPLE[0], z - STEEPLE[1]) < 8) continue;
    // Leave room to ride between cottages.
    if (obstacles.some(([ox, oz, or]) => Math.hypot(ox - x, oz - z) < or + 2.2 + 3)) continue;
    obstacles.push([x, z, 2.2]);
  }
  obstacles.push([-26, 16, 1.2], [30, -30, 1.2]);
  return { seed, phase: p as [number, number, number, number], obstacles };
}

export function newRide(seed: number, mode: Mode): Ride {
  const world = makeWorld(seed);
  let rng = seedRng((seed ^ 0x5eed) >>> 0);
  const orbs: Orb[] = [];
  while (orbs.length < ORBS[mode]) {
    const [u, r1] = rand(rng);
    const [v, r2] = rand(r1);
    rng = r2;
    const a = u * Math.PI * 2;
    const d = 30 + Math.sqrt(v) * (WORLD_R - 45);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (orbs.some((o) => Math.hypot(o.x - x, o.z - z) < 12)) continue;
    // Some float high: you need a leap to reach them.
    const [hgt, r3] = rand(rng);
    rng = r3;
    orbs.push({ x, z, y: heightAt(world, x, z) + (hgt < 0.3 ? 3.2 : 1.2), taken: false });
  }
  return {
    mode,
    world,
    rng,
    t: 0,
    // Start outside the village, facing the steeple.
    x: 0,
    z: 30,
    y: heightAt(world, 0, 30),
    vy: 0,
    yaw: 0,
    speed: 0,
    ground: true,
    walking: false,
    spin: 0,
    spinning: false,
    dazed: 0,
    orbs,
    carried: 0,
    delivered: 0,
    tricks: 0,
    trickScore: 0,
    travelled: 0,
    prevLeap: false,
    prevWalk: false,
    over: false,
    events: [],
  };
}

export interface Controls {
  pedal: boolean;
  brake: boolean;
  steer: number;
  leap: boolean;
  trick: boolean;
  walk: boolean;
}

export const NONE: Controls = {
  pedal: false,
  brake: false,
  steer: 0,
  leap: false,
  trick: false,
  walk: false,
};

export function stepRide(r: Ride, c: Controls): Ride {
  if (r.over) return r;
  const w = r.world;
  const events: string[] = [];
  let {
    x,
    z,
    y,
    vy,
    yaw,
    speed,
    ground,
    walking,
    spin,
    spinning,
    dazed,
    carried,
    delivered,
    tricks,
    trickScore,
  } = r;
  if (c.walk && !r.prevWalk && ground) {
    walking = !walking;
    speed = Math.min(speed, 3);
    events.push(walking ? 'dismount' : 'mount');
  }
  const max = walking ? 4 : 14;
  if (dazed > 0) {
    dazed--;
    speed *= 0.9;
  } else if (ground) {
    if (c.pedal) speed += (walking ? 12 : 8) * DT;
    else if (c.brake) speed -= (speed > 0 ? 18 : 4) * DT;
    else speed -= Math.sign(speed) * Math.min(Math.abs(speed), 0.8 * DT);
    // Slopes: downhill speeds you up, uphill slows you down (not on foot).
    if (!walking) {
      const ahead = heightAt(w, x - Math.sin(yaw), z - Math.cos(yaw)) - heightAt(w, x, z);
      speed -= ahead * 7 * DT;
    }
    speed = Math.max(walking ? -2 : -3, Math.min(max, speed));
  }
  const turn = (walking ? 2.6 : 1.9 * Math.min(1, 0.35 + Math.abs(speed) / 8)) * c.steer * DT;
  if (dazed === 0) yaw -= turn;
  // Leap.
  if (c.leap && !r.prevLeap && ground && dazed === 0) {
    vy = walking ? 5 : 8.5;
    ground = false;
    spin = 0;
    events.push('leap');
  }
  // Move, sliding around houses and trees.
  let nx = x - Math.sin(yaw) * speed * DT;
  let nz = z - Math.cos(yaw) * speed * DT;
  for (const [ox, oz, or] of w.obstacles) {
    const d = Math.hypot(nx - ox, nz - oz);
    if (d < or + 0.6) {
      const k = (or + 0.6) / (d || 1);
      nx = ox + (nx - ox) * k;
      nz = oz + (nz - oz) * k;
      speed *= 0.6;
    }
  }
  const rim = Math.hypot(nx, nz);
  if (rim > WORLD_R) {
    nx *= WORLD_R / rim;
    nz *= WORLD_R / rim;
    speed *= 0.5;
  }
  const travelled = r.travelled + Math.hypot(nx - x, nz - z);
  x = nx;
  z = nz;
  const floor = heightAt(w, x, z);
  if (ground) y = floor;
  else {
    vy -= GRAVITY * DT;
    y += vy * DT;
    // Tricks: spin while E is held in the air.
    spinning = c.trick && !walking;
    if (spinning) spin += 9 * DT;
    if (y <= floor) {
      y = floor;
      vy = 0;
      ground = true;
      const full = Math.floor(spin / (Math.PI * 2) + 0.02);
      const rest = spin - full * Math.PI * 2;
      if (rest > 0.6 && rest < Math.PI * 2 - 0.3) {
        dazed = 50;
        events.push('bail');
      } else if (full > 0) {
        tricks += full;
        trickScore += 100 * full * full;
        events.push(full > 1 ? 'combo' : 'trick');
      } else events.push('land');
      spin = 0;
      spinning = false;
    }
  }
  // Orbs.
  const orbs = r.orbs.map((o) => {
    if (o.taken) return o;
    if (Math.hypot(o.x - x, o.z - z) < PICK_R && Math.abs(o.y - (y + 1.0)) < 1.4) {
      carried++;
      events.push('orb');
      return { ...o, taken: true };
    }
    return o;
  });
  if (carried > 0 && Math.hypot(x - STEEPLE[0], z - STEEPLE[1]) < DELIVER_R) {
    delivered += carried;
    carried = 0;
    events.push('deliver');
  }
  const over = r.mode !== 'free' && delivered >= r.orbs.length;
  if (over) events.push('finish');
  return {
    ...r,
    t: r.t + 1,
    x,
    z,
    y,
    vy,
    yaw,
    speed,
    ground,
    walking,
    spin,
    spinning,
    dazed,
    orbs,
    carried,
    delivered,
    tricks,
    trickScore,
    travelled,
    prevLeap: c.leap,
    prevWalk: c.walk,
    over,
    events,
  };
}

/** The score: points per star delivered, trick points, and a bonus for finishing quickly. */
export function score(r: Ride): number {
  const time = r.over ? Math.max(0, 600 - r.t / HZ) * 10 : 0;
  return r.delivered * 500 + r.trickScore + Math.round(time);
}

// ── Discrete actions for the AI environment and the courier policy ──────────

export const ACTIONS: string[] = (() => {
  const out: string[] = [];
  for (const m of ['', 'w', 's'])
    for (const t of ['', 'a', 'd'])
      for (const e of ['', 'j', 'e', 'je']) out.push(`${m}${t}${e}` || 'idle');
  out.push('f');
  return out;
})();

export function controlsOf(a: string): Controls {
  if (a === 'idle') return NONE;
  return {
    pedal: a.includes('w'),
    brake: a.includes('s'),
    steer: a.includes('a') ? -1 : a.includes('d') ? 1 : 0,
    leap: a.includes('j'),
    trick: a.includes('e'),
    walk: a === 'f',
  };
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Rides to the nearest orb, leaping for the high ones, and home to the steeple with a load. */
export function courier(r: Ride): string {
  if (r.walking) return 'f';
  const left = r.orbs.filter((o) => !o.taken);
  const home = r.carried >= 4 || (!left.length && r.carried > 0);
  let tx = STEEPLE[0];
  let tz = STEEPLE[1];
  let high = false;
  if (!home && left.length) {
    const o = left.reduce((a, b) =>
      Math.hypot(b.x - r.x, b.z - r.z) < Math.hypot(a.x - r.x, a.z - r.z) ? b : a,
    );
    tx = o.x;
    tz = o.z;
    high = o.y - heightAt(r.world, o.x, o.z) > 2;
  }
  // Something in the way: aim beside it instead (the side the path already leans to).
  const dx0 = tx - r.x;
  const dz0 = tz - r.z;
  const len = Math.hypot(dx0, dz0) || 1;
  let blocker: [number, number, number] | null = null;
  let nearest = Infinity;
  for (const ob of r.world.obstacles) {
    const k = ((ob[0] - r.x) * dx0 + (ob[1] - r.z) * dz0) / (len * len);
    if (k <= 0 || k >= 1) continue;
    const px = r.x + dx0 * k - ob[0];
    const pz = r.z + dz0 * k - ob[1];
    if (Math.hypot(px, pz) < ob[2] + 1.4 && k * len < nearest) {
      nearest = k * len;
      blocker = ob;
    }
  }
  if (blocker) {
    // Perpendicular to the path, on the path's side of the obstacle.
    let nx = -dz0 / len;
    let nz = dx0 / len;
    const side = (r.x + dx0 * 0.5 - blocker[0]) * nx + (r.z + dz0 * 0.5 - blocker[1]) * nz;
    if (side < 0) {
      nx = -nx;
      nz = -nz;
    }
    tx = blocker[0] + nx * (blocker[2] + 3.5);
    tz = blocker[1] + nz * (blocker[2] + 3.5);
  }
  const want = Math.atan2(-(tx - r.x), -(tz - r.z));
  const d = wrap(want - r.yaw);
  const dist = Math.hypot(tx - r.x, tz - r.z);
  // Too close and off to the side: back off straight to get room to turn.
  if (dist < 4 && Math.abs(d) > 0.6 && !blocker) return 's';
  // Pressed against a wall: back away.
  const touching = r.world.obstacles.some(
    ([ox, oz, or]) =>
      Math.hypot(ox - r.x, oz - r.z) < or + 0.9 &&
      (ox - r.x) * -Math.sin(r.yaw) + (oz - r.z) * -Math.cos(r.yaw) > 0,
  );
  if (touching && Math.abs(r.speed) < 0.5) return d > 0 ? 'sd' : 'sa';
  const turn = d > 0.08 ? 'a' : d < -0.08 ? 'd' : '';
  // Slow down near the target when it is off to the side, so it does not circle round it.
  const tight = dist < 10 && Math.abs(d) > 0.35;
  const pedal = tight ? (r.speed > 3 ? 's' : '') : Math.abs(d) < 1.2 || r.speed < 4 ? 'w' : '';
  const leap = high && Math.abs(d) < 0.4 && dist < 2 + r.speed * 0.4 && r.ground ? 'j' : '';
  // A spin on a full leap (there is just time for one).
  const trick = !r.ground && (r.vy > 7.5 || r.spin > 0) && r.spin < Math.PI * 2 ? 'e' : '';
  return `${pedal}${turn}${leap}${trick}` || 'idle';
}

export function isRide(v: unknown): v is Ride {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Ride;
  return (
    (r.mode === 'starlight' || r.mode === 'constellation' || r.mode === 'free') &&
    typeof r.world === 'object' &&
    Array.isArray(r.world.phase) &&
    Array.isArray(r.orbs) &&
    [r.x, r.z, r.y, r.t].every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}
