/**
 * Circuit Sprint: a top-down racing game with an original name and circuits, at 60 steps a second.
 * Four cars race three laps of a circuit seen from above: the player's and three computer drivers.
 * A car accelerates, brakes (and reverses), and steers more sharply the faster it goes; off the
 * tarmac the grass holds it back. Cars that touch bump apart. Laps count by passing the start line
 * after going round; the race ends when the player finishes (or gives up two minutes after the
 * winner), ranked by finishing order and, for anyone still racing, distance covered.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 320;
export const H = 240;
export const LAPS = 3;
const HALF_WIDTH = 13;
const ACCEL = 0.05;
const BRAKE = 0.1;
const MAX_V = 2.6;
const GRASS_V = 1.1;
const STEER = 0.05;
const CAR_R = 4;

export type RaceAction =
  | 'idle'
  | 'gas'
  | 'brake'
  | 'left'
  | 'right'
  | 'gas-left'
  | 'gas-right'
  | 'brake-left'
  | 'brake-right';
export const ACTIONS: readonly RaceAction[] = [
  'idle',
  'gas',
  'brake',
  'left',
  'right',
  'gas-left',
  'gas-right',
  'brake-left',
  'brake-right',
];

/** Circuits as rough loops of control points, smoothed into a centre line. */
const SHAPES: Record<string, [number, number][]> = {
  oval: [
    [60, 60],
    [260, 60],
    [290, 120],
    [260, 180],
    [60, 180],
    [30, 120],
  ],
  kidney: [
    [50, 60],
    [160, 42],
    [270, 60],
    [292, 130],
    [245, 192],
    [170, 165],
    [100, 196],
    [34, 140],
  ],
  loop: [
    [40, 55],
    [140, 45],
    [215, 85],
    [285, 60],
    [292, 160],
    [205, 205],
    [120, 175],
    [45, 200],
    [28, 125],
  ],
};
export const TRACKS = Object.keys(SHAPES);

/** A closed centre line of ~240 points through the control points (Catmull–Rom). */
export function centreLine(track: string): [number, number][] {
  const p = SHAPES[track] ?? SHAPES.oval!;
  const n = p.length;
  const out: [number, number][] = [];
  const per = Math.ceil(240 / n);
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p[(i - 1 + n) % n]!, p[i]!, p[(i + 1) % n]!, p[(i + 2) % n]!];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

export interface Car {
  x: number;
  y: number;
  a: number;
  v: number;
  /** Index of the nearest centre-line point, laps done, and the step it finished (or null). */
  at: number;
  laps: number;
  done: number | null;
  /** How far round it has been this lap (to tell a real lap from backing over the line). */
  furthest: number;
  /** A computer driver's top-speed factor. */
  pace: number;
}

