/**
 * Nebula Strike: a vertical scrolling shooter with an original name and look, at 60 steps a second.
 * The player's fighter flies anywhere in the lower part of the screen and fires straight up (more
 * shots as its power rises, up to a five-way spread). Waves of enemies come down from the top —
 * darters that weave and shoot at the fighter, swoopers that curve in from the sides, slow heavy
 * tanks that fire spreads, and carriers that drop power-ups — and after a minute of waves a boss
 * arrives. A bomb (three to start, more in pickups) clears every enemy bullet and damages everything
 * on screen. Only the small core of the fighter can be hit. Three lives; stages repeat harder.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 240;
export const H = 320;
const SPEED = 2.2;
const CORE = 3;
const FIRE_EVERY = 7;
export const STAGE_TIME = 60 * 60;

type Dir = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
export type StrikeAction = 'idle' | 'bomb' | Dir;
const DIRS: Dir[] = [
  'up',
  'down',
  'left',
  'right',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
];
export const ACTIONS: readonly StrikeAction[] = ['idle', 'bomb', ...DIRS];

export type EnemyKind = 'darter' | 'swooper' | 'tank' | 'carrier' | 'boss';
const HP: Record<EnemyKind, number> = { darter: 1, swooper: 2, tank: 8, carrier: 4, boss: 160 };
export const POINTS: Record<EnemyKind, number> = {
  darter: 100,
  swooper: 150,
  tank: 600,
  carrier: 300,
  boss: 10000,
};
const SIZE: Record<EnemyKind, number> = { darter: 7, swooper: 7, tank: 12, carrier: 9, boss: 28 };

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  /** Steps alive (drives the flight path), and a phase for variety. */
  t: number;
  phase: number;
  fireIn: number;
}

export interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Pickup {
  x: number;
  y: number;
  kind: 'power' | 'bomb';
}

