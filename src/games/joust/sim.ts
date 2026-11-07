/**
 * Sky Lances: an aerial jousting game with an original name and look, at 60 steps a second. The
 * player rides a flying mount: each flap lifts it, gravity pulls it down, and it drifts sideways
 * with momentum, wrapping round the screen's sides. Rival riders flap about the ledges in waves. When
 * two riders meet, the higher lance wins: the loser is unhorsed (a rival leaves an egg) — if they are
 * level, they bounce apart. An egg left lying hatches into a new rider after a while; picking it up
 * scores. Lava fills the bottom: touching it is fatal. Clearing a wave of riders and eggs brings the
 * next, with more and fiercer riders.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 320;
export const H = 224;
export const LAVA = H - 14;
const GRAVITY = 0.07;
const FLAP = 1.5;
const MAX_UP = 3;
const MAX_FALL = 3.5;
const AIR_ACCEL = 0.07;
const MAX_VX = 2.2;
const RIDER_W = 14;
const RIDER_H = 14;

export interface Ledge {
  x0: number;
  x1: number;
  y: number;
}

export const LEDGES: readonly Ledge[] = [
  { x0: 0, x1: 70, y: 70 },
  { x0: 250, x1: 320, y: 70 },
  { x0: 110, x1: 210, y: 92 },
  { x0: 0, x1: 90, y: 140 },
  { x0: 230, x1: 320, y: 140 },
  { x0: 125, x1: 195, y: 165 },
  { x0: 70, x1: 250, y: LAVA - 8 },
];

export type LanceAction = 'idle' | 'left' | 'right' | 'flap' | 'flap-left' | 'flap-right';
export const ACTIONS: readonly LanceAction[] = [
  'idle',
  'left',
  'right',
  'flap',
  'flap-left',
  'flap-right',
];

export type Rank = 'bounder' | 'hunter' | 'shadow';
export const RANK_POINTS: Record<Rank, number> = { bounder: 500, hunter: 750, shadow: 1500 };

export interface Rider {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  ground: boolean;
  rank: Rank | 'player';
  /** Steps until a computer rider may flap again. */
  cool: number;
}

export interface Egg {
  x: number;
  y: number;
  vy: number;
  rank: Rank;
  hatch: number;
}

export interface Lances {
  rng: RngState;
  wave: number;
  player: Rider;
  prevFlap: boolean;
  rivals: Rider[];
  eggs: Egg[];
  /** Riders still to appear this wave. */
  toCome: Rank[];
  spawnIn: number;
  lives: number;
  score: number;
  eggChain: number;
  nextLife: number;
  dying: number;
  /** The pause between waves. */
  between: number;
  over: boolean;
  events: string[];
  steps: number;
  unhorsed: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const wrapX = (x: number) => ((x % W) + W) % W;
/** Horizontal distance from a to b the short way round. */
export const dxWrap = (a: number, b: number) => ((((b - a) % W) + W * 1.5) % W) - W / 2;

function waveRanks(wave: number): Rank[] {
  const n = Math.min(8, 3 + wave);
  return Array.from({ length: n }, (_, i) =>
    wave >= 4 && i % 4 === 3 ? 'shadow' : wave >= 2 && i % 2 === 1 ? 'hunter' : 'bounder',
  );
}

function playerStart(): Rider {
  return {
    x: 160,
    y: LEDGES[6]!.y - RIDER_H,
    vx: 0,
    vy: 0,
    facing: 1,
    ground: true,
    rank: 'player',
    cool: 0,
  };
}

export function newLances(seed: number): Lances {
  return {
    rng: seedRng(seed >>> 0),
    wave: 1,
    player: playerStart(),
    prevFlap: false,
    rivals: [],
    eggs: [],
    toCome: waveRanks(1),
    spawnIn: 60,
    lives: 3,
    score: 0,
    eggChain: 0,
    nextLife: 20000,
    dying: 0,
    between: 0,
    over: false,
    events: [],
    steps: 0,
    unhorsed: 0,
  };
}

/** Moves a rider one step: flap, steer, gravity, ledges, wrapping. */
function fly(r0: Rider, flap: boolean, steer: -1 | 0 | 1): Rider {
  const r = { ...r0 };
  if (flap) {
    r.vy = Math.max(-MAX_UP, r.vy - FLAP);
    r.ground = false;
  }
  if (steer) {
    r.vx = Math.max(
      -MAX_VX,
      Math.min(MAX_VX, r.vx + steer * (r.ground ? AIR_ACCEL * 2 : AIR_ACCEL)),
    );
    r.facing = steer;
  } else if (r.ground) r.vx *= 0.9;
  if (!r.ground) r.vy = Math.min(MAX_FALL, r.vy + GRAVITY);
  const y0 = r.y;
  r.x = wrapX(r.x + r.vx);
  r.y += r.vy;
  if (r.y < 0) {
    r.y = 0;
    r.vy = 0.5;
  }
  // Landing on a ledge from above; bumping a ledge from below.
  r.ground = false;
  for (const l of LEDGES) {
    const over = r.x + RIDER_W / 2 > l.x0 && r.x - RIDER_W / 2 < l.x1;
    if (!over) continue;
    if (r.vy >= 0 && y0 + RIDER_H <= l.y + 0.5 && r.y + RIDER_H >= l.y) {
      r.y = l.y - RIDER_H;
      r.vy = 0;
      r.ground = true;
    } else if (r.vy < 0 && y0 >= l.y + 4 && r.y < l.y + 4) {
      r.y = l.y + 4;
      r.vy = 0.5;
    }
  }
  return r;
}

const meet = (a: Rider, b: Rider) =>
  Math.abs(dxWrap(a.x, b.x)) < RIDER_W - 2 && Math.abs(a.y - b.y) < RIDER_H - 2;

export function stepLances(s0: Lances, action: LanceAction): Lances {
  if (s0.over) return s0;
  let s: Lances = { ...s0, events: [], steps: s0.steps + 1 };
  let rng = s.rng;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  if (s.between > 0) {
    s.between--;
    if (s.between > 0) return s;
    return { ...s, wave: s.wave + 1, toCome: waveRanks(s.wave + 1), spawnIn: 60, events: ['wave'] };
  }
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    return { ...s, lives, player: playerStart(), prevFlap: false };
  }

