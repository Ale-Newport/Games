/**
 * City Shield: a city-defence game with an original name and look, at 60 steps a second. Rockets
 * fall from the top of the sky towards six cities and three launchers. The player fires
 * interceptors at points in the sky — by tapping there, or by moving a crosshair and firing — from
 * the nearest launcher with rounds left (ten each per wave); each interceptor flies to its point and
 * bursts into a blast that grows and fades, destroying any rocket inside it (and a destroyed rocket
 * bursts too). From wave 3 some rockets split in mid-air. Hits on a city destroy it; hits on a
 * launcher put it out of action for the rest of the wave. A wave ends when the sky is clear: bonus
 * points for rounds left and cities standing, a city rebuilt for every 10 000 points, and the next
 * wave comes faster. The game ends when every city is gone.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 256;
export const H = 224;
export const GROUND = 204;
export const GRID_C = 16;
export const GRID_R = 12;
/** The sky area the aiming grid covers. */
export const CELL_W = W / GRID_C;
export const CELL_H = 180 / GRID_R;
export const CITY_X = [44, 68, 92, 164, 188, 212];
export const LAUNCHER_X = [16, 128, 240];
const ROUNDS = 10;
const BLAST = 22;
const BLAST_GROW = 18;
const BLAST_LIFE = 44;

type Move = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
export type ShieldAction = 'idle' | 'fire' | Move | `at-${number}-${number}`;
const MOVES: Move[] = [
  'up',
  'down',
  'left',
  'right',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
];
export const ACTIONS: readonly ShieldAction[] = [
  'idle',
  'fire',
  ...MOVES,
  ...Array.from(
    { length: GRID_C * GRID_R },
    (_, i) => `at-${i % GRID_C}-${Math.floor(i / GRID_C)}` as ShieldAction,
  ),
];
export const cellCentre = (c: number, r: number): [number, number] => [
  (c + 0.5) * CELL_W,
  (r + 0.5) * CELL_H,
];

export interface Rocket {
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  speed: number;
  /** Splits into this many when it reaches `splitAt` (0: never). */
  splits: number;
  splitAt: number;
}

export interface Interceptor {
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  speed: number;
}

export interface Blast {
  x: number;
  y: number;
  age: number;
}