export interface Race {
  rng: RngState;
  track: string;
  cars: Car[];
  /** Steps before the start, and the race clock. */
  countdown: number;
  clock: number;
  finishers: number[];
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const lineCache = new Map<string, [number, number][]>();
export const lineOf = (track: string) => {
  let l = lineCache.get(track);
  if (!l) {
    l = centreLine(track);
    lineCache.set(track, l);
  }
  return l;
};

export function newRace(seed: number, track = 'oval'): Race {
  let rng = seedRng(seed >>> 0);
  const line = lineOf(track);
  const [x0, y0] = line[0]!;
  const [x1, y1] = line[1]!;
  const a = Math.atan2(y1 - y0, x1 - x0);
  // A two-by-two grid behind the start line.
  const cars: Car[] = [0, 1, 2, 3].map((i) => {
    const back = 10 + Math.floor(i / 2) * 14;
    const side = (i % 2 ? 1 : -1) * 6;
    const [r, n] = rand(rng);
    rng = n;
    return {
      x: x0 - Math.cos(a) * back - Math.sin(a) * side,
      y: y0 - Math.sin(a) * back + Math.cos(a) * side,
      a,
      v: 0,
      at: line.length - 1,
      laps: 0,
      done: null,
      furthest: 0,
      pace: i === 0 ? 1 : 0.9 + r * 0.07,
    };
  });
  return {
    rng,
    track,
    cars,
    countdown: 120,
    clock: 0,
    finishers: [],
    over: false,
    events: [],
    steps: 0,
  };
}

/** Distance from a point to the centre line, and the nearest index near a guess. */
function nearest(line: [number, number][], x: number, y: number, guess: number): [number, number] {
  let best = guess;
  let bd = Infinity;
  for (let k = -12; k <= 12; k++) {
    const i = (guess + k + line.length) % line.length;
    const d = Math.hypot(line[i]![0] - x, line[i]![1] - y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return [best, bd];
}

/** How far round the race a car is (laps and fraction), for standings. */
export const progress = (c: Car, n: number) =>
  // Still behind the start line before the first crossing counts as just under nothing.
  c.laps + (c.at > n * 0.5 && c.furthest < n * 0.3 ? c.at / n - 1 : c.at / n);

export function stepRace(s0: Race, actions: RaceAction[]): Race {
  if (s0.over) return s0;
  const s: Race = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.countdown > 0) {
    s.countdown--;
    if (s.countdown % 40 === 0) s.events.push(s.countdown === 0 ? 'go' : 'beep');
    return s;
  }
  s.clock++;
  const line = lineOf(s.track);
  const n = line.length;
  const cars = s.cars.map((c) => ({ ...c }));
  cars.forEach((c, i) => {
    const a = actions[i] ?? 'idle';
    const [idx, off] = nearest(line, c.x, c.y, c.at);
    const grass = off > HALF_WIDTH;
    if (c.done !== null) {
      // Coast to a stop after the flag.
      c.v *= 0.97;
    } else {
      if (a.startsWith('gas')) c.v += ACCEL;
      if (a.startsWith('brake')) c.v -= c.v > 0 ? BRAKE : ACCEL * 0.6;
      if (!a.startsWith('gas') && !a.startsWith('brake')) c.v *= 0.99;
      const top = (grass ? GRASS_V : MAX_V) * c.pace;
      c.v = Math.max(-0.8, Math.min(top, c.v));
      if (grass && c.v > top) c.v = top;
      const steer = a.endsWith('left') ? -1 : a.endsWith('right') ? 1 : 0;
      c.a += steer * STEER * Math.min(1, Math.abs(c.v) / 0.8) * Math.sign(c.v || 1);
    }
    c.x = Math.max(4, Math.min(W - 4, c.x + Math.cos(c.a) * c.v));
    c.y = Math.max(4, Math.min(H - 4, c.y + Math.sin(c.a) * c.v));
    // Lap counting: crossing from the end of the line back to its start, having gone round.
    const [now] = nearest(line, c.x, c.y, idx);
    if (c.at > n * 0.85 && now < n * 0.15 && c.furthest > n * 0.7) {
      c.laps++;
      c.furthest = 0;
      if (i === 0) s.events.push('lap');
      if (c.laps >= LAPS && c.done === null) {
        c.done = s.clock;
        s.finishers = [...s.finishers, i];
        s.events.push(i === 0 ? 'finish' : 'rival-finish');
      }
    } else if (now < n * 0.5 || c.furthest > n * 0.3) c.furthest = Math.max(c.furthest, now);
    c.at = now;
  });
  // Bumps.
  for (let i = 0; i < cars.length; i++)
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i]!;
      const b = cars[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && d < CAR_R * 2) {
        const push = (CAR_R * 2 - d) / 2;
        const ux = (a.x - b.x) / d;
        const uy = (a.y - b.y) / d;
        a.x += ux * push;
        a.y += uy * push;
        b.x -= ux * push;
        b.y -= uy * push;
        a.v *= 0.9;
        b.v *= 0.9;
        if (i === 0) s.events.push('bump');
      }
    }
  const out = { ...s, cars };
  // The race ends when the player is home, or two minutes after the first car finished.
  const firstDone = Math.min(...cars.map((c) => c.done ?? Infinity));
  if (cars[0]!.done !== null || s.clock - firstDone > 120 * 60)
    return { ...out, over: true, events: [...out.events, 'over'] };
  return out;
}