  // The player.
  const flapHeld = action.startsWith('flap');
  const steer: -1 | 0 | 1 = action.endsWith('left') ? -1 : action.endsWith('right') ? 1 : 0;
  const flapNow = flapHeld && !s.prevFlap;
  s.prevFlap = flapHeld;
  s.player = fly(s.player, flapNow, steer);
  if (flapNow) s.events.push('flap');

  // Rivals appear on the ledges' ends, and fly: bounders wander, hunters and shadows chase.
  s.spawnIn--;
  if (s.spawnIn <= 0 && s.toCome.length) {
    const rank = s.toCome[0]!;
    const l = LEDGES[Math.floor(roll() * (LEDGES.length - 1))]!;
    s.rivals = [
      ...s.rivals,
      {
        x: l.x0 + 10 + roll() * (l.x1 - l.x0 - 20),
        y: l.y - RIDER_H,
        vx: 0,
        vy: 0,
        facing: roll() < 0.5 ? 1 : -1,
        ground: true,
        rank,
        cool: 30,
      },
    ];
    s.toCome = s.toCome.slice(1);
    s.spawnIn = 90;
    s.events.push('arrive');
  }
  s.rivals = s.rivals.map((r0, k) => {
    const r = { ...r0 };
    const p = s.player;
    // Riders take turns hunting the player in spells (the keener the rank, the longer), and
    // otherwise cruise at a height of their own.
    const keen = r.rank === 'shadow' ? 3 : r.rank === 'hunter' ? 2 : 1;
    const hunting = (Math.floor(s.steps / 240) + k) % 4 < keen;
    const dx = dxWrap(r.x, p.x);
    const wantY = hunting ? p.y - 10 : 40 + ((k * 37) % 90);
    const steerR: -1 | 1 = hunting
      ? dx > 0
        ? 1
        : -1
      : roll() < 0.01
        ? (-r.facing as 1 | -1)
        : r.facing;
    let flapR = false;
    if (r.cool > 0) r.cool--;
    else if (r.y > wantY || r.y > LAVA - 50) {
      flapR = true;
      r.cool = r.rank === 'shadow' ? 7 : r.rank === 'hunter' ? 10 : 14;
    }
    const moved = fly(r, flapR, steerR);
    // Keep their speed down a little.
    const cap = r.rank === 'shadow' ? 2.2 : r.rank === 'hunter' ? 1.8 : 1.4;
    moved.vx = Math.max(-cap, Math.min(cap, moved.vx));
    return moved;
  });

  // Eggs fall to ledges, and hatch if left.
  const eggs: Egg[] = [];
  for (const e0 of s.eggs) {
    const e = { ...e0, vy: Math.min(3, e0.vy + GRAVITY), hatch: e0.hatch - 1 };
    e.y += e.vy;
    for (const l of LEDGES)
      if (e.x > l.x0 && e.x < l.x1 && e.y + 6 >= l.y && e.y + 6 - e.vy <= l.y + 0.5) {
        e.y = l.y - 6;
        e.vy = 0;
      }
    if (e.y > LAVA) continue;
    if (Math.abs(dxWrap(e.x, s.player.x)) < 10 && Math.abs(e.y - (s.player.y + 6)) < 12) {
      s.eggChain++;
      s.score += 250 * Math.min(4, s.eggChain);
      s.events.push('egg');
      continue;
    }
    if (e.hatch <= 0) {
      const next: Rank = e.rank === 'bounder' ? 'hunter' : 'shadow';
      s.rivals = [
        ...s.rivals,
        { x: e.x, y: e.y - 10, vx: 0, vy: -1, facing: 1, ground: false, rank: next, cool: 20 },
      ];
      s.events.push('hatch');
      continue;
    }
    eggs.push(e);
  }
  s.eggs = eggs;

