/**
 * Canyon Run: a river-raid style scrolling shooter with an original name and look, at 60 steps a
 * second. The jet flies up a winding river (generated from the run's seed): it steers left and right,
 * speeds up or slows down, and fires straight ahead, one shot at a time. Fuel burns steadily (faster
 * at speed); flying over a fuel depot refills it — shooting one scores but loses it. Boats and
 * helicopters patrol the water and start to weave as the jet comes near; jets streak across. Each
 * stretch ends at a bridge over a narrow channel, which must be shot down to pass; the last bridge
 * passed is where the next jet starts. Touching a bank, an island, an enemy or a bridge, or running
 * out of fuel, costs a jet (four).
 */
export const W = 240;
export const H = 320;
export const ROW = 8;
export const SECTION = 64;
const BRIDGE_ROW = 60;
export const JET_Y = 50;
const STEER = 2;
const SPEEDS = [1, 1.8, 3];
const FUEL_BURN = 0.035;

type Move = 'left' | 'right' | 'up' | 'down' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
export type RaidAction = 'idle' | 'fire' | Move | `${Move}-fire`;
const MOVES: Move[] = [
  'left',
  'right',
  'up',
  'down',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
];
export const ACTIONS: readonly RaidAction[] = [
  'idle',
  'fire',
  ...MOVES,
  ...MOVES.map((m) => `${m}-fire` as RaidAction),
];

export type ThingKind = 'boat' | 'heli' | 'jet' | 'depot';
export const THING_POINTS: Record<ThingKind, number> = { boat: 30, heli: 60, jet: 100, depot: 80 };

export interface Thing {
  /** The row it belongs to (its identity), its position across and in the world. */
  id: number;
  kind: ThingKind;
  x: number;
  wy: number;
  vx: number;
  awake: boolean;
}

export interface Raid {
  seed: number;
  /** World distance scrolled (the bottom of the screen), and the jet's place across. */
  d: number;
  x: number;
  speed: number;
  fuel: number;
  shot: { x: number; wy: number } | null;
  prevFire: boolean;
  things: Thing[];
  /** Rows whose things are gone (destroyed or passed), and bridges down. */
  gone: number[];
  bridgesDown: number[];
  /** The world distance of the last bridge passed. */
  checkpoint: number;
  lives: number;
  score: number;
  nextLife: number;
  dying: number;
  cause: string | null;
  over: boolean;
  events: string[];
  steps: number;
}

