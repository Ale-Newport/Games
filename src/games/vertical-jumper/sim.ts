/**
 * Cloud Climber: a vertical jumping game with an original name and look, at 60 steps a second. A
 * little climber bounces by itself every time she lands on a cloud; the player only steers left
 * and right (the sides wrap round). The view follows her up; dropping below it ends the climb.
 * Higher up some clouds drift, thin clouds burst under her without a bounce, springs throw her
 * much higher and storm sprites patrol — touching one is fatal unless she lands on it from above,
 * which pops it with a bounce. Score: the height reached in metres.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 240;
export const H = 360;
export const CLOUD_W = 40;
const HALF_W = 8;
const BODY_H = 20;
const GRAVITY = 0.25;
export const BOUNCE = -8.5;
export const SPRING = -13;
const ACCEL = 0.45;
const MAX_VX = 4;
const MAX_FALL = 9;
/** 10 px = 1 m. */
export const metres = (y: number) => Math.max(0, Math.floor(-y / 10));

export type ClimbAction = 'idle' | 'left' | 'right';
export const ACTIONS: readonly ClimbAction[] = ['idle', 'left', 'right'];

export interface Cloud {
  x: number;
  /** Top, in world y (up is negative). */
  y: number;
  kind: 'solid' | 'drift' | 'thin' | 'spring';
  /** Drift speed (drifting clouds). */
  vx: number;
  gone: boolean;
}

export interface Sprite {
  x: number;
  y: number;
  vx: number;
  gone: boolean;
}

export interface Climber {
  x: number;
  /** Feet, world y. */
  y: number;
  vx: number;
  vy: number;
}

