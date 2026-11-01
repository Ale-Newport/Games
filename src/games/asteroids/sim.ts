/**
 * Space Rocks: a 400 × 400 field that wraps at every edge, simulated at 60 steps a second. Your
 * ship turns, thrusts (keeping its momentum, with a little drag) and fires up to four shots that
 * fade after a second. Large rocks split into two medium ones, medium into two small, small ones
 * vanish (20, 50, 100 points). Saucers sometimes cross and shoot at you (200 points). Hyperspace
 * jumps the ship to a random spot — sometimes into trouble. Three ships, one more every 10 000
 * points; each cleared field brings one more large rock.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 400;
export const H = 400;
const TURN = 0.075;
const THRUST = 0.09;
const DRAG = 0.992;
const MAX_SPEED = 5;
const SHOT_SPEED = 7;
const SHOT_LIFE = 60;
const MAX_SHOTS = 4;
export const SHIP_R = 9;
export const ROCK_R = [26, 14, 7];
const ROCK_POINTS = [20, 50, 100];

/** Actions: turn (l/r), thrust (t), fire (f) combined, 'idle', and 'h' for hyperspace. */
export const ACTIONS = [
  'idle',
  'f',
  't',
  'tf',
  'l',
  'lf',
  'lt',
  'ltf',
  'r',
  'rf',
  'rt',
  'rtf',
  'h',
] as const;
export type RockAction = (typeof ACTIONS)[number];

export interface Rock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 0 | 1 | 2;
  shape: number;
}

export interface Rocks {
  rng: RngState;
  level: number;
  ship: { x: number; y: number; vx: number; vy: number; a: number };
  shots: { x: number; y: number; vx: number; vy: number; life: number }[];
  rocks: Rock[];
  saucer: { x: number; y: number; vx: number; timer: number } | null;
  saucerShots: { x: number; y: number; vx: number; vy: number; life: number }[];
  saucerTimer: number;
  lives: number;
  nextLife: number;
  score: number;
  /** Steps until the ship reappears after a loss (it waits for a clear centre). */
  respawn: number;
  /** Steps of safety after (re)appearing. */
  shield: number;
  /** The fire control must be released between shots. */
  fireHeld: boolean;
  thrusting: boolean;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const wrap = (v: number, max: number) => ((v % max) + max) % max;
/** Shortest wrapped difference. */
export const delta = (a: number, b: number, max: number) => {
  let d = b - a;
  if (d > max / 2) d -= max;
  if (d < -max / 2) d += max;
  return d;
};
export const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(delta(ax, bx, W), delta(ay, by, H));

function field(level: number, rng: RngState): [Rock[], RngState] {
  let r = rng;
  const rocks: Rock[] = [];
  for (let i = 0; i < 3 + level; i++) {
    const [a, n1] = rand(r);
    const [b, n2] = rand(n1);
    const [c, n3] = rand(n2);
    r = n3;
    // Along the edges, away from the centre.
    const edge = a < 0.5;
    const x = edge ? b * W : a < 0.75 ? 10 : W - 10;
    const y = edge ? (b < 0.5 ? 10 : H - 10) : b * H;
    const angle = c * Math.PI * 2;
    const speed = 0.5 + c * 0.6 + level * 0.05;
    rocks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0,
      shape: Math.floor(c * 1000),
    });
  }
  return [rocks, r];
}

export function newRocks(seed: number): Rocks {
  const [rocks, rng] = field(1, seedRng(seed >>> 0));
  return {
    rng,
    level: 1,
    ship: { x: W / 2, y: H / 2, vx: 0, vy: 0, a: -Math.PI / 2 },
    shots: [],
    rocks,
    saucer: null,
    saucerShots: [],
    saucerTimer: 1500,
    lives: 3,
    nextLife: 10000,
    score: 0,
    respawn: 0,
    shield: 120,
    fireHeld: false,
    thrusting: false,
    over: false,
    events: [],
    steps: 0,
  };
}