/** A small hash of numbers into [0, 1), for the river's shape (no generator state needed). */
function hash(...xs: number[]): number {
  let h = 2166136261;
  for (const x of xs) {
    h ^= x + 0x9e3779b9 + (h << 6) + (h >>> 2);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 2 ** 32;
}

export interface RiverRow {
  x0: number;
  x1: number;
  /** An island across [i0, i1], or none (i0 = i1). */
  i0: number;
  i1: number;
  bridge: boolean;
}

/** The river at a row: keyframes every 16 rows, a narrow channel and a bridge at each section's end. */
export function riverAt(seed: number, row: number): RiverRow {
  if (row < 0) return { x0: 40, x1: 200, i0: 120, i1: 120, bridge: false };
  const sec = Math.floor(row / SECTION);
  const r = row % SECTION;
  const channel = { c: W / 2, w: 52, iw: 0 };
  const key = (k: number) => {
    if (k <= 0 || k >= 4) return channel;
    const hard = Math.min(1, sec / 10);
    const w = 120 + hash(seed, sec, k, 1) * (90 - hard * 30);
    const c = W / 2 + (hash(seed, sec, k, 2) - 0.5) * (W - w - 20);
    const iw = sec > 0 && hash(seed, sec, k, 3) < 0.35 ? 24 + hash(seed, sec, k, 4) * 30 : 0;
    return { c, w, iw };
  };
  // Rows 0–7 open out of the channel, 8–55 follow keyframes, 56–63 close into the channel.
  let k0: { c: number; w: number; iw: number };
  let k1: { c: number; w: number; iw: number };
  let t: number;
  if (r < 8) {
    k0 = channel;
    k1 = key(1);
    t = r / 8;
  } else if (r >= 56) {
    k0 = key(3);
    k1 = channel;
    t = (r - 56) / 8;
  } else {
    const seg = Math.min(2, Math.floor((r - 8) / 16));
    k0 = key(seg + 1);
    k1 = key(seg + 2 > 3 ? 3 : seg + 2);
    t = ((r - 8) % 16) / 16;
  }
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const c = lerp(k0.c, k1.c);
  const w = lerp(k0.w, k1.w);
  const iw = r >= 56 || r < 8 ? 0 : Math.min(k0.iw, k1.iw);
  return { x0: c - w / 2, x1: c + w / 2, i0: c - iw / 2, i1: c + iw / 2, bridge: r === BRIDGE_ROW };
}

/** The thing that starts on a row, if any (from the seed alone). */
function thingAt(seed: number, row: number): Thing | null {
  const r = row % SECTION;
  if (row < 24 || r % 6 !== 3 || r > 54) return null;
  const p = hash(seed, row, 7);
  if (p < 0.25) return null;
  const sec = Math.floor(row / SECTION);
  const kind: ThingKind =
    p < 0.5 ? 'boat' : p < 0.68 ? 'heli' : p < 0.78 && sec > 0 ? 'jet' : 'depot';
  const river = riverAt(seed, row);
  // Place it in the wider water channel beside any island.
  const left = river.i1 > river.i0 && river.i0 - river.x0 > river.x1 - river.i1;
  const lo = river.i1 > river.i0 ? (left ? river.x0 : river.i1) : river.x0;
  const hi = river.i1 > river.i0 ? (left ? river.i0 : river.x1) : river.x1;
  const x =
    kind === 'jet'
      ? hash(seed, row, 9) < 0.5
        ? -10
        : W + 10
      : lo + 10 + hash(seed, row, 8) * Math.max(0, hi - lo - 20);
  return {
    id: row,
    kind,
    x,
    wy: row * ROW + 4,
    vx: kind === 'jet' ? (x < 0 ? 1.6 : -1.6) : 0,
    awake: false,
  };
}

export function newRaid(seed: number): Raid {
  return {
    seed: seed >>> 0,
    d: 0,
    x: W / 2,
    speed: 1,
    fuel: 100,
    shot: null,
    prevFire: false,
    things: [],
    gone: [],
    bridgesDown: [],
    checkpoint: 0,
    lives: 4,
    score: 0,
    nextLife: 10000,
    dying: 0,
    cause: null,
    over: false,
    events: [],
    steps: 0,
  };
}

const jetWy = (s: Pick<Raid, 'd'>) => s.d + JET_Y;
/** Whether a span of x is over water (not bank or island) on a row. */
function wet(seed: number, row: number, xa: number, xb: number): boolean {
  const r = riverAt(seed, row);
  if (xa < r.x0 || xb > r.x1) return false;
  if (r.i1 > r.i0 && xb > r.i0 && xa < r.i1) return false;
  return true;
}

export function stepRaid(s0: Raid, action: RaidAction): Raid {
  if (s0.over) return s0;
  let s: Raid = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    // Back to the last bridge, with that stretch as it was.
    const fromRow = Math.floor(s.checkpoint / ROW);
    return {
      ...s,
      lives,
      d: s.checkpoint,
      x: W / 2,
      speed: 1,
      fuel: 100,
      shot: null,
      things: [],
      gone: s.gone.filter((r) => r < fromRow),
      cause: null,
    };
  }
  const move = action.replace('-fire', '');
  const fire = action === 'fire' || action.endsWith('-fire');
  const steer = move.includes('left') ? -1 : move.includes('right') ? 1 : 0;
  s.speed = move.startsWith('up') ? SPEEDS[2]! : move.startsWith('down') ? SPEEDS[0]! : SPEEDS[1]!;
  s.x = Math.max(6, Math.min(W - 6, s.x + steer * STEER));
  s.d += s.speed;
  s.fuel -= FUEL_BURN * (0.6 + s.speed * 0.4);
  if (fire && !s.prevFire && !s.shot) {
    s.shot = { x: s.x, wy: jetWy(s) + 8 };
    s.events.push('fire');
  }
  s.prevFire = fire;

  // Things come into view as their rows do; jets cross, boats and helicopters weave when near.
  const topRow = Math.floor((s.d + H + 20) / ROW);
  const seen = new Set(s.things.map((t) => t.id));
  let things = s.things.map((t) => ({ ...t }));
  for (let row = Math.floor(s.d / ROW); row <= topRow; row++) {
    if (seen.has(row) || s.gone.includes(row)) continue;
    const t = thingAt(s.seed, row);
    if (t) things.push(t);
  }
  for (const t of things) {
    const dy = t.wy - jetWy(s);
    if (!t.awake && dy < 180 && t.kind !== 'depot') {
      t.awake = true;
      if (t.kind !== 'jet') t.vx = hash(s.seed, t.id, 11) < 0.5 ? 0.6 : -0.6;
    }
    if (t.awake) {
      t.x += t.vx;
      if (t.kind !== 'jet') {
        const row = Math.floor(t.wy / ROW);
        if (!wet(s.seed, row, t.x - 8, t.x + 8)) {
          t.vx = -t.vx;
          t.x += t.vx * 2;
        }
      }
    }
  }
  things = things.filter((t) => t.wy > s.d - 20 && t.x > -30 && t.x < W + 30);

  // The shot.
  let gone = s.gone;
  let bridgesDown = s.bridgesDown;
  if (s.shot) {
    let shot: { x: number; wy: number } | null = { ...s.shot, wy: s.shot.wy + 8 };
    const hit = things.find((t) => Math.abs(t.x - shot!.x) < 9 && Math.abs(t.wy - shot!.wy) < 8);
    const row = Math.floor(shot.wy / ROW);
    const sec = Math.floor(row / SECTION);
    if (hit) {
      s.score += THING_POINTS[hit.kind];
      gone = [...gone, hit.id];
      things = things.filter((t) => t !== hit);
      s.events.push(hit.kind === 'depot' ? 'depot-hit' : 'hit');
      shot = null;
    } else if (riverAt(s.seed, row).bridge && !bridgesDown.includes(sec)) {
      bridgesDown = [...bridgesDown, sec];
      s.score += 500;
      s.events.push('bridge');
      shot = null;
    } else if (!wet(s.seed, row, shot.x, shot.x + 1) || shot.wy > s.d + H) shot = null;
    s.shot = shot;
  }
  s = { ...s, things, gone, bridgesDown };

  // Refuelling over a depot.
  const jy = jetWy(s);
  if (
    things.some((t) => t.kind === 'depot' && Math.abs(t.x - s.x) < 12 && Math.abs(t.wy - jy) < 12)
  ) {
    if (s.fuel < 100) {
      s.fuel = Math.min(100, s.fuel + 0.6);
      if (s.steps % 10 === 0) s.events.push('refuel');
    }
  }
  // Passing a bridge (once down) is a checkpoint.
  const jetRow = Math.floor(jy / ROW);
  const sec = Math.floor(jetRow / SECTION);
  if (
    jetRow % SECTION === BRIDGE_ROW + 1 &&
    bridgesDown.includes(sec) &&
    s.checkpoint < (sec * SECTION + BRIDGE_ROW + 1) * ROW - JET_Y
  ) {
    s.checkpoint = (sec * SECTION + BRIDGE_ROW + 1) * ROW - JET_Y;
    s.events.push('checkpoint');
  }

  // Crashes.
  let cause: string | null = null;
  for (const dy of [-5, 0, 5])
    if (!wet(s.seed, Math.floor((jy + dy) / ROW), s.x - 5, s.x + 5)) cause = 'bank';
  const bridgeRow = sec * SECTION + BRIDGE_ROW;
  if (!bridgesDown.includes(sec) && Math.abs(bridgeRow * ROW + 4 - jy) < 7) cause = 'bridge';
  if (things.some((t) => t.kind !== 'depot' && Math.abs(t.x - s.x) < 10 && Math.abs(t.wy - jy) < 9))
    cause = 'enemy';
  if (s.fuel <= 0) cause = 'fuel';
  if (cause) return { ...s, dying: 90, cause, events: [...s.events, 'crash', cause] };

  if (s.score >= s.nextLife) {
    s.lives++;
    s.nextLife += 10000;
    s.events.push('extra');
  }
  return s;
}