export interface Strike {
  rng: RngState;
  stage: number;
  /** Steps into the stage; the boss comes at STAGE_TIME. */
  clock: number;
  x: number;
  y: number;
  power: number;
  bombs: number;
  prevBomb: boolean;
  fireIn: number;
  shots: Shot[];
  enemies: Enemy[];
  bullets: Shot[];
  pickups: Pickup[];
  /** A bomb's flash, and the safety after losing a life. */
  flash: number;
  safe: number;
  waveIn: number;
  bossOut: boolean;
  lives: number;
  score: number;
  nextLife: number;
  dying: number;
  over: boolean;
  events: string[];
  steps: number;
  kills: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export function newStrike(seed: number): Strike {
  return {
    rng: seedRng(seed >>> 0),
    stage: 1,
    clock: 0,
    x: W / 2,
    y: H - 40,
    power: 1,
    bombs: 3,
    prevBomb: false,
    fireIn: 0,
    shots: [],
    enemies: [],
    bullets: [],
    pickups: [],
    flash: 0,
    safe: 120,
    waveIn: 60,
    bossOut: false,
    lives: 3,
    score: 0,
    nextLife: 50000,
    dying: 0,
    over: false,
    events: [],
    steps: 0,
    kills: 0,
  };
}

/** Where an enemy is after t steps of its flight. */
function fly(e: Enemy, stage: number): [number, number] {
  const k = 1 + (stage - 1) * 0.15;
  switch (e.kind) {
    case 'darter':
      return [e.phase + Math.sin(e.t / 25) * 40, -10 + e.t * 1.1 * k];
    case 'swooper': {
      const side = e.phase < W / 2 ? -1 : 1;
      const u = e.t / 140;
      return [W / 2 + side * (W / 2 + 10) * Math.cos(u * Math.PI), -10 + e.t * 1.3 * k];
    }
    case 'tank':
      return [e.phase, -14 + Math.min(e.t * 0.5, 90) + Math.max(0, e.t - 600) * 0.6];
    case 'carrier':
      return [e.phase + e.t * 0.6 * (e.phase < W / 2 ? 1 : -1), 40 + Math.sin(e.t / 30) * 10];
    case 'boss':
      return [W / 2 + Math.sin(e.t / 90) * 70, Math.min(-30 + e.t * 0.6, 60)];
  }
}

export function stepStrike(s0: Strike, action: StrikeAction): Strike {
  if (s0.over) return s0;
  const s: Strike = { ...s0, events: [], steps: s0.steps + 1 };
  let rng = s.rng;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    return {
      ...s,
      lives,
      x: W / 2,
      y: H - 40,
      power: Math.max(1, s.power - 1),
      bombs: Math.max(s.bombs, 2),
      bullets: [],
      safe: 150,
    };
  }
  // Flying and firing (always on).
  const dx = action.includes('left') ? -1 : action.includes('right') ? 1 : 0;
  const dy = action.startsWith('up') ? -1 : action.startsWith('down') ? 1 : 0;
  const norm = dx && dy ? Math.SQRT1_2 : 1;
  s.x = Math.max(8, Math.min(W - 8, s.x + dx * SPEED * norm));
  s.y = Math.max(H * 0.35, Math.min(H - 10, s.y + dy * SPEED * norm));
  s.fireIn--;
  let shots = s.shots
    .map((b) => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
    .filter((b) => b.y > -8 && b.x > -8 && b.x < W + 8);
  if (s.fireIn <= 0) {
    s.fireIn = FIRE_EVERY;
    const spread = [[0], [-4, 4], [-6, 0, 6], [-8, -3, 3, 8], [-10, -5, 0, 5, 10]][
      Math.min(s.power, 5) - 1
    ]!;
    for (const o of spread) shots.push({ x: s.x + o, y: s.y - 10, vx: o * 0.08, vy: -7 });
    s.events.push('shoot');
  }
  // A bomb.
  const bombNow = action === 'bomb' && !s.prevBomb;
  s.prevBomb = action === 'bomb';
  let bullets = s.bullets;
  let enemies = s.enemies.map((e) => ({ ...e }));
  if (bombNow && s.bombs > 0) {
    s.bombs--;
    s.flash = 40;
    bullets = [];
    for (const e of enemies) e.hp -= e.kind === 'boss' ? 25 : 10;
    s.events.push('bomb');
  }
  if (s.flash > 0) s.flash--;
  if (s.safe > 0) s.safe--;

  // Waves, then the boss.
  s.clock++;
  s.waveIn--;
  if (s.clock < STAGE_TIME && s.waveIn <= 0) {
    const r = roll();
    const kinds: EnemyKind[] =
      r < 0.45
        ? ['darter', 'darter', 'darter', 'darter']
        : r < 0.75
          ? ['swooper', 'swooper', 'swooper']
          : r < 0.92
            ? ['tank']
            : ['carrier'];
    const base = 30 + roll() * (W - 60);
    kinds.forEach((kind, k) => {
      const phase =
        kind === 'swooper'
          ? roll() < 0.5
            ? 0
            : W
          : kind === 'carrier'
            ? roll() < 0.5
              ? -10
              : W + 10
            : base + (k - kinds.length / 2) * 22;
      enemies.push({
        kind,
        x: phase,
        y: -10,
        hp: HP[kind] + Math.floor((s.stage - 1) * HP[kind] * 0.3),
        t: -k * 18,
        phase,
        fireIn: 60 + Math.floor(roll() * 60),
      });
    });
    s.waveIn = Math.max(40, 110 - s.stage * 10 - Math.floor(roll() * 30));
  }
  if (s.clock === STAGE_TIME && !s.bossOut) {
    enemies.push({
      kind: 'boss',
      x: W / 2,
      y: -30,
      hp: HP.boss + (s.stage - 1) * 60,
      t: 0,
      phase: 0,
      fireIn: 90,
    });
    s.bossOut = true;
    s.events.push('boss');
  }
  // Enemies fly and fire.
  const newBullets: Shot[] = [];
  const aim = (e: Enemy, speed: number, spread = 0): Shot => {
    const a = Math.atan2(s.y - e.y, s.x - e.x) + spread;
    return { x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
  };
  const bulletSpeed = 1.6 + (s.stage - 1) * 0.25;
  for (const e of enemies) {
    e.t++;
    if (e.t < 0) continue;
    [e.x, e.y] = fly(e, s.stage);
    e.fireIn--;
    if (e.fireIn > 0 || e.y < 0 || e.y > H * 0.7) continue;
    if (e.kind === 'darter') {
      newBullets.push(aim(e, bulletSpeed));
      e.fireIn = 120 + Math.floor(roll() * 90);
    } else if (e.kind === 'swooper') {
      newBullets.push(aim(e, bulletSpeed * 1.1));
      e.fireIn = 150;
    } else if (e.kind === 'tank') {
      for (const sp of [-0.3, 0, 0.3]) newBullets.push(aim(e, bulletSpeed * 0.9, sp));
      e.fireIn = 80;
    } else if (e.kind === 'boss') {
      // Alternating: an aimed burst, then a ring.
      if (Math.floor(e.t / 240) % 2 === 0) {
        for (const sp of [-0.2, -0.1, 0, 0.1, 0.2]) newBullets.push(aim(e, bulletSpeed * 1.2, sp));
        e.fireIn = 45;
      } else {
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2 + e.t / 50;
          newBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * bulletSpeed,
            vy: Math.sin(a) * bulletSpeed,
          });
        }
        e.fireIn = 60;
      }
    }
  }
  bullets = [...bullets, ...newBullets]
    .map((b) => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
    .filter((b) => b.x > -6 && b.x < W + 6 && b.y > -6 && b.y < H + 6);

  // Our shots hit enemies.
  shots = shots.filter((b) => {
    for (const e of enemies) {
      if (e.t < 0 || e.hp <= 0) continue;
      const r = SIZE[e.kind];
      if (Math.abs(b.x - e.x) < r && Math.abs(b.y - e.y) < r) {
        e.hp--;
        return false;
      }
    }
    return true;
  });
  const pickups = s.pickups.map((p) => ({ ...p, y: p.y + 0.8 })).filter((p) => p.y < H + 8);
  const alive: Enemy[] = [];
  for (const e of enemies) {
    if (e.hp <= 0) {
      s.score += POINTS[e.kind] * (1 + (s.stage - 1) * 0.5);
      s.kills++;
      s.events.push(e.kind === 'boss' ? 'boss-down' : 'kill');
      if (e.kind === 'carrier')
        pickups.push({ x: e.x, y: e.y, kind: roll() < 0.7 ? 'power' : 'bomb' });
      continue;
    }
    if (e.y > H + 20 || (e.kind === 'carrier' && (e.x < -20 || e.x > W + 20))) continue;
    alive.push(e);
  }
  enemies = alive;
  // Pickups.
  const kept: Pickup[] = [];
  for (const p of pickups) {
    if (Math.abs(p.x - s.x) < 12 && Math.abs(p.y - s.y) < 12) {
      if (p.kind === 'power') s.power = Math.min(5, s.power + 1);
      else s.bombs = Math.min(6, s.bombs + 1);
      s.score += 500;
      s.events.push('pickup');
    } else kept.push(p);
  }
  const out: Strike = { ...s, rng, shots, enemies, bullets, pickups: kept };
  // A boss down ends the stage.
  if (s.events.includes('boss-down')) {
    out.stage++;
    out.clock = 0;
    out.bossOut = false;
    out.waveIn = 120;
    out.bullets = [];
    out.events.push('stage');
  }
  // Getting hit: an enemy bullet or body on the core.
  if (out.safe === 0) {
    const hit =
      out.bullets.some((b) => Math.hypot(b.x - out.x, b.y - out.y) < CORE + 2) ||
      out.enemies.some(
        (e) =>
          e.t >= 0 && Math.abs(e.x - out.x) < SIZE[e.kind] && Math.abs(e.y - out.y) < SIZE[e.kind],
      );
    if (hit) return { ...out, dying: 90, events: [...out.events, 'hit'] };
  }
  if (out.score >= out.nextLife) {
    out.lives++;
    out.nextLife += 50000;
    out.events.push('extra');
  }
  return out;
}