export function stepRocks(s: Rocks, action: RockAction): Rocks {
  if (s.over) return s;
  let rng = s.rng;
  const events: string[] = [];
  let ship = { ...s.ship };
  let shots = s.shots.map((x) => ({ ...x }));
  let rocks = s.rocks.map((r) => ({ ...r }));
  let saucer = s.saucer ? { ...s.saucer } : null;
  let saucerShots = s.saucerShots.map((x) => ({ ...x }));
  let { lives, score, respawn, shield, saucerTimer, nextLife, level, fireHeld } = s;
  const alive = respawn === 0;
  let thrusting = false;

  if (alive) {
    shield = Math.max(0, shield - 1);
    if (action.includes('l')) ship.a -= TURN;
    if (action.includes('r')) ship.a += TURN;
    if (action.includes('t')) {
      ship.vx += Math.cos(ship.a) * THRUST;
      ship.vy += Math.sin(ship.a) * THRUST;
      thrusting = true;
    }
    const sp = Math.hypot(ship.vx, ship.vy);
    if (sp > MAX_SPEED) {
      ship.vx *= MAX_SPEED / sp;
      ship.vy *= MAX_SPEED / sp;
    }
    ship.vx *= DRAG;
    ship.vy *= DRAG;
    ship.x = wrap(ship.x + ship.vx, W);
    ship.y = wrap(ship.y + ship.vy, H);
    const firing = action.includes('f');
    if (firing && !fireHeld && shots.length < MAX_SHOTS) {
      shots.push({
        x: ship.x + Math.cos(ship.a) * SHIP_R,
        y: ship.y + Math.sin(ship.a) * SHIP_R,
        vx: ship.vx + Math.cos(ship.a) * SHOT_SPEED,
        vy: ship.vy + Math.sin(ship.a) * SHOT_SPEED,
        life: SHOT_LIFE,
      });
      events.push('shoot');
    }
    fireHeld = firing;
    if (action === 'h') {
      const [a, n1] = rand(rng);
      const [b, n2] = rand(n1);
      rng = n2;
      ship = { x: a * W, y: b * H, vx: 0, vy: 0, a: ship.a };
      events.push('hyper');
    }
  } else {
    respawn--;
    // Reappear only when the centre is clear.
    if (respawn === 0 && rocks.some((r) => dist(r.x, r.y, W / 2, H / 2) < ROCK_R[r.size]! + 50))
      respawn = 1;
    if (respawn === 0) {
      ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, a: -Math.PI / 2 };
      shield = 120;
    }
  }

  // Moving things.
  for (const r of rocks) {
    r.x = wrap(r.x + r.vx, W);
    r.y = wrap(r.y + r.vy, H);
  }
  shots = shots
    .map((p) => ({ ...p, x: wrap(p.x + p.vx, W), y: wrap(p.y + p.vy, H), life: p.life - 1 }))
    .filter((p) => p.life > 0);
  saucerShots = saucerShots
    .map((p) => ({ ...p, x: wrap(p.x + p.vx, W), y: wrap(p.y + p.vy, H), life: p.life - 1 }))
    .filter((p) => p.life > 0);

  // Shots against rocks and the saucer.
  const split: Rock[] = [];
  shots = shots.filter((p) => {
    const i = rocks.findIndex((r) => dist(p.x, p.y, r.x, r.y) < ROCK_R[r.size]!);
    if (i >= 0) {
      const r = rocks[i]!;
      rocks.splice(i, 1);
      score += ROCK_POINTS[r.size]!;
      events.push(r.size === 0 ? 'boom-large' : 'boom');
      if (r.size < 2) {
        for (const turn of [-0.8, 0.8]) {
          const a = Math.atan2(r.vy, r.vx) + turn;
          const sp = Math.hypot(r.vx, r.vy) * 1.35 + 0.2;
          split.push({
            x: r.x,
            y: r.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            size: (r.size + 1) as 1 | 2,
            shape: r.shape * 7 + (turn > 0 ? 1 : 2),
          });
        }
      }
      return false;
    }
    if (saucer && dist(p.x, p.y, saucer.x, saucer.y) < 12) {
      score += 200;
      saucer = null;
      events.push('saucer-down');
      return false;
    }
    return true;
  });
  rocks.push(...split);

  // The saucer.
  if (saucer) {
    saucer.x += saucer.vx;
    saucer.y = wrap(saucer.y + Math.sin(s.steps / 40) * 0.8, H);
    if (--saucer.timer <= 0 && alive) {
      const [a, n] = rand(rng);
      rng = n;
      // Aims roughly at the ship (less roughly as the levels go on).
      const err = (a - 0.5) * Math.max(0.2, 1 - level * 0.15);
      const ang = Math.atan2(delta(saucer.y, ship.y, H), delta(saucer.x, ship.x, W)) + err;
      saucerShots.push({
        x: saucer.x,
        y: saucer.y,
        vx: Math.cos(ang) * 4,
        vy: Math.sin(ang) * 4,
        life: 80,
      });
      saucer.timer = 70;
      events.push('saucer-shot');
    }
    if (saucer.x < -20 || saucer.x > W + 20) saucer = null;
  } else if (--saucerTimer <= 0) {
    const [a, n] = rand(rng);
    rng = n;
    const fromLeft = a < 0.5;
    saucer = {
      x: fromLeft ? -15 : W + 15,
      y: 40 + a * (H - 80),
      vx: fromLeft ? 1.4 : -1.4,
      timer: 60,
    };
    saucerTimer = 1200 + Math.floor(a * 900);
    events.push('saucer');
  }

  // The ship against rocks, the saucer and its shots.
  if (alive && respawn === 0 && shield === 0) {
    const hitRock = rocks.findIndex(
      (r) => dist(ship.x, ship.y, r.x, r.y) < ROCK_R[r.size]! + SHIP_R - 3,
    );
    const hitShot = saucerShots.findIndex((p) => dist(ship.x, ship.y, p.x, p.y) < SHIP_R);
    const hitSaucer = saucer && dist(ship.x, ship.y, saucer.x, saucer.y) < SHIP_R + 10;
    if (hitRock >= 0 || hitShot >= 0 || hitSaucer) {
      if (hitShot >= 0) saucerShots.splice(hitShot, 1);
      if (hitSaucer) saucer = null;
      lives--;
      events.push('crash');
      shots = [];
      if (lives <= 0)
        return {
          ...s,
          rng,
          ship,
          shots,
          rocks,
          saucer,
          saucerShots,
          lives: 0,
          score,
          respawn: 0,
          shield,
          over: true,
          events: [...events, 'over'],
          steps: s.steps + 1,
        };
      respawn = 120;
    }
  }

  if (score >= nextLife) {
    lives++;
    nextLife += 10000;
    events.push('extra');
  }
  if (rocks.length === 0) {
    level++;
    const [f, n] = field(level, rng);
    rng = n;
    rocks = f;
    events.push('level');
  }
  return {
    ...s,
    rng,
    level,
    ship,
    shots,
    rocks,
    saucer,
    saucerShots,
    saucerTimer,
    lives,
    nextLife,
    score,
    respawn,
    shield,
    fireHeld,
    thrusting,
    events,
    steps: s.steps + 1,
  };
}