// ---- Players ----

/** The middle of the water channel to aim for at a row: the wider side of any island. */
function channelMid(seed: number, row: number): number {
  const r = riverAt(seed, row);
  if (r.i1 <= r.i0) return (r.x0 + r.x1) / 2;
  return r.i0 - r.x0 > r.x1 - r.i1 ? (r.x0 + r.i0) / 2 : (r.i1 + r.x1) / 2;
}

/**
 * A pilot: steers for the middle of the water a little ahead (taking the wider side of islands),
 * heads for a depot when fuel runs low and slows down over it, fires at enemies and bridges ahead
 * in its line (sparing depots while it needs fuel), sidesteps enemies it is not shooting, and
 * slows down where the river bends sharply.
 */
export function pilotPolicy(s: Raid): RaidAction {
  if (s.over || s.dying) return 'idle';
  const jy = jetWy(s);
  const row = Math.floor(jy / ROW);
  let tx = channelMid(s.seed, row + 5);
  const needFuel = s.fuel < 55;
  const depot = s.things.find((t) => t.kind === 'depot' && t.wy > jy - 4 && t.wy - jy < 140);
  if (needFuel && depot) tx = depot.x;
  const enemyAhead = s.things.find(
    (t) => t.kind !== 'depot' && t.wy > jy && t.wy - jy < 160 && Math.abs(t.x - s.x) < 10,
  );
  const depotAhead = s.things.find(
    (t) => t.kind === 'depot' && t.wy > jy && t.wy - jy < 160 && Math.abs(t.x - s.x) < 10,
  );
  const sec = Math.floor(row / SECTION);
  const bridgeAhead = !s.bridgesDown.includes(sec) && (sec * SECTION + BRIDGE_ROW) * ROW - jy < 200;
  const fire =
    (enemyAhead && (!depotAhead || depotAhead.wy > enemyAhead.wy)) ||
    bridgeAhead ||
    (depotAhead && !needFuel && s.fuel > 85);
  // Sidestep enemies close ahead that the shot will not clear in time.
  const close = s.things.find(
    (t) => t.kind !== 'depot' && t.wy > jy - 4 && t.wy - jy < 50 && Math.abs(t.x - s.x) < 18,
  );
  if (close) tx = s.x + (close.x > s.x ? -20 : 20);
  // Stay within the stretch of water the jet is in over the next few rows (never across an island).
  let lo = 0;
  let hi = W;
  for (let k = -1; k <= 4; k++) {
    const r = riverAt(s.seed, row + k);
    const inIsleSpan = r.i1 > r.i0;
    const spanLo = inIsleSpan && s.x > r.i1 - 2 ? r.i1 : r.x0;
    const spanHi = inIsleSpan && s.x < r.i0 + 2 ? r.i0 : r.x1;
    lo = Math.max(lo, spanLo + 9);
    hi = Math.min(hi, spanHi - 9);
  }
  if (lo <= hi) tx = Math.max(lo, Math.min(hi, tx));
  const bend = Math.abs(channelMid(s.seed, row + 12) - channelMid(s.seed, row + 2));
  const steer = Math.abs(tx - s.x) < 2 ? '' : tx > s.x ? 'right' : 'left';
  const slow = (needFuel && depot && Math.abs(depot.wy - jy) < 30) || bend > 30 || bridgeAhead;
  const v = slow ? 'down' : '';
  const m = [v, steer].filter(Boolean).join('-');
  if (fire && !s.prevFire && !s.shot) return (m ? `${m}-fire` : 'fire') as RaidAction;
  return (m || 'idle') as RaidAction;
}

/** A simple pilot: follows the middle of the river and never fires. */
export function cruisePolicy(s: Raid): RaidAction {
  if (s.over || s.dying) return 'idle';
  const r = riverAt(s.seed, Math.floor(jetWy(s) / ROW) + 4);
  const tx = (r.x0 + r.x1) / 2;
  return Math.abs(tx - s.x) < 2 ? 'idle' : tx > s.x ? 'right' : 'left';
}

export function isRaid(d: unknown): d is Raid {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Raid;
  return (
    Number.isFinite(s.seed) &&
    Number.isFinite(s.d) &&
    Number.isFinite(s.x) &&
    Array.isArray(s.things) &&
    Array.isArray(s.gone) &&
    Number.isFinite(s.score)
  );
}