// ---- Players ----

const MOVES: StrikeAction[] = ['idle', ...DIRS];

/**
 * An ace: always firing, it tries each of the nine moves for the next 20 steps against the enemy
 * bullets and bodies in flight (moving straight on), and takes the move that keeps furthest from
 * them, breaking near-ties by lining up under the nearest enemy and staying low; it drops a bomb when
 * no move keeps it clear.
 */
export function acePolicy(s: Strike): StrikeAction {
  if (s.over || s.dying) return 'idle';
  const target = [...s.enemies]
    .filter((e) => e.t >= 0)
    .sort((a, b) => (b.kind === 'boss' ? 1 : 0) - (a.kind === 'boss' ? 1 : 0) || b.y - a.y)[0];
  let best: StrikeAction = 'idle';
  let bv = -Infinity;
  for (const m of MOVES) {
    const dx = m.includes('left') ? -1 : m.includes('right') ? 1 : 0;
    const dy = m.startsWith('up') ? -1 : m.startsWith('down') ? 1 : 0;
    const norm = dx && dy ? Math.SQRT1_2 : 1;
    let x = s.x;
    let y = s.y;
    let margin = 99;
    for (let k = 1; k <= 20; k++) {
      x = Math.max(8, Math.min(W - 8, x + dx * SPEED * norm));
      y = Math.max(H * 0.35, Math.min(H - 10, y + dy * SPEED * norm));
      for (const b of s.bullets)
        margin = Math.min(
          margin,
          Math.hypot(b.x + b.vx * k - x, b.y + b.vy * k - y) - CORE - 2 + k * 0.15,
        );
      for (const e of s.enemies)
        if (e.t >= 0)
          margin = Math.min(margin, Math.hypot(e.x - x, e.y - y) - SIZE[e.kind] - 4 + k * 0.3);
    }
    const line = target ? -Math.abs(target.x - x) * 0.15 : -Math.abs(W / 2 - x) * 0.05;
    const v = Math.min(margin, 14) * 4 + line - Math.abs(y - (H - 50)) * 0.03;
    if (v > bv) {
      bv = v;
      best = m;
    }
  }
  if (bv < -10 && s.bombs > 0 && !s.prevBomb && s.safe === 0) return 'bomb';
  return best;
}

/** A simple pilot: keeps low, slides under the nearest enemy and never dodges. */
export function sweeperPolicy(s: Strike): StrikeAction {
  if (s.over || s.dying) return 'idle';
  const e = [...s.enemies].filter((k) => k.t >= 0).sort((a, b) => b.y - a.y)[0];
  if (!e || Math.abs(e.x - s.x) < 3) return 'idle';
  return e.x > s.x ? 'right' : 'left';
}

export function isStrike(d: unknown): d is Strike {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Strike;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.enemies) &&
    Array.isArray(s.bullets) &&
    Number.isFinite(s.x) &&
    Number.isFinite(s.score)
  );
}
