/**
 * Puffin Flap: a one-button flying game with an original puffin and sea stacks, at 60 steps a
 * second. Each press of the button is a flap (an upward kick); gravity does the rest. Pairs of rock
 * stacks scroll in from the right with a gap between them at a random height; flying through a gap
 * scores a point. Touching a stack, the sea or the sky's edge ends the flight. From 25 points on
 * the gaps narrow a little, and from 50 the stacks come a little faster.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 240;
export const H = 360;
export const SEA = H - 40;
export const BIRD_X = 64;
const R = 9;
const GRAVITY = 0.24;
const FLAP = -4.4;
const MAX_FALL = 7;
const STACK_W = 40;
const SPACING = 132;

export type FlapAction = 'idle' | 'flap';
export const ACTIONS: readonly FlapAction[] = ['idle', 'flap'];

export interface Stack {
  x: number;
  /** Top of the gap (y) and its height. */
  gap: number;
  size: number;
  scored: boolean;
}

export interface Flight {
  rng: RngState;
  y: number;
  vy: number;
  prev: boolean;
  stacks: Stack[];
  score: number;
  started: boolean;
  crashed: number;
  over: boolean;
  events: string[];
  steps: number;
  flaps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const gapSize = (score: number) => Math.max(84, 100 - Math.max(0, score - 25) * 0.6);
export const speed = (score: number) =>
  1.6 + (score >= 50 ? Math.min(0.6, (score - 50) * 0.02) : 0);

function newStack(
  rng: RngState,
  x: number,
  score: number,
  prevGap: number | null,
): [Stack, RngState] {
  const size = gapSize(score);
  const [r, n] = rand(rng);
  let gap = 40 + r * (SEA - 80 - size);
  // Keep consecutive gaps reachable: at most 120 px apart.
  if (prevGap !== null) gap = Math.max(prevGap - 120, Math.min(prevGap + 120, gap));
  return [{ x, gap, size, scored: false }, n];
}

export function newFlight(seed: number): Flight {
  let rng = seedRng(seed >>> 0);
  const stacks: Stack[] = [];
  let prev: number | null = null;
  for (let k = 0; k < 3; k++) {
    const [st, n] = newStack(rng, W + 60 + k * SPACING, 0, prev);
    rng = n;
    stacks.push(st);
    prev = st.gap;
  }
  return {
    rng,
    y: H / 2 - 20,
    vy: 0,
    prev: false,
    stacks,
    score: 0,
    started: false,
    crashed: 0,
    over: false,
    events: [],
    steps: 0,
    flaps: 0,
  };
}

const hits = (y: number, st: Stack) =>
  BIRD_X + R > st.x && BIRD_X - R < st.x + STACK_W && (y - R < st.gap || y + R > st.gap + st.size);

export function stepFlight(s0: Flight, action: FlapAction): Flight {
  if (s0.over) return s0;
  const s: Flight = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.crashed > 0) {
    // Tumbling into the sea.
    s.vy = Math.min(MAX_FALL, s.vy + GRAVITY * 2);
    s.y = Math.min(SEA - R, s.y + s.vy);
    s.crashed--;
    if (s.crashed === 0) return { ...s, over: true, events: ['over'] };
    return s;
  }
  const press = action === 'flap' && !s.prev;
  s.prev = action === 'flap';
  // Hovering until the first flap.
  if (!s.started) {
    if (!press) {
      s.y = H / 2 - 20 + Math.sin(s.steps / 10) * 4;
      return s;
    }
    s.started = true;
  }
  if (press) {
    s.vy = FLAP;
    s.flaps++;
    s.events.push('flap');
  }
  s.vy = Math.min(MAX_FALL, s.vy + GRAVITY);
  s.y += s.vy;
  const v = speed(s.score);
  let rng = s.rng;
  let stacks = s.stacks.map((st) => ({ ...st, x: st.x - v }));
  for (const st of stacks)
    if (!st.scored && st.x + STACK_W < BIRD_X - R) {
      st.scored = true;
      s.score++;
      s.events.push('point');
    }
  if (stacks[0]!.x < -STACK_W) {
    const last = stacks[stacks.length - 1]!;
    const [st, n] = newStack(rng, last.x + SPACING, s.score, last.gap);
    rng = n;
    stacks = [...stacks.slice(1), st];
  }
  s.rng = rng;
  s.stacks = stacks;
  if (s.y - R < 0 || s.y + R > SEA || stacks.some((st) => hits(s.y, st))) {
    s.crashed = 60;
    s.events.push('crash');
  }
  return s;
}

/** The stack the puffin must fly through next. */
const nextStack = (s: Flight) => s.stacks.find((st) => st.x + STACK_W >= BIRD_X - R)!;

/** A simple flyer: flaps whenever it sinks below a point a little under the next gap's middle. */
export function trackerPolicy(s: Flight): FlapAction {
  if (s.over || s.crashed) return 'idle';
  if (!s.started) return s.steps % 2 ? 'flap' : 'idle';
  const st = nextStack(s);
  const target = st.gap + st.size * 0.62;
  return s.y > target && s.vy > 0 && !s.prev ? 'flap' : 'idle';
}

/**
 * A planner: it only looks at the stacks in view. Every four steps it chooses to flap or glide by
 * trying every pattern of flaps over the next 40 steps (one chance to flap every four steps) and
 * keeping the one that stays clearest of the rock edges.
 */
export function plannerPolicy(s: Flight): FlapAction {
  if (s.over || s.crashed) return 'idle';
  if (!s.started) return s.steps % 2 ? 'flap' : 'idle';
  if (s.steps % 4 !== 0) return 'idle';
  const visible = s.stacks.filter((st) => st.x < W);
  const sim = (y0: number, vy0: number, plan: number): number => {
    let y = y0;
    let vy = vy0;
    let margin = Infinity;
    for (let k = 0; k < 40; k++) {
      if (k % 4 === 0 && plan & (1 << (k / 4))) vy = FLAP;
      vy = Math.min(MAX_FALL, vy + GRAVITY);
      y += vy;
      if (y - R < 0 || y + R > SEA) return -1000 + k;
      const dx = speed(s.score) * (k + 1);
      for (const st of visible) {
        const x = st.x - dx;
        if (BIRD_X + R > x && BIRD_X - R < x + STACK_W) {
          if (y - R < st.gap || y + R > st.gap + st.size) return -1000 + k;
          margin = Math.min(margin, y - R - st.gap, st.gap + st.size - y - R);
        } else if (x > BIRD_X) {
          // Approaching: prefer being near the gap's middle.
          margin = Math.min(margin, 30 - Math.abs(y - (st.gap + st.size / 2)) * 0.3);
          break;
        }
      }
    }
    return Math.min(margin, 40) - Math.abs(vy) * 0.2;
  };
  let best = -Infinity;
  let flap = false;
  for (let plan = 0; plan < 1 << 10; plan++) {
    const v = sim(s.y, s.vy, plan);
    if (v > best) {
      best = v;
      flap = (plan & 1) === 1;
    }
  }
  return flap && !s.prev ? 'flap' : 'idle';
}

export function isFlight(d: unknown): d is Flight {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Flight;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.stacks) &&
    s.stacks.length === 3 &&
    Number.isFinite(s.y) &&
    Number.isFinite(s.score)
  );
}