export interface Climb {
  rng: RngState;
  clouds: Cloud[];
  sprites: Sprite[];
  me: Climber;
  /** The highest the feet have been (world y, so the smallest). */
  top: number;
  /** World y of the top of the view. */
  cam: number;
  /** World y of the next cloud on the guaranteed path. */
  nextPath: number;
  pops: number;
  springs: number;
  dying: number;
  over: boolean;
  cause: '' | 'fall' | 'sprite';
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** How hard the climb is at world y: 0 at the ground, 1 from 6000 m up. */
const hardAt = (y: number) => Math.min(1, Math.max(0, -y) / 60000);

/** Adds clouds and sprites up to world y `until`. The path clouds are never more than 100 px apart. */
function extend(
  s: { rng: RngState; clouds: Cloud[]; sprites: Sprite[]; nextPath: number },
  until: number,
) {
  let rng = s.rng;
  const r = () => {
    const [v, n] = rand(rng);
    rng = n;
    return v;
  };
  while (s.nextPath > until) {
    const y = s.nextPath;
    const hard = hardAt(y);
    const roll = r();
    const kind: Cloud['kind'] =
      roll < 0.06 ? 'spring' : roll < 0.06 + hard * 0.45 ? 'drift' : 'solid';
    const x = Math.round(r() * (W - CLOUD_W));
    s.clouds.push({
      x,
      y,
      kind,
      vx: kind === 'drift' ? (r() < 0.5 ? -1 : 1) * (0.6 + hard) : 0,
      gone: false,
    });
    // Thin clouds as decoys between path clouds, more of them higher up.
    if (r() < 0.25 + hard * 0.4)
      s.clouds.push({
        x: Math.round(r() * (W - CLOUD_W)),
        y: y - Math.round(15 + r() * 30),
        kind: 'thin',
        vx: 0,
        gone: false,
      });
    // Storm sprites from 300 m up, never right on a path cloud's line.
    if (y < -3000 && r() < 0.04 + hard * 0.08)
      s.sprites.push({
        x: Math.round(r() * (W - 20)) + 10,
        y: y - 45,
        vx: r() < 0.5 ? -0.8 : 0.8,
        gone: false,
      });
    const gap = 40 + r() * (20 + hard * 40);
    s.nextPath = y - Math.round(gap);
  }
  s.rng = rng;
}

export function newClimb(seed: number): Climb {
  const w = {
    rng: seedRng(seed >>> 0),
    clouds: [{ x: W / 2 - CLOUD_W / 2, y: 0, kind: 'solid' as const, vx: 0, gone: false }],
    sprites: [] as Sprite[],
    nextPath: -60,
  };
  extend(w, -H - 200);
  return {
    ...w,
    me: { x: W / 2, y: 0, vx: 0, vy: BOUNCE },
    top: 0,
    cam: -H + 60,
    pops: 0,
    springs: 0,
    dying: 0,
    over: false,
    cause: '',
    events: [],
    steps: 0,
  };
}

const wrap = (x: number) => ((x % W) + W) % W;
/** Horizontal overlap on the wrapping screen. */
const near = (a: number, b: number, d: number) => {
  const dx = Math.abs(wrap(a) - wrap(b));
  return Math.min(dx, W - dx) < d;
};

export interface Moved {
  me: Climber;
  /** What she bounced off this step, if anything. */
  bounced: Cloud | Sprite | null;
  spring: boolean;
  burst: Cloud | null;
  dead: boolean;
}

/** Moves the climber one step among the given clouds and sprites (shared by the game and the planner). */
export function move(
  m0: Climber,
  action: ClimbAction,
  clouds: readonly Cloud[],
  sprites: readonly Sprite[],
): Moved {
  const m = { ...m0 };
  if (action === 'left') m.vx = Math.max(-MAX_VX, m.vx - ACCEL);
  else if (action === 'right') m.vx = Math.min(MAX_VX, m.vx + ACCEL);
  else m.vx *= 0.85;
  const y0 = m.y;
  m.vy = Math.min(MAX_FALL, m.vy + GRAVITY);
  m.y += m.vy;
  m.x = wrap(m.x + m.vx);
  const out: Moved = { me: m, bounced: null, spring: false, burst: null, dead: false };
  if (m.vy > 0) {
    // Landing on a sprite pops it; on a cloud, bounces (a thin cloud bursts instead).
    for (const sp of sprites)
      if (!sp.gone && near(m.x, sp.x, HALF_W + 9) && y0 <= sp.y - 8 && m.y >= sp.y - 8) {
        m.y = sp.y - 8;
        m.vy = BOUNCE;
        out.bounced = sp;
        return out;
      }
    for (const c of clouds) {
      if (c.gone || !(y0 <= c.y && m.y >= c.y)) continue;
      const cx = c.x + CLOUD_W / 2;
      if (!near(m.x, cx, CLOUD_W / 2 + HALF_W - 2)) continue;
      if (c.kind === 'thin') {
        out.burst = c;
        continue;
      }
      m.y = c.y;
      m.vy = c.kind === 'spring' && near(m.x, cx, 8 + HALF_W) ? SPRING : BOUNCE;
      out.spring = m.vy === SPRING;
      out.bounced = c;
      return out;
    }
  }
  for (const sp of sprites)
    if (!sp.gone && near(m.x, sp.x, HALF_W + 8) && m.y > sp.y - 8 && m.y - BODY_H < sp.y + 8) {
      out.dead = true;
      return out;
    }
  return out;
}

/** Drifting clouds and sprites move between the sides. */
function drift<T extends { x: number; vx: number }>(o: T, w: number): T {
  let x = o.x + o.vx;
  let vx = o.vx;
  if (x < 0 || x > W - w) {
    vx = -vx;
    x = Math.max(0, Math.min(W - w, x));
  }
  return { ...o, x, vx };
}

export function stepClimb(s0: Climb, action: ClimbAction): Climb {
  if (s0.over) return s0;
  const s: Climb = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.dying > 0) {
    s.dying--;
    s.me = { ...s.me, y: s.me.y + 5 };
    if (s.dying === 0) return { ...s, over: true, events: ['over'] };
    return s;
  }
  let clouds = s.clouds.map((c) => (c.kind === 'drift' ? drift(c, CLOUD_W) : c));
  let sprites = s.sprites.map((sp) => drift(sp, 0));
  const mv = move(s.me, action, clouds, sprites);
  s.me = mv.me;
  if (mv.dead) {
    s.cause = 'sprite';
    s.dying = 60;
    s.events.push('hit');
    s.clouds = clouds;
    s.sprites = sprites;
    return s;
  }
  if (mv.burst) {
    clouds = clouds.map((c) => (c === mv.burst ? { ...c, gone: true } : c));
    s.events.push('burst');
  }
  if (mv.bounced) {
    if ('kind' in mv.bounced) s.events.push(mv.spring ? 'spring' : 'bounce');
    else {
      sprites = sprites.map((sp) => (sp === mv.bounced ? { ...sp, gone: true } : sp));
      s.pops++;
      s.events.push('pop');
    }
    if (mv.spring) s.springs++;
  }
  const before = metres(s.top);
  s.top = Math.min(s.top, s.me.y);
  if (Math.floor(metres(s.top) / 100) > Math.floor(before / 100)) s.events.push('milestone');
  // The view rises to keep her in its upper half, never falls back.
  s.cam = Math.min(s.cam, s.me.y - H * 0.45);
  if (s.me.y > s.cam + H + 10) {
    s.cause = 'fall';
    s.dying = 45;
    s.events.push('fall');
  }
  const w = {
    rng: s.rng,
    clouds: clouds.filter((c) => c.y < s.cam + H + 40 && !(c.gone && c.y > s.cam + H)),
    sprites: sprites.filter((sp) => sp.y < s.cam + H + 40),
    nextPath: s.nextPath,
  };
  extend(w, s.cam - 200);
  s.rng = w.rng;
  s.clouds = w.clouds;
  s.sprites = w.sprites;
  s.nextPath = w.nextPath;
  return s;
}