/**
 * A pilot: turn to lead the most urgent target (the nearest rock, or the saucer), fire when lined
 * up, thrust away from a rock about to hit, and jump to hyperspace only when cornered.
 */
export function pilotPolicy(s: Rocks): RockAction {
  if (s.respawn > 0) return 'idle';
  const { ship } = s;
  // Threats: rocks closing in within a short horizon.
  let worst: Rock | null = null;
  let soonest = Infinity;
  for (const r of s.rocks) {
    const dx = delta(ship.x, r.x, W);
    const dy = delta(ship.y, r.y, H);
    const rvx = r.vx - ship.vx;
    const rvy = r.vy - ship.vy;
    const t = -(dx * rvx + dy * rvy) / Math.max(1e-6, rvx * rvx + rvy * rvy);
    const tt = Math.max(0, Math.min(90, t));
    const miss = Math.hypot(dx + rvx * tt, dy + rvy * tt);
    if (miss < ROCK_R[r.size]! + SHIP_R + 6 && tt < soonest) {
      soonest = tt;
      worst = r;
    }
  }
  // Target: lead the nearest rock (or the saucer).
  const targets: { x: number; y: number; vx: number; vy: number }[] = s.saucer
    ? [{ x: s.saucer.x, y: s.saucer.y, vx: s.saucer.vx, vy: 0 }]
    : [];
  targets.push(...s.rocks);
  let aim = ship.a;
  let best = Infinity;
  for (const t of targets) {
    const d = dist(ship.x, ship.y, t.x, t.y);
    const time = d / SHOT_SPEED;
    const ax = delta(ship.x, t.x + t.vx * time, W);
    const ay = delta(ship.y, t.y + t.vy * time, H);
    const score = d - (worst === t ? 200 : 0);
    if (score < best) {
      best = score;
      aim = Math.atan2(ay, ax);
    }
  }
  let diff = aim - ship.a;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const turn = diff > TURN / 2 ? 'r' : diff < -TURN / 2 ? 'l' : '';
  const fire = Math.abs(diff) < 0.12 && best < 260 ? 'f' : '';
  // Dodge: thrust when a rock will hit soon and we are not facing it.
  let thrust = '';
  if (worst && soonest < 40) {
    const away = Math.atan2(-delta(ship.y, worst.y, H), -delta(ship.x, worst.x, W));
    if (Math.abs(Math.atan2(Math.sin(away - ship.a), Math.cos(away - ship.a))) < 1.2) thrust = 't';
    if (
      soonest < 8 &&
      s.shield === 0 &&
      dist(ship.x, ship.y, worst.x, worst.y) < ROCK_R[worst.size]! + SHIP_R + 4
    )
      return 'h';
  }
  const a = `${turn}${thrust}${fire}`;
  return (a || 'idle') as RockAction;
}

/** A simple player: spins slowly and fires. */
export function turretPolicy(s: Rocks): RockAction {
  return s.steps % 2 ? 'rf' : 'r';
}

export function isRocks(d: unknown): d is Rocks {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Rocks;
  return (
    Array.isArray(s.rng) &&
    typeof s.ship === 'object' &&
    Array.isArray(s.rocks) &&
    Number.isFinite(s.score) &&
    Number.isInteger(s.lives)
  );
}