export interface Shield {
  rng: RngState;
  wave: number;
  cities: boolean[];
  launchers: { rounds: number; up: boolean }[];
  rockets: Rocket[];
  interceptors: Interceptor[];
  blasts: Blast[];
  /** Rockets still to come this wave, and steps until the next one. */
  toCome: number;
  nextIn: number;
  cross: [number, number];
  prevFire: boolean;
  score: number;
  /** Points at which the next city is rebuilt. */
  nextCity: number;
  /** The pause between waves, with the bonus counted. */
  between: number;
  bonus: number;
  over: boolean;
  events: string[];
  steps: number;
  destroyed: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const waveSize = (wave: number) => 10 + 2 * wave;
export const rocketSpeed = (wave: number) => 0.22 + 0.04 * Math.min(wave - 1, 10);
export const multiplier = (wave: number) => Math.min(6, 1 + Math.floor((wave - 1) / 2));

function freshWave(
  s: Pick<Shield, 'wave'>,
): Pick<
  Shield,
  'launchers' | 'rockets' | 'interceptors' | 'blasts' | 'toCome' | 'nextIn' | 'between' | 'bonus'
> {
  return {
    launchers: LAUNCHER_X.map(() => ({ rounds: ROUNDS, up: true })),
    rockets: [],
    interceptors: [],
    blasts: [],
    toCome: waveSize(s.wave),
    nextIn: 60,
    between: 0,
    bonus: 0,
  };
}

export function newShield(seed: number): Shield {
  return {
    rng: seedRng(seed >>> 0),
    wave: 1,
    cities: CITY_X.map(() => true),
    ...freshWave({ wave: 1 }),
    cross: [W / 2, 90],
    prevFire: false,
    score: 0,
    nextCity: 10000,
    over: false,
    events: [],
    steps: 0,
    destroyed: 0,
  };
}

/** A rocket aimed at a random target still standing (cities and launchers). */
function launchRocket(
  s: Shield,
  rng0: RngState,
  from?: { x: number; y: number },
): [Rocket, RngState] {
  let rng = rng0;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  const targets = [...CITY_X.filter((_, i) => s.cities[i]), ...LAUNCHER_X];
  const tx = targets[Math.floor(roll() * targets.length)]!;
  const x = from?.x ?? 8 + roll() * (W - 16);
  const y = from?.y ?? 0;
  const splits =
    !from && s.wave >= 3 && roll() < Math.min(0.4, 0.1 * (s.wave - 2))
      ? 2 + Math.floor(roll() * 2)
      : 0;
  return [
    {
      x,
      y,
      sx: x,
      sy: y,
      tx,
      ty: GROUND,
      speed: rocketSpeed(s.wave) * (from ? 1.1 : 1),
      splits,
      splitAt: 50 + roll() * 50,
    },
    rng,
  ];
}

function fireAt(s: Shield, tx: number, ty: number): Shield {
  if (ty > GROUND - 14) return s;
  // The nearest launcher with rounds left.
  let best = -1;
  for (let i = 0; i < LAUNCHER_X.length; i++) {
    const l = s.launchers[i]!;
    if (!l.up || l.rounds === 0) continue;
    if (best < 0 || Math.abs(LAUNCHER_X[i]! - tx) < Math.abs(LAUNCHER_X[best]! - tx)) best = i;
  }
  if (best < 0) return { ...s, events: [...s.events, 'dry'] };
  const launchers = s.launchers.map((l, i) => (i === best ? { ...l, rounds: l.rounds - 1 } : l));
  const lx = LAUNCHER_X[best]!;
  const it: Interceptor = {
    x: lx,
    y: GROUND - 6,
    sx: lx,
    sy: GROUND - 6,
    tx,
    ty,
    speed: best === 1 ? 6 : 4,
  };
  return {
    ...s,
    launchers,
    interceptors: [...s.interceptors, it],
    events: [...s.events, 'launch'],
  };
}

export const blastRadius = (b: Blast) =>
  b.age < BLAST_GROW
    ? (BLAST * b.age) / BLAST_GROW
    : BLAST * Math.max(0, 1 - (b.age - BLAST_GROW) / (BLAST_LIFE - BLAST_GROW)) ** 0.5;

export function stepShield(s0: Shield, action: ShieldAction): Shield {
  if (s0.over) return s0;
  let s: Shield = { ...s0, events: [], steps: s0.steps + 1 };
  let rng = s.rng;

  if (s.between > 0) {
    s.between--;
    if (s.between > 0) return s;
    const wave = s.wave + 1;
    return { ...s, wave, ...freshWave({ wave }), events: ['wave'] };
  }

  // Aiming and firing.
  const fire = action === 'fire';
  if (action.startsWith('at-')) {
    const [, c, r] = action.split('-').map(Number) as [number, number, number];
    const [x, y] = cellCentre(c, r);
    s.cross = [x, y];
    if (!s.prevFire) s = fireAt(s, x, y);
  } else if (fire) {
    if (!s.prevFire) s = fireAt(s, s.cross[0], s.cross[1]);
  } else if (action !== 'idle') {
    const dx = action.includes('left') ? -3 : action.includes('right') ? 3 : 0;
    const dy = action.startsWith('up') ? -3 : action.startsWith('down') ? 3 : 0;
    s.cross = [
      Math.max(4, Math.min(W - 4, s.cross[0] + dx)),
      Math.max(4, Math.min(GROUND - 16, s.cross[1] + dy)),
    ];
  }
  s.prevFire = fire || action.startsWith('at-');

  // Interceptors fly to their point and burst.
  const blasts = s.blasts.map((b) => ({ ...b, age: b.age + 1 })).filter((b) => b.age < BLAST_LIFE);
  const interceptors: Interceptor[] = [];
  for (const it0 of s.interceptors) {
    const it = { ...it0 };
    const d = Math.hypot(it.tx - it.x, it.ty - it.y);
    if (d <= it.speed) {
      blasts.push({ x: it.tx, y: it.ty, age: 0 });
      s.events.push('burst');
    } else {
      it.x += ((it.tx - it.x) / d) * it.speed;
      it.y += ((it.ty - it.y) / d) * it.speed;
      interceptors.push(it);
    }
  }

  // Rockets fall, split, and strike.
  let rockets: Rocket[] = [];
  let cities = s.cities;
  let launchers = s.launchers;
  for (const r0 of s.rockets) {
    const r = { ...r0 };
    const d = Math.hypot(r.tx - r.sx, r.ty - r.sy);
    r.x += ((r.tx - r.sx) / d) * r.speed;
    r.y += ((r.ty - r.sy) / d) * r.speed;
    if (r.splits > 0 && r.y >= r.splitAt) {
      for (let k = 0; k < r.splits; k++) {
        const [child, n] = launchRocket(s, rng, { x: r.x, y: r.y });
        rng = n;
        rockets.push(child);
      }
      s.events.push('split');
      continue;
    }
    if (r.y >= GROUND - 2) {
      const ci = CITY_X.indexOf(r.tx);
      if (ci >= 0 && cities[ci]) {
        cities = cities.map((c, i) => (i === ci ? false : c));
        s.events.push('city-lost');
      }
      const li = LAUNCHER_X.indexOf(r.tx);
      if (li >= 0) {
        launchers = launchers.map((l, i) => (i === li ? { ...l, up: false, rounds: 0 } : l));
        s.events.push('launcher-lost');
      }
      blasts.push({ x: r.x, y: GROUND - 4, age: 6 });
      continue;
    }
    rockets.push(r);
  }
  // Blasts destroy rockets inside them; each one destroyed bursts in turn.
  const survivors: Rocket[] = [];
  for (const r of rockets) {
    if (
      blasts.some((b) => b.age < BLAST_LIFE && Math.hypot(r.x - b.x, r.y - b.y) <= blastRadius(b))
    ) {
      s.score += 25 * multiplier(s.wave);
      s.destroyed++;
      blasts.push({ x: r.x, y: r.y, age: 4 });
      s.events.push('hit');
    } else survivors.push(r);
  }
  rockets = survivors;

  // New rockets, in small volleys.
  s.nextIn--;
  if (s.nextIn <= 0 && s.toCome > 0) {
    const [vr, n0] = rand(rng);
    rng = n0;
    const volley = Math.min(s.toCome, 1 + Math.floor(vr * Math.min(4, 1 + s.wave / 2)));
    for (let k = 0; k < volley; k++) {
      const [r, n] = launchRocket({ ...s, cities }, rng);
      rng = n;
      rockets.push(r);
    }
    s.toCome -= volley;
    const [g, n1] = rand(rng);
    rng = n1;
    s.nextIn = Math.round((150 - Math.min(90, s.wave * 8)) * (0.6 + 0.8 * g));
  }

  s = { ...s, rng, blasts, interceptors, rockets, cities, launchers };

  if (!s.cities.some(Boolean)) return { ...s, over: true, events: [...s.events, 'over'] };
  // The wave ends when nothing is left in the sky.
  if (
    s.toCome === 0 &&
    s.rockets.length === 0 &&
    s.interceptors.length === 0 &&
    s.blasts.length === 0
  ) {
    const rounds = s.launchers.reduce((a, l) => a + l.rounds, 0);
    const standing = s.cities.filter(Boolean).length;
    const bonus = (rounds * 5 + standing * 100) * multiplier(s.wave);
    const score = s.score + bonus;
    let cities2 = s.cities;
    let nextCity = s.nextCity;
    while (score >= nextCity) {
      const gone = cities2.indexOf(false);
      if (gone >= 0) cities2 = cities2.map((c, i) => (i === gone ? true : c));
      nextCity += 10000;
      s.events.push('rebuilt');
    }
    return {
      ...s,
      score,
      cities: cities2,
      nextCity,
      bonus,
      between: 150,
      events: [...s.events, 'cleared'],
    };
  }
  return s;
}

/** The grid cell nearest a point in the sky. */
export function cellOf(x: number, y: number): [number, number] {
  return [
    Math.max(0, Math.min(GRID_C - 1, Math.floor(x / CELL_W))),
    Math.max(0, Math.min(GRID_R - 1, Math.floor(y / CELL_H))),
  ];
}

/** Where a rocket will be after `t` steps (ignoring a split). */
const ahead = (r: Rocket, t: number): [number, number] => {
  const d = Math.hypot(r.tx - r.sx, r.ty - r.sy);
  return [r.x + ((r.tx - r.sx) / d) * r.speed * t, r.y + ((r.ty - r.sy) / d) * r.speed * t];
};

/**
 * A defender: takes the rocket that will strike soonest among those no blast or interceptor in
 * flight already covers, works out where it will be when an interceptor from the nearest working
 * launcher could get there (a few rounds of refining the meeting point), and fires at that point;
 * it leaves rockets aimed at already-ruined cities for last.
 */
export function defenderPolicy(s: Shield): ShieldAction {
  if (s.over || s.between) return 'idle';
  if (s.prevFire) return 'idle';
  const covered = (x: number, y: number) =>
    s.blasts.some((b) => b.age < BLAST_GROW + 6 && Math.hypot(x - b.x, y - b.y) < BLAST * 0.8) ||
    s.interceptors.some((it) => Math.hypot(x - it.tx, y - it.ty) < BLAST * 0.8);
  const live = (r: Rocket) => {
    const ci = CITY_X.indexOf(r.tx);
    return ci < 0 || s.cities[ci];
  };
  const candidates = s.rockets
    .map((r) => ({
      r,
      eta: (r.ty - r.y) / ((r.speed * (r.ty - r.sy)) / Math.hypot(r.tx - r.sx, r.ty - r.sy)),
    }))
    .filter(({ r }) => !covered(...ahead(r, 25)))
    .sort((a, b) => (live(b.r) ? 1 : 0) - (live(a.r) ? 1 : 0) || a.eta - b.eta);
  for (const { r } of candidates) {
    const working = LAUNCHER_X.map((x, i) => ({ x, i })).filter(
      ({ i }) => s.launchers[i]!.up && s.launchers[i]!.rounds > 0,
    );
    if (!working.length) return 'idle';
    let [px, py] = [r.x, r.y];
    for (let k = 0; k < 4; k++) {
      const l = working.sort((a, b) => Math.abs(a.x - px) - Math.abs(b.x - px))[0]!;
      const t = Math.hypot(px - l.x, py - (GROUND - 6)) / (l.i === 1 ? 6 : 4) + BLAST_GROW * 0.5;
      [px, py] = ahead(r, t);
    }
    if (py > GROUND - 18) continue;
    const [c, row] = cellOf(px, py);
    return `at-${c}-${row}`;
  }
  return 'idle';
}

/** A simple player: fires straight at the lowest rocket's current position, once a second. */
export function sniperPolicy(s: Shield): ShieldAction {
  if (s.over || s.between || s.prevFire || s.steps % 60 !== 0) return 'idle';
  const r = [...s.rockets].sort((a, b) => b.y - a.y)[0];
  if (!r || r.y > GROUND - 18) return 'idle';
  const [c, row] = cellOf(r.x, r.y);
  return `at-${c}-${row}`;
}

export function isShield(d: unknown): d is Shield {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Shield;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.cities) &&
    s.cities.length === 6 &&
    Array.isArray(s.rockets) &&
    Number.isFinite(s.score)
  );
}