  // Jousts: the higher lance wins.
  const rivals: Rider[] = [];
  for (const r of s.rivals) {
    if (!meet(r, s.player)) {
      rivals.push(r);
      continue;
    }
    const diff = r.y - s.player.y;
    if (diff > 3) {
      s.score += RANK_POINTS[r.rank as Rank];
      s.unhorsed++;
      s.eggs = [...s.eggs, { x: r.x, y: r.y, vy: -1, rank: r.rank as Rank, hatch: 600 }];
      s.events.push('unhorse');
    } else if (diff < -3) {
      return { ...s, rng, dying: 90, events: [...s.events, 'unhorsed'] };
    } else {
      // Level: both bounce back.
      const side = dxWrap(s.player.x, r.x) > 0 ? -1 : 1;
      s.player = { ...s.player, vx: side * 1.8, vy: -0.8 };
      rivals.push({ ...r, vx: -side * 1.8, vy: -0.8 });
      s.events.push('clash');
    }
  }
  s.rivals = rivals;

  // Lava.
  if (s.player.y + RIDER_H >= LAVA) return { ...s, rng, dying: 90, events: [...s.events, 'lava'] };
  s.rivals = s.rivals.filter((r) => r.y + RIDER_H < LAVA);

  if (s.score >= s.nextLife) {
    s.lives++;
    s.nextLife += 20000;
    s.events.push('extra');
  }
  s.rng = rng;
  if (!s.toCome.length && !s.rivals.length && !s.eggs.length) {
    s = {
      ...s,
      score: s.score + 3000,
      between: 150,
      eggChain: 0,
      events: [...s.events, 'cleared'],
    };
  }
  return s;
}

/**
 * A lancer: picks the nearest rival (or a lying egg when no rival is near), flies to a point a
 * little above it — flapping whenever it is below that height, never letting itself sink near the
 * lava — and steers the short way round towards it; when a keener rival is higher and close, it
 * climbs first.
 */
export function lancerPolicy(s: Lances): LanceAction {
  if (s.over || s.dying || s.between) return 'idle';
  const p = s.player;
  const near = [...s.rivals].sort(
    (a, b) =>
      Math.abs(dxWrap(p.x, a.x)) +
      Math.abs(a.y - p.y) -
      (Math.abs(dxWrap(p.x, b.x)) + Math.abs(b.y - p.y)),
  )[0];
  const egg = [...s.eggs].sort(
    (a, b) => Math.abs(dxWrap(p.x, a.x)) - Math.abs(dxWrap(p.x, b.x)),
  )[0];
  let tx = p.x;
  let ty = 60;
  if (
    egg &&
    (!near ||
      Math.abs(dxWrap(p.x, egg.x)) + Math.abs(egg.y - p.y) <
        Math.abs(dxWrap(p.x, near.x)) + Math.abs(near.y - p.y) + 40)
  ) {
    tx = egg.x;
    ty = egg.y - 8;
  } else if (near) {
    tx = near.x;
    ty = near.y - 14;
  }
  // Danger: a rival above and close — climb, turning away until we are higher.
  const threat = s.rivals.find(
    (r) => r.y < p.y + 6 && Math.abs(dxWrap(p.x, r.x)) < 50 && Math.abs(r.y - p.y) < 40,
  );
  let dx = dxWrap(p.x, tx);
  if (threat) {
    ty = Math.min(ty, threat.y - 16);
    dx = -dxWrap(p.x, threat.x);
  }
  const steer = Math.abs(dx) < 4 ? '' : dx > 0 ? 'right' : 'left';
  const wantFlap = (p.y > ty && p.vy > -1) || p.y > LAVA - 45;
  if (wantFlap && !s.prevFlap) return (steer ? `flap-${steer}` : 'flap') as LanceAction;
  return (steer || 'idle') as LanceAction;
}

/** A simple player: flaps to hold a middle height and drifts towards the nearest rival. */
export function glidePolicy(s: Lances): LanceAction {
  if (s.over || s.dying || s.between) return 'idle';
  const p = s.player;
  const near = s.rivals[0];
  const dx = near ? dxWrap(p.x, near.x) : 0;
  const steer = Math.abs(dx) < 4 ? '' : dx > 0 ? 'right' : 'left';
  if (p.y > 110 && p.vy > -0.5 && !s.prevFlap)
    return (steer ? `flap-${steer}` : 'flap') as LanceAction;
  return (steer || 'idle') as LanceAction;
}

export function isLances(d: unknown): d is Lances {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Lances;
  return (
    Array.isArray(s.rng) &&
    typeof s.player === 'object' &&
    Array.isArray(s.rivals) &&
    Array.isArray(s.eggs) &&
    Number.isFinite(s.score)
  );
}
