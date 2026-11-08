/**
 * Balancing Cart: the classic cart-and-pole balancing problem as a game, at 60 steps a second. A
 * pole stands on a hinge on a cart that runs on a short rail; the player pushes the cart left or
 * right (a fixed 4 N) to keep the pole up. The pole falls past 24° or the cart runs off the end
 * of the rail, and the run is over. After the first 20 seconds gusts of wind start to knock the
 * pole, harder as time goes on. The poles are tall (6 m or 4 m) so that a person's reactions are
 * quick enough; the shorter one falls faster.
 * Score: tenths of a second balanced.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 360;
export const H = 240;
export const GRAVITY = 9.8;
export const CART_MASS = 1;
export const POLE_MASS = 0.1;
export const FORCE = 4;
export const DT = 1 / 60;
/** The run ends past this angle (radians, about 24°) or this far from the middle (metres). */
export const MAX_ANGLE = 0.42;
export const MAX_X = 2.4;
/** Gusts begin after this many steps (20 s). */
export const CALM = 20 * 60;

export type PoleKind = 'long' | 'short';
export const POLES: readonly PoleKind[] = ['long', 'short'];
/** Half the pole's length, in metres. */
export const halfLength = (p: PoleKind) => (p === 'long' ? 3 : 2);

export type CartAction = 'idle' | 'left' | 'right';
export const ACTIONS: readonly CartAction[] = ['idle', 'left', 'right'];

export interface Cart {
  rng: RngState;
  pole: PoleKind;
  /** Cart position and speed (m, m/s), pole angle from upright (rad, positive leaning right) and its rate. */
  x: number;
  v: number;
  a: number;
  w: number;
  /** The current gust: a sideways push on the pole (N) for some steps. */
  gust: number;
  gustLeft: number;
  /** Steps until the next gust. */
  nextGust: number;
  pushes: number;
  over: boolean;
  cause: '' | 'fell' | 'rail';
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export function newCart(seed: number, pole: PoleKind = 'long'): Cart {
  let rng = seedRng(seed >>> 0);
  const [r, n] = rand(rng);
  rng = n;
  // A slight lean to start, one way or the other.
  const a = (r < 0.5 ? -1 : 1) * (0.02 + r * 0.02);
  return {
    rng,
    pole,
    x: 0,
    v: 0,
    a,
    w: 0,
    gust: 0,
    gustLeft: 0,
    nextGust: CALM,
    pushes: 0,
    over: false,
    cause: '',
    events: [],
    steps: 0,
  };
}

/** The textbook cart-pole equations, one Euler step with force `f` on the cart and a gust `g` (N) on the pole. */
export function physics(
  x: number,
  v: number,
  a: number,
  w: number,
  f: number,
  g: number,
  l: number,
): [number, number, number, number] {
  const total = CART_MASS + POLE_MASS;
  const sin = Math.sin(a);
  const cos = Math.cos(a);
  const temp = (f + POLE_MASS * l * w * w * sin) / total;
  const acc =
    (GRAVITY * sin - cos * temp) / (l * (4 / 3 - (POLE_MASS * cos * cos) / total)) +
    (g * cos) / (total * l * (4 / 3));
  const xacc = temp - (POLE_MASS * l * acc * cos) / total;
  return [x + DT * v, v + DT * xacc, a + DT * w, w + DT * acc];
}

const forceOf = (action: CartAction) =>
  action === 'left' ? -FORCE : action === 'right' ? FORCE : 0;

/**
 * Pushing right swings the pole to the left (the hinge is pulled from under it), so to catch a pole
 * leaning right, push right.
 */
export function stepCart(s0: Cart, action: CartAction): Cart {
  if (s0.over) return s0;
  const s: Cart = { ...s0, events: [], steps: s0.steps + 1 };
  if (action !== 'idle' && s0.steps > 0) s.pushes++;
  let rng = s.rng;
  const r = () => {
    const [v, n] = rand(rng);
    rng = n;
    return v;
  };
  // Gusts: every 3–6 s after the calm start, a push of growing strength (1 N, up to 3 N after another
  // minute) lasting a quarter second.
  if (s.gustLeft > 0) s.gustLeft--;
  else s.gust = 0;
  s.nextGust--;
  if (s.nextGust <= 0) {
    const strength = 1 + Math.min(2, (s.steps - CALM) / 3600);
    s.gust = (r() < 0.5 ? -1 : 1) * strength * (0.6 + r() * 0.4);
    s.gustLeft = 15;
    s.nextGust = 180 + Math.floor(r() * 180);
    s.events.push('gust');
  }
  s.rng = rng;
  [s.x, s.v, s.a, s.w] = physics(s.x, s.v, s.a, s.w, forceOf(action), s.gust, halfLength(s.pole));
  if (Math.abs(s.a) > MAX_ANGLE) {
    s.over = true;
    s.cause = 'fell';
    s.events.push('fall');
  } else if (Math.abs(s.x) > MAX_X) {
    s.over = true;
    s.cause = 'rail';
    s.events.push('fall');
  } else if (s.steps % 600 === 0) s.events.push('ten');
  return s;
}

/** Tenths of a second balanced. */
export const scoreOf = (s: Cart) => Math.floor(s.steps / 6);

/**
 * A balancer: a fixed linear controller on the four readings — it pushes the way the sum of the
 * pole's lean and swing, plus a little of the cart's position and speed, points.
 */
export function balancerPolicy(s: Cart): CartAction {
  if (s.over) return 'idle';
  const u = 10 * s.a + 10 * s.w + 0.5 * s.x + s.v;
  return Math.abs(u) < 0.05 ? 'idle' : u > 0 ? 'right' : 'left';
}

/** A naive pusher: pushes the way the pole leans, and nothing else. */
export function leanerPolicy(s: Cart): CartAction {
  if (s.over) return 'idle';
  return Math.abs(s.a) < 0.01 ? 'idle' : s.a > 0 ? 'right' : 'left';
}

export function isCart(d: unknown): d is Cart {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Cart;
  return (
    Array.isArray(s.rng) && POLES.includes(s.pole) && [s.x, s.v, s.a, s.w].every(Number.isFinite)
  );
}