/** The player's place: finishers in order, then by distance covered. */
export function placeOf(s: Race, i = 0): number {
  const n = lineOf(s.track).length;
  const order = s.cars
    .map((c, k) => ({ k, key: c.done !== null ? 1e6 - s.finishers.indexOf(k) : progress(c, n) }))
    .sort((a, b) => b.key - a.key)
    .map((o) => o.k);
  return order.indexOf(i) + 1;
}

export function scoreOf(s: Race): number {
  const place = placeOf(s);
  const secs = s.clock / 60;
  return (
    (5 - place) * 1000 + (s.cars[0]!.done !== null ? Math.max(0, Math.round((240 - secs) * 10)) : 0)
  );
}

// ---- Drivers ----

/**
 * A driver: aims at a point on the centre line further ahead the faster it goes, steers towards it,
 * and lifts off or brakes when the line bends sharply in the stretch ahead.
 */
export function driverFor(s: Race, i: number, caution = 1): RaceAction {
  const c = s.cars[i]!;
  if (s.countdown > 0) return 'gas';
  if (s.over || c.done !== null) return 'idle';
  const line = lineOf(s.track);
  const n = line.length;
  const look = 6 + Math.round(Math.abs(c.v) * 4);
  let [tx, ty] = line[(c.at + look) % n]!;
  // A car close in front: aim to pass it on the side away from it.
  const ahead = s.cars.find((o, k) => {
    if (k === i) return false;
    const dx = o.x - c.x;
    const dy = o.y - c.y;
    const along = dx * Math.cos(c.a) + dy * Math.sin(c.a);
    const across = -dx * Math.sin(c.a) + dy * Math.cos(c.a);
    return along > 0 && along < 18 && Math.abs(across) < 7;
  });
  if (ahead) {
    const across = -(ahead.x - c.x) * Math.sin(c.a) + (ahead.y - c.y) * Math.cos(c.a);
    const side = across > 0 ? -1 : 1;
    tx += -Math.sin(c.a) * side * 9;
    ty += Math.cos(c.a) * side * 9;
  }
  const want = Math.atan2(ty - c.y, tx - c.x);
  const err = Math.atan2(Math.sin(want - c.a), Math.cos(want - c.a));
  // How sharply the line turns over the next stretch.
  const p0 = line[(c.at + look) % n]!;
  const p1 = line[(c.at + look + 14) % n]!;
  const p2 = line[(c.at + look + 28) % n]!;
  const turn = Math.abs(
    Math.atan2(
      Math.sin(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) - Math.atan2(p1[1] - p0[1], p1[0] - p0[0])),
      Math.cos(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) - Math.atan2(p1[1] - p0[1], p1[0] - p0[0])),
    ),
  );
  // Slower into sharper bends — but never so slow that it cannot steer.
  const safeV = Math.max(0.9, MAX_V - turn * 1.9) / caution;
  const steer = Math.abs(err) < 0.05 ? '' : err > 0 ? 'right' : 'left';
  // Brake only to shed speed (never into reverse); badly lined up and slow, creep forward turning.
  const wrongWay = Math.abs(err) > 0.9;
  const pedal =
    c.v > 0.3 && (c.v > safeV + 0.15 || (wrongWay && c.v > 0.7))
      ? 'brake'
      : wrongWay
        ? c.v < 0.5
          ? 'gas'
          : ''
        : c.v < safeV
          ? 'gas'
          : '';
  const a = [pedal, steer].filter(Boolean).join('-');
  return (a || 'idle') as RaceAction;
}

/** The player's race: seat 0 acts, the three computer cars are drivers. */
export function stepWithField(s: Race, action: RaceAction): Race {
  return stepRace(s, [action, driverFor(s, 1), driverFor(s, 2), driverFor(s, 3)]);
}

export function isRace(d: unknown): d is Race {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Race;
  return (
    Array.isArray(s.rng) &&
    typeof s.track === 'string' &&
    TRACKS.includes(s.track) &&
    Array.isArray(s.cars) &&
    s.cars.length === 4 &&
    Number.isFinite(s.clock)
  );
}
