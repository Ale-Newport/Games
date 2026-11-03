/**
 * Rooftop Dash: an endless runner with an original name and look, at 60 steps a second. A courier
 * runs right across city rooftops on her own; the player only jumps and slides. Roofs sit at
 * different heights with gaps between them, chimneys stand on them and delivery drones hover at
 * head height (slide under, or jump over). Holding the jump button longer jumps higher; sliding in
 * the air drops faster. The pace rises with the distance run. Falling between buildings or running
 * into something ends the run. Every roof is generated from the seed so that it can be reached.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 360;
export const H = 200;
/** The runner's place on screen. */
export const RUN_X = 80;
const HALF_W = 6;
export const TALL = 24;
export const LOW = 12;
const JUMP_V = -7.5;
const G_HOLD = 0.45;
const G_FALL = 0.9;
const G_DIVE = 1.6;
const MAX_FALL = 10;
/** Steps after running off an edge during which a jump still works. */
const COYOTE = 5;
const COIN_R = 5;

export type RunAction = 'idle' | 'jump' | 'duck';
export const ACTIONS: readonly RunAction[] = ['idle', 'jump', 'duck'];

export interface Roof {
  x0: number;
  x1: number;
  /** The roof's top (screen y). */
  y: number;
}

export interface Thing {
  kind: 'chimney' | 'drone' | 'coin';
  /** Left edge and top in world coordinates (a coin: its centre). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Body {
  /** Feet (screen y). */
  y: number;
  vy: number;
  /** Steps since the feet last stood on a roof (0 = standing). */
  air: number;
  ducking: boolean;
  /** Steps the jump button has been held in this jump (0 = released). */
  held: number;
}

