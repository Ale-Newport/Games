/**
 * Moon Touchdown: a lunar landing game with an original name and look, at 60 steps a second. The
 * lander falls under the moon's gravity; it can turn left and right and fire its main engine along
 * its axis, burning fuel. Each round brings new ground from the run's seed, with flat pads marked
 * ×2, ×3 and ×5 (narrower pads pay more). A touchdown is safe only with both feet on one pad, coming
 * down slowly, drifting little and standing nearly upright; it scores 50 × the pad's mark (plus 50
 * for a very soft one). Anything else is a crash, which costs 200 fuel. The sky wraps round side to
 * side. The run ends when a round finishes with the tank empty.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 320;
export const H = 240;
export const GRAVITY = 0.018;
export const THRUST = 0.045;
const TURN = (2 * Math.PI) / 180;
export const SAFE_VY = 0.6;
export const SAFE_VX = 0.4;
export const SAFE_ANGLE = (12 * Math.PI) / 180;
const LEGS = 7;
const START_FUEL = 1500;
const CRASH_FUEL = 200;

export type LanderAction = 'idle' | 'left' | 'right' | 'thrust' | 'thrust-left' | 'thrust-right';
export const ACTIONS: readonly LanderAction[] = [
  'idle',
  'left',
  'right',
  'thrust',
  'thrust-left',
  'thrust-right',
];

export interface Pad {
  x0: number;
  x1: number;
  y: number;
  mult: number;
}

export interface Lander {
  rng: RngState;
  round: number;
  /** Ground heights at every 8 px (41 points across, wrapping). */
  ground: number[];
  pads: Pad[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Tilt from upright, radians (positive leans right). */
  angle: number;
  fuel: number;
  firing: boolean;
  score: number;
  landings: number;
  crashes: number;
  /** The pause after a round ends, and how it ended. */
  pause: number;
  outcome: 'landed' | 'crashed' | null;
  lastPoints: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** New ground: a rough ridge with three flat pads at random spots. */
function newGround(rng0: RngState): [number[], Pad[], RngState] {
  let rng = rng0;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  const n = W / 8 + 1;
  const g: number[] = [];
  let h = 190;
  for (let i = 0; i < n; i++) {
    h = Math.max(130, Math.min(228, h + (roll() - 0.5) * 34));
    g.push(h);
  }
  g[n - 1] = g[0]!;
  // Pads: widths in ground segments (×5 is 3 segments = 24 px, ×3 is 4, ×2 is 5), never overlapping.
  const pads: Pad[] = [];
  const used = new Set<number>();
  for (const [segs, mult] of [
    [3, 5],
    [4, 3],
    [5, 2],
  ] as const) {
    for (let tries = 0; tries < 50; tries++) {
      const start = 1 + Math.floor(roll() * (n - segs - 3));
      let free = true;
      for (let k = start - 1; k <= start + segs + 1; k++) if (used.has(k)) free = false;
      if (!free) continue;
      const y = Math.max(...g.slice(start, start + segs + 1).map((v) => v)) - 2;
      for (let k = start; k <= start + segs; k++) {
        g[k] = y;
        used.add(k);
      }
      pads.push({ x0: start * 8, x1: (start + segs) * 8, y, mult });
      break;
    }
  }
  g[n - 1] = g[0]!;
  return [g, pads, rng];
}

export const groundAt = (s: Pick<Lander, 'ground'>, x: number): number => {
  const xx = ((x % W) + W) % W;
  const i = Math.floor(xx / 8);
  const t = (xx - i * 8) / 8;
  return s.ground[i]! + (s.ground[i + 1]! - s.ground[i]!) * t;
};

function newRound(
  s: Pick<Lander, 'rng'>,
): Pick<
  Lander,
  'rng' | 'ground' | 'pads' | 'x' | 'y' | 'vx' | 'vy' | 'angle' | 'pause' | 'outcome' | 'firing'
> {
  const [ground, pads, r1] = newGround(s.rng);
  const [a, r2] = rand(r1);
  const [b, r3] = rand(r2);
  return {
    rng: r3,
    ground,
    pads,
    x: 20 + a * (W - 40),
    y: 24,
    vx: (b - 0.5) * 1.2,
    vy: 0,
    angle: 0,
    pause: 0,
    outcome: null,
    firing: false,
  };
}

export function newLander(seed: number): Lander {
  return {
    ...newRound({ rng: seedRng(seed >>> 0) }),
    round: 1,
    fuel: START_FUEL,
    score: 0,
    landings: 0,
    crashes: 0,
    lastPoints: 0,
    over: false,
    events: [],
    steps: 0,
  };
}

/** The two feet, after tilting. */
export function feet(s: Pick<Lander, 'x' | 'y' | 'angle'>): [number, number][] {
  const c = Math.cos(s.angle);
  const sn = Math.sin(s.angle);
  return [-LEGS, LEGS].map((dx) => [s.x + dx * c - LEGS * sn, s.y + dx * sn + LEGS * c]);
}

export function padUnder(s: Pick<Lander, 'pads'>, x: number): Pad | undefined {
  const xx = ((x % W) + W) % W;
  return s.pads.find((p) => xx >= p.x0 && xx <= p.x1);
}

export function stepLander(s0: Lander, action: LanderAction): Lander {
  if (s0.over) return s0;
  const s: Lander = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.pause > 0) {
    s.pause--;
    if (s.pause > 0) return s;
    if (s.fuel <= 0) return { ...s, over: true, events: ['over'] };
    return { ...s, ...newRound(s), round: s.round + 1, events: ['round'] };
  }
  if (action === 'left' || action === 'thrust-left')
    s.angle = Math.max(-Math.PI / 2, s.angle - TURN);
  if (action === 'right' || action === 'thrust-right')
    s.angle = Math.min(Math.PI / 2, s.angle + TURN);
  s.firing = action.startsWith('thrust') && s.fuel > 0;
  if (s.firing) {
    s.vx += Math.sin(s.angle) * THRUST;
    s.vy -= Math.cos(s.angle) * THRUST;
    s.fuel = Math.max(0, s.fuel - 1);
    if (s.fuel === 0) s.events.push('empty');
  }
  s.vy += GRAVITY;
  s.x = (((s.x + s.vx) % W) + W) % W;
  s.y += s.vy;
  if (s.y < -60) {
    s.y = -60;
    s.vy = Math.max(0, s.vy);
  }
  // Touching the ground: a safe touchdown needs both feet on one pad, gently and upright.
  const touched = feet(s).some(([fx, fy]) => fy >= groundAt(s, fx)) || s.y >= groundAt(s, s.x);
  if (!touched) return s;
  const [l, r] = feet(s);
  const pad = padUnder(s, l![0]);
  const ok =
    pad !== undefined &&
    pad === padUnder(s, r![0]) &&
    s.vy <= SAFE_VY &&
    Math.abs(s.vx) <= SAFE_VX &&
    Math.abs(s.angle) <= SAFE_ANGLE;
  if (ok) {
    const points = 50 * pad.mult + (s.vy <= SAFE_VY / 2 ? 50 : 0);
    s.y = pad.y - LEGS;
    s.angle = 0;
    return {
      ...s,
      vx: 0,
      vy: 0,
      firing: false,
      score: s.score + points,
      landings: s.landings + 1,
      lastPoints: points,
      pause: 120,
      outcome: 'landed',
      events: [...s.events, 'landed'],
    };
  }
  return {
    ...s,
    firing: false,
    fuel: Math.max(0, s.fuel - CRASH_FUEL),
    crashes: s.crashes + 1,
    lastPoints: 0,
    pause: 120,
    outcome: 'crashed',
    events: [...s.events, 'crashed'],
  };
}