export const scoreOf = (s: Climb) => metres(s.top);

/** Whether holding `a` for the next 45 steps (a rise and the start of the fall) touches no sprite. */
function safeRise(
  m0: Climber,
  a: ClimbAction,
  clouds: readonly Cloud[],
  sprites0: readonly Sprite[],
): boolean {
  let m = m0;
  let sprites = sprites0;
  for (let k = 0; k < 45; k++) {
    sprites = sprites.map((sp) => drift(sp, 0));
    const mv = move(m, a, clouds, sprites);
    if (mv.dead) return false;
    m = mv.me;
  }
  return true;
}

/**
 * A planner: tries holding left, right or nothing, or one of them and then another after 4, 8, 16
 * or 32 steps, each played forward (with the clouds and sprites drifting) until the next bounce,
 * and steers by the plan whose bounce is highest — never one that ends on a sprite's side, in a
 * fall or on nothing at all, nor one that leaves no safe way up past a sprite. Spring bounces count
 * as 150 px higher.
 */
export function plannerPolicy(s: Climb): ClimbAction {
  if (s.over || s.dying) return 'idle';
  let best = -Infinity;
  let pick: ClimbAction = 'idle';
  const view = (c: { y: number }) => c.y > s.cam - 400 && c.y < s.cam + H + 20;
  const clouds0 = s.clouds.filter(view);
  const sprites0 = s.sprites.filter((sp) => !sp.gone && view(sp));
  for (const a of ACTIONS)
    for (const at of [999, 4, 8, 16, 32])
      for (const b of at === 999 ? (['idle'] as const) : ACTIONS) {
        if (at !== 999 && b === a) continue;
        let m = s.me;
        let clouds = clouds0;
        let sprites = sprites0;
        let value = -Infinity;
        for (let k = 0; k < 160; k++) {
          clouds = clouds.map((c) => (c.kind === 'drift' ? drift(c, CLOUD_W) : c));
          sprites = sprites.map((sp) => drift(sp, 0));
          const mv = move(m, k < at ? a : b, clouds, sprites);
          if (mv.dead) break;
          m = mv.me;
          if (mv.burst) clouds = clouds.filter((c) => c !== mv.burst);
          if (m.y > Math.min(s.cam, m.y - H * 0.45) + H) break;
          if (mv.bounced) {
            value = -m.y + (mv.spring ? 150 : 0) - k * 0.05;
            // A bounce that no steering can carry safely past the sprites above is a trap.
            if (sprites.length && !ACTIONS.some((c) => safeRise(m, c, clouds, sprites)))
              value -= 1000;
            break;
          }
        }
        if (value > best) {
          best = value;
          pick = a;
        }
      }
  return pick;
}

/**
 * A simple drifter: works out from her speed where she last bounced and steers straight for the
 * nearest cloud (not a thin one) above that; it ignores the sprites and the drift of the clouds.
 */
export function drifterPolicy(s: Climb): ClimbAction {
  if (s.over || s.dying) return 'idle';
  const from = s.me.y - (s.me.vy * s.me.vy - BOUNCE * BOUNCE) / (2 * GRAVITY);
  const target = s.clouds
    .filter((c) => !c.gone && c.kind !== 'thin' && c.y < from - 10)
    .sort((a, b) => b.y - a.y)[0];
  if (!target) return 'idle';
  let dx = target.x + CLOUD_W / 2 - s.me.x;
  if (dx > W / 2) dx -= W;
  if (dx < -W / 2) dx += W;
  return Math.abs(dx) < 6 ? 'idle' : dx > 0 ? 'right' : 'left';
}

export function isClimb(d: unknown): d is Climb {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Climb;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.clouds) &&
    Array.isArray(s.sprites) &&
    typeof s.me === 'object' &&
    s.me !== null &&
    Number.isFinite(s.me.y) &&
    Number.isFinite(s.top)
  );
}