export interface Run {
  rng: RngState;
  roofs: Roof[];
  things: Thing[];
  /** The runner's world x. */
  x: number;
  body: Body;
  coins: number;
  dying: number;
  over: boolean;
  /** How the run ended. */
  cause: '' | 'fall' | 'chimney' | 'drone' | 'wall';
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** Running speed (px a step) at world x: 3 at the start, 6 after 40 000 px. */
export const speedAt = (x: number) => 3 + 3 * Math.min(1, Math.max(0, x) / 40000);
export const metres = (x: number) => Math.floor(x / 20);
export const scoreOf = (s: Run) => metres(s.x) + s.coins * 10;

/** Steps of a full (held) jump until the feet come back down to `dy` px above the take-off. */
const airtime = (dy: number) =>
  (-JUMP_V + Math.sqrt(Math.max(0, JUMP_V * JUMP_V - 2 * G_HOLD * dy))) / G_HOLD;

/** Adds roofs (with their chimneys, drones and coins) until the world reaches `until`. */
function extend(s: { rng: RngState; roofs: Roof[]; things: Thing[] }, until: number) {
  let rng = s.rng;
  const r = () => {
    const [v, n] = rand(rng);
    rng = n;
    return v;
  };
  while (s.roofs[s.roofs.length - 1]!.x1 < until) {
    const last = s.roofs[s.roofs.length - 1]!;
    const v = speedAt(last.x1) + 0.2;
    const hard = Math.min(1, last.x1 / 40000);
    const y = Math.round(Math.max(110, Math.min(175, last.y + (r() * 70 - 40))));
    const dy = last.y - y;
    // At most two thirds of what a full jump at this speed clears, never less than 24 px.
    const reach = v * airtime(dy) * 0.66 - HALF_W * 2;
    const gap = Math.round(
      Math.max(24, Math.min(reach, 24 + r() * (reach - 24) * (0.5 + hard * 0.5))),
    );
    const len = Math.round(150 + r() * 250);
    const roof = { x0: last.x1 + gap, x1: last.x1 + gap + len, y };
    s.roofs.push(roof);
    // Obstacles leave room to land before and to take off after them.
    const room0 = 60 + v * 12;
    const room1 = 40 + v * 6;
    const spots: number[] = [];
    const want = len > 300 && r() < 0.3 + hard * 0.4 ? 2 : r() < 0.55 + hard * 0.35 ? 1 : 0;
    for (let k = 0; k < want; k++) {
      const span = len - room0 - room1;
      if (span < 20) break;
      const x =
        roof.x0 +
        room0 +
        (want === 2 ? (k === 0 ? r() * span * 0.3 : span * 0.7 + r() * span * 0.3) : r() * span);
      spots.push(Math.round(x));
    }
    for (const x of spots) {
      if (r() < 0.55) s.things.push({ kind: 'chimney', x, y: y - 16, w: 12, h: 16 });
      else s.things.push({ kind: 'drone', x, y: y - 30, w: 16, h: 14 });
    }
    // A row or an arc of coins.
    if (r() < 0.6) {
      const arc = r() < 0.5;
      const x0 = roof.x0 + 20 + r() * Math.max(0, len - 140);
      for (let k = 0; k < 5; k++) {
        const cx = Math.round(x0 + k * 22);
        if (cx > roof.x1 - 10) break;
        const cy = y - 12 - (arc ? Math.round(Math.sin((k / 4) * Math.PI) * 34) + 26 : 0);
        if (spots.some((sx) => Math.abs(sx - cx) < 26)) continue;
        s.things.push({ kind: 'coin', x: cx, y: cy, w: COIN_R, h: COIN_R });
      }
    }
  }
  s.rng = rng;
}

export function newRun(seed: number): Run {
  const s = {
    rng: seedRng(seed >>> 0),
    roofs: [{ x0: -200, x1: 600, y: 150 }],
    things: [] as Thing[],
  };
  extend(s, W + 400);
  return {
    ...s,
    x: 0,
    body: { y: 150, vy: 0, air: 0, ducking: false, held: 0 },
    coins: 0,
    dying: 0,
    over: false,
    cause: '',
    events: [],
    steps: 0,
  };
}

const overlaps = (ax0: number, ay0: number, ax1: number, ay1: number, t: Thing) =>
  ax1 > t.x && ax0 < t.x + t.w && ay1 > t.y && ay0 < t.y + t.h;

/**
 * Moves the body one step at world x (shared by the game and the planner). Returns the new body
 * and the cause of death, if any.
 */
export function move(
  b0: Body,
  x: number,
  action: RunAction,
  roofs: readonly Roof[],
  things: readonly Thing[],
): [Body, Run['cause']] {
  const b = { ...b0 };
  const v = speedAt(x);
  const nx = x + v;
  const standing = b.air === 0;
  if (action === 'jump' && (standing || (b.air <= COYOTE && b.vy >= 0 && b.held === 0))) {
    b.vy = JUMP_V;
    b.air = 1;
    b.held = 1;
  } else if (action === 'jump' && b.held > 0) b.held++;
  else b.held = 0;
  b.ducking = action === 'duck';
  if (
    b.air > 0 ||
    !roofs.some((r) => nx + HALF_W > r.x0 && nx - HALF_W < r.x1 && Math.abs(r.y - b.y) < 0.5)
  ) {
    // In the air: the jump floats while held on the way up; sliding in the air dives.
    const g = b.ducking ? G_DIVE : b.held > 0 && b.vy < 0 ? G_HOLD : G_FALL;
    const y0 = b.y;
    b.vy = Math.min(MAX_FALL, b.vy + g);
    b.y += b.vy;
    b.air++;
    // Landing: the feet cross a roof top on the way down.
    if (b.vy > 0)
      for (const r of roofs)
        if (nx + HALF_W > r.x0 && nx - HALF_W < r.x1 && y0 <= r.y && b.y >= r.y) {
          b.y = r.y;
          b.vy = 0;
          b.air = 0;
          b.held = 0;
        }
  }
  // Running into the side of a higher roof (or, already dropping, into the far side of a gap).
  for (const r of roofs)
    if (nx + HALF_W > r.x0 && x + HALF_W <= r.x0 && b.y > r.y + 0.5)
      return [b, b.air === 0 ? 'wall' : 'fall'];
  if (b.y > H + 30) return [b, 'fall'];
  const top = b.y - (b.ducking && b.air === 0 ? LOW : TALL);
  for (const t of things) {
    if (t.kind === 'coin') continue;
    if (overlaps(nx - HALF_W, top, nx + HALF_W, b.y, t)) return [b, t.kind];
  }
  return [b, ''];
}

export function stepRun(s0: Run, action: RunAction): Run {
  if (s0.over) return s0;
  const s: Run = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.dying > 0) {
    s.dying--;
    if (s.cause === 'fall') s.body = { ...s.body, y: s.body.y + 6 };
    if (s.dying === 0) return { ...s, over: true, events: ['over'] };
    return s;
  }
  const [b, cause] = move(s.body, s.x, action, s.roofs, s.things);
  const nx = s.x + speedAt(s.x);
  if (b.held === 1) s.events.push('jump');
  if (b.air === 0 && s.body.air > 3) s.events.push('land');
  s.body = b;
  if (cause) {
    s.cause = cause;
    s.dying = 60;
    s.events.push(cause === 'fall' ? 'fall' : 'crash');
    return s;
  }
  s.x = nx;
  // Coins.
  const top = b.y - (b.ducking && b.air === 0 ? LOW : TALL);
  let things = s.things;
  const got = things.filter(
    (t) =>
      t.kind === 'coin' &&
      Math.abs(t.x - nx) < HALF_W + COIN_R &&
      t.y + COIN_R > top &&
      t.y - COIN_R < b.y,
  );
  if (got.length) {
    things = things.filter((t) => !got.includes(t));
    s.coins += got.length;
    s.events.push('coin');
  }
  const before = metres(s0.x);
  if (Math.floor(metres(nx) / 500) > Math.floor(before / 500)) s.events.push('milestone');
  // Forget what is behind and build what is ahead.
  const w = {
    rng: s.rng,
    roofs: s.roofs.filter((r) => r.x1 > nx - RUN_X - 40),
    things: things.filter((t) => t.x + t.w > nx - RUN_X - 40),
  };
  extend(w, nx + W + 400);
  s.rng = w.rng;
  s.roofs = w.roofs;
  s.things = w.things;
  return s;
}