/** Horizontal distance from a to b going the short way round. */
const wrapDx = (a: number, b: number) => ((((b - a) % W) + W * 1.5) % W) - W / 2;

/**
 * A pilot: picks the pad with the best mark it can reach (by distance and height), steers its
 * sideways speed towards it by tilting, keeps its fall to a rate that shrinks with height, and
 * stands upright for the last few metres.
 */
export function pilotPolicy(s: Lander): LanderAction {
  if (s.over || s.pause) return 'idle';
  const pad = [...s.pads].sort(
    (a, b) =>
      b.mult * 80 -
      Math.abs(wrapDx(s.x, (b.x0 + b.x1) / 2)) -
      (a.mult * 80 - Math.abs(wrapDx(s.x, (a.x0 + a.x1) / 2))),
  )[0]!;
  const cx = (pad.x0 + pad.x1) / 2;
  const dx = wrapDx(s.x, cx);
  const height = pad.y - (s.y + LEGS);
  const halfPad = (pad.x1 - pad.x0) / 2 - LEGS - 1;
  // The ground between here and the pad: keep clear of it.
  let clearance = Infinity;
  for (let k = 0; k <= 12; k++)
    clearance = Math.min(clearance, groundAt(s, s.x + (dx * k) / 12) - (s.y + LEGS));
  const over = Math.abs(dx) < halfPad;
  const wantVx = over ? 0 : Math.max(-1.1, Math.min(1.1, dx / 90));
  let wantAngle = Math.max(-0.5, Math.min(0.5, (wantVx - s.vx) * 1.2));
  if (height < 26 || clearance < 18) wantAngle = Math.max(-0.12, Math.min(0.12, wantAngle));
  if (height < 10) wantAngle = 0;
  // Fall rate: fast high up, slow near the pad; climb if the ground ahead is close.
  const wantVy =
    clearance < 20 && !over
      ? -0.3
      : over
        ? Math.max(0.25, Math.min(1.6, height / 70))
        : Math.max(0.2, Math.min(1.2, (clearance - 30) / 60));
  const thrust =
    s.vy > wantVy ||
    (Math.abs(wantAngle) > 0.15 &&
      Math.abs(s.angle - wantAngle) < 0.08 &&
      !over &&
      s.vy > wantVy - 0.4);
  const turn = s.angle < wantAngle - 0.03 ? 'right' : s.angle > wantAngle + 0.03 ? 'left' : '';
  if (thrust) return turn ? (`thrust-${turn}` as LanderAction) : 'thrust';
  return (turn || 'idle') as LanderAction;
}

/** A simple player: stays upright and only brakes its fall, landing wherever it comes down. */
export function brakerPolicy(s: Lander): LanderAction {
  if (s.over || s.pause) return 'idle';
  const turn = s.angle > 0.03 ? 'left' : s.angle < -0.03 ? 'right' : '';
  const height = groundAt(s, s.x) - (s.y + LEGS);
  const wantVy = Math.max(0.3, Math.min(1.5, height / 60));
  if (s.vy > wantVy) return turn ? (`thrust-${turn}` as LanderAction) : 'thrust';
  return (turn || 'idle') as LanderAction;
}

export function isLander(d: unknown): d is Lander {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Lander;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.ground) &&
    s.ground.length === W / 8 + 1 &&
    Array.isArray(s.pads) &&
    Number.isFinite(s.x) &&
    Number.isFinite(s.fuel)
  );
}