/** One jump or slide planned `at` steps from now (an absolute step), held for `len` steps. */
type Move = { at: number; kind: 'jump' | 'duck'; len: number };
const OPTIONS: readonly Omit<Move, 'at'>[] = [
  { kind: 'jump', len: 3 },
  { kind: 'jump', len: 9 },
  { kind: 'jump', len: 40 },
  { kind: 'duck', len: 30 },
];
const HORIZON = 60;

/** How many steps a plan survives (up to the horizon), plus a little for the coins it would collect. */
function trial(s: Run, plan: readonly Move[]): number {
  let b = s.body;
  let x = s.x;
  const reach = x + speedAt(x) * HORIZON + 40;
  const roofs = s.roofs.filter((r) => r.x1 > x - 20 && r.x0 < reach);
  const things = s.things.filter((t) => t.x + t.w > x - 20 && t.x < reach);
  let coins = 0;
  const taken = new Set<Thing>();
  for (let k = 0; k < HORIZON; k++) {
    const step = s.steps + k;
    const m = plan.find((p) => step >= p.at && step < p.at + p.len);
    const [nb, cause] = move(b, x, m ? m.kind : 'idle', roofs, things);
    if (cause) return k;
    b = nb;
    x += speedAt(x);
    const top = b.y - (b.ducking && b.air === 0 ? LOW : TALL);
    for (const t of things)
      if (
        t.kind === 'coin' &&
        !taken.has(t) &&
        Math.abs(t.x - x) < HALF_W + COIN_R &&
        t.y + COIN_R > top &&
        t.y - COIN_R < b.y
      ) {
        taken.add(t);
        coins++;
      }
  }
  // Ending the look-ahead standing (or about to land) is safer than mid-air over a gap.
  return HORIZON + coins * 0.1 + (b.air === 0 ? 0.5 : 0);
}

/**
 * A planner: it looks a second ahead and tries doing nothing, a short, medium or full jump, or a
 * slide — now and then once more on any of the next steps that are multiples of six (aligned to
 * the clock so that its plans stay the same from one step to the next). It keeps the plan that
 * survives longest, preferring to wait, and collects coins when that costs nothing.
 */
export function runnerPolicy(s: Run): RunAction {
  if (s.over || s.dying) return 'idle';
  let best = -1;
  let action: RunAction = 'idle';
  const later: number[] = [];
  for (let t = 1; t < HORIZON - 4; t++) if ((s.steps + t) % 6 === 0) later.push(s.steps + t);
  const firsts: (Omit<Move, 'at'> | null)[] = [null, ...OPTIONS];
  // The current jump continues if the button is still held (releasing cuts it short).
  for (const f of firsts) {
    const first = f ? [{ ...f, at: s.steps }] : [];
    const a: RunAction = f ? f.kind : 'idle';
    const plans: Move[][] = [
      first,
      ...later.flatMap((at) =>
        OPTIONS.map((o) => [...first, { ...o, at: Math.max(at, s.steps + (f ? f.len : 0)) }]),
      ),
    ];
    for (const p of plans) {
      const v = trial(s, p);
      if (v > best + 0.05) {
        best = v;
        action = a;
      }
    }
    if (best >= HORIZON + 0.5 && !f) break;
  }
  return action;
}

/** A simple hopper: a full jump whenever a gap, a higher roof or anything in the way comes near; it never slides. */
export function hopperPolicy(s: Run): RunAction {
  if (s.over || s.dying) return 'idle';
  const v = speedAt(s.x);
  const near = s.x + HALF_W + 10 + v * 5;
  const here = s.roofs.find((r) => s.x >= r.x0 - HALF_W && s.x <= r.x1 + HALF_W);
  const edge = here ? here.x1 < near : false;
  const step = s.roofs.some((r) => r.x0 > s.x && r.x0 < near && r.y < s.body.y);
  const thing = s.things.some((t) => t.kind !== 'coin' && t.x > s.x && t.x < near);
  if (s.body.air === 0 && (edge || step || thing)) return 'jump';
  return s.body.held > 0 && s.body.vy < 0 ? 'jump' : 'idle';
}

export function isRun(d: unknown): d is Run {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Run;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.roofs) &&
    s.roofs.length > 0 &&
    Array.isArray(s.things) &&
    typeof s.body === 'object' &&
    s.body !== null &&
    Number.isFinite(s.body.y) &&
    Number.isFinite(s.x)
  );
}
