/**
 * Star Duel: a two-ship duel around a star, in the spirit of the earliest computer games, with an
 * original name and look; at 60 steps a second. Both ships feel the star's pull (stronger close
 * in) and keep their momentum; the screen wraps round. A ship turns, fires its engine, and launches
 * torpedoes (up to four in flight, which fly straight for two seconds); it can also jump through
 * hyperspace to a random spot — but one jump in four ends in disaster. Falling into the star, being
 * hit by a torpedo or ramming the other ship destroys a ship; the duel restarts with both ships at
 * their places, and the first to five kills wins the match. The player flies the cyan ship against
 * the computer's amber one.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 320;
export const H = 240;
export const CX = W / 2;
export const CY = H / 2;
const GRAV = 120;
export const STAR_R = 10;
const TURN = 0.07;
const THRUST = 0.045;
const MAX_V = 3;
const TORPEDO_V = 3.2;
const TORPEDO_LIFE = 120;
const RELOAD = 18;
const SHIP_R = 6;
export const KILLS_TO_WIN = 5;

export type DuelAction =
  'idle' | 'left' | 'right' | 'thrust' | 'thrust-left' | 'thrust-right' | 'fire' | 'hyper';
export const ACTIONS: readonly DuelAction[] = [
  'idle',
  'left',
  'right',
  'thrust',
  'thrust-left',
  'thrust-right',
  'fire',
  'hyper',
];

export interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  alive: boolean;
  reload: number;
  /** Steps out of sight in hyperspace. */
  hyper: number;
  jumps: number;
  thrusting: boolean;
  kills: number;
}

export interface Torpedo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  owner: number;
}

export interface Duel {
  rng: RngState;
  ships: Ship[];
  torpedoes: Torpedo[];
  prevFire: boolean[];
  pause: number;
  /** Who scored the last kill (-1: both lost). */
  lastKill: number | null;
  score: number;
  round: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const wrap = (v: number, m: number) => ((v % m) + m) % m;
/** Shortest offset from a to b on the wrapping screen. */
export const off = (a: number, b: number, m: number) => wrap(b - a + m / 2, m) - m / 2;

/** Ships start in opposite corners, each nudged at random (so no duel is a mirror image). */
function startShips(kills: number[], rng0: RngState): [Ship[], RngState] {
  let rng = rng0;
  const r = () => {
    const [x, n] = rand(rng);
    rng = n;
    return x - 0.5;
  };
  const ships: Ship[] = [
    {
      x: 60 + r() * 30,
      y: 60 + r() * 30,
      vx: 0.9 + r() * 0.4,
      vy: -0.6 + r() * 0.4,
      a: r(),
      alive: true,
      reload: 0,
      hyper: 0,
      jumps: 0,
      thrusting: false,
      kills: kills[0] ?? 0,
    },
    {
      x: W - 60 + r() * 30,
      y: H - 60 + r() * 30,
      vx: -0.9 + r() * 0.4,
      vy: 0.6 + r() * 0.4,
      a: Math.PI + r(),
      alive: true,
      reload: 0,
      hyper: 0,
      jumps: 0,
      thrusting: false,
      kills: kills[1] ?? 0,
    },
  ];
  return [ships, rng];
}

export function newDuel(seed: number): Duel {
  const [ships, rng] = startShips([0, 0], seedRng(seed >>> 0));
  return {
    rng,
    ships,
    torpedoes: [],
    prevFire: [false, false],
    pause: 0,
    lastKill: null,
    score: 0,
    round: 1,
    over: false,
    events: [],
    steps: 0,
  };
}

/** The star's pull on a point. */
export function pull(x: number, y: number): [number, number] {
  const dx = CX - x;
  const dy = CY - y;
  const d2 = Math.max(dx * dx + dy * dy, 400);
  const d = Math.sqrt(d2);
  return [(GRAV / d2) * (dx / d), (GRAV / d2) * (dy / d)];
}

export function stepDuel(s0: Duel, actions: DuelAction[]): Duel {
  if (s0.over) return s0;
  const s: Duel = { ...s0, events: [], steps: s0.steps + 1 };
  let rng = s.rng;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  if (s.pause > 0) {
    s.pause--;
    if (s.pause > 0) return s;
    if (s.ships.some((sh) => sh.kills >= KILLS_TO_WIN))
      return { ...s, over: true, events: ['over'] };
    const [ships, rng] = startShips(
      s.ships.map((sh) => sh.kills),
      s.rng,
    );
    return {
      ...s,
      rng,
      ships,
      torpedoes: [],
      prevFire: [false, false],
      round: s.round + 1,
      events: ['round'],
    };
  }
  const ships = s.ships.map((sh) => ({ ...sh }));
  const prevFire = s.prevFire.slice();
  let torpedoes = s.torpedoes
    .map((t) => ({ ...t, x: wrap(t.x + t.vx, W), y: wrap(t.y + t.vy, H), life: t.life - 1 }))
    .filter((t) => t.life > 0);
  ships.forEach((sh, i) => {
    if (!sh.alive) return;
    const a = actions[i] ?? 'idle';
    if (sh.hyper > 0) {
      sh.hyper--;
      if (sh.hyper === 0) {
        // Back out of hyperspace somewhere at random — or not at all.
        if (roll() < 0.25) {
          sh.alive = false;
          s.events.push(i === 0 ? 'lost-in-hyper' : 'rival-lost-in-hyper');
          return;
        }
        let x: number;
        let y: number;
        do {
          x = roll() * W;
          y = roll() * H;
        } while (Math.hypot(x - CX, y - CY) < 50);
        Object.assign(sh, { x, y });
        s.events.push('emerge');
      }
      return;
    }
    if (a === 'left' || a === 'thrust-left') sh.a -= TURN;
    if (a === 'right' || a === 'thrust-right') sh.a += TURN;
    sh.thrusting = a.startsWith('thrust');
    if (sh.thrusting) {
      sh.vx += Math.cos(sh.a) * THRUST;
      sh.vy += Math.sin(sh.a) * THRUST;
    }
    const [gx, gy] = pull(sh.x, sh.y);
    sh.vx += gx;
    sh.vy += gy;
    const v = Math.hypot(sh.vx, sh.vy);
    if (v > MAX_V) {
      sh.vx *= MAX_V / v;
      sh.vy *= MAX_V / v;
    }
    sh.x = wrap(sh.x + sh.vx, W);
    sh.y = wrap(sh.y + sh.vy, H);
    if (sh.reload > 0) sh.reload--;
    const fire = a === 'fire';
    if (
      fire &&
      !prevFire[i] &&
      sh.reload === 0 &&
      torpedoes.filter((t) => t.owner === i).length < 4
    ) {
      torpedoes.push({
        x: sh.x + Math.cos(sh.a) * 8,
        y: sh.y + Math.sin(sh.a) * 8,
        vx: sh.vx + Math.cos(sh.a) * TORPEDO_V,
        vy: sh.vy + Math.sin(sh.a) * TORPEDO_V,
        life: TORPEDO_LIFE,
        owner: i,
      });
      sh.reload = RELOAD;
      s.events.push(i === 0 ? 'fire' : 'rival-fire');
    }
    prevFire[i] = fire;
    if (a === 'hyper' && sh.jumps < 3) {
      sh.hyper = 45;
      sh.jumps++;
      s.events.push('hyper');
    }
    // Into the star.
    if (Math.hypot(sh.x - CX, sh.y - CY) < STAR_R + SHIP_R - 2) {
      sh.alive = false;
      s.events.push(i === 0 ? 'burnt' : 'rival-burnt');
    }
  });
  // Torpedoes and collisions (ships in hyperspace are out of reach).
  const visible = (sh: Ship) => sh.alive && sh.hyper === 0;
  torpedoes = torpedoes.filter((t) => {
    if (Math.hypot(t.x - CX, t.y - CY) < STAR_R) return false;
    for (let i = 0; i < ships.length; i++) {
      const sh = ships[i]!;
      if (!visible(sh) || Math.hypot(off(sh.x, t.x, W), off(sh.y, t.y, H)) > SHIP_R + 1) continue;
      if (t.owner === i && t.life > TORPEDO_LIFE - 8) continue;
      sh.alive = false;
      s.events.push(i === 0 ? 'hit' : 'rival-hit');
      return false;
    }
    return true;
  });
  if (
    visible(ships[0]!) &&
    visible(ships[1]!) &&
    Math.hypot(off(ships[0]!.x, ships[1]!.x, W), off(ships[0]!.y, ships[1]!.y, H)) < SHIP_R * 2
  ) {
    ships[0]!.alive = false;
    ships[1]!.alive = false;
    s.events.push('ram');
  }
  const out = { ...s, rng, ships, torpedoes, prevFire };
  if (!ships[0]!.alive || !ships[1]!.alive) {
    let lastKill = -1;
    if (ships[0]!.alive) lastKill = 0;
    else if (ships[1]!.alive) lastKill = 1;
    if (lastKill >= 0) ships[lastKill]!.kills++;
    return {
      ...out,
      ships,
      lastKill,
      pause: 120,
      score: out.score + (lastKill === 0 ? 500 : 0),
      events: [...out.events, lastKill === 0 ? 'kill' : lastKill === 1 ? 'killed' : 'both'],
    };
  }
  // Staying alive scores a little.
  if (s.steps % 60 === 0) out.score += 1;
  return out;
}

// ---- Players ----

/** Where to aim to hit a target moving steadily, from a shooter's torpedo speed. */
function lead(me: Ship, them: Ship): [number, number] {
  let tx = them.x;
  let ty = them.y;
  for (let k = 0; k < 3; k++) {
    const d = Math.hypot(off(me.x, tx, W), off(me.y, ty, H));
    const t = d / TORPEDO_V;
    tx = them.x + (them.vx - me.vx) * t;
    ty = them.y + (them.vy - me.vy) * t;
  }
  return [tx, ty];
}

const angleTo = (me: Ship, x: number, y: number) => Math.atan2(off(me.y, y, H), off(me.x, x, W));
const turnToward = (a: number, want: number) => {
  const d = Math.atan2(Math.sin(want - a), Math.cos(want - a));
  return Math.abs(d) < TURN ? '' : d > 0 ? 'right' : 'left';
};

/**
 * A duellist: keeps out of the star's grip first (if close in, or falling inwards, it turns to burn
 * outwards and sideways), dodges a torpedo about to hit it by thrusting across its path, and
 * otherwise turns to the point where the rival will be when a torpedo gets there and fires when
 * lined up.
 */
export function duellistFor(s: Duel, i: number): DuelAction {
  const me = s.ships[i]!;
  const them = s.ships[1 - i]!;
  if (!me.alive || me.hyper || s.pause || s.over) return 'idle';
  const dStar = Math.hypot(me.x - CX, me.y - CY);
  const inward = ((CX - me.x) * me.vx + (CY - me.y) * me.vy) / Math.max(1, dStar);
  if (dStar < 55 || (dStar < 95 && inward > 0.8)) {
    // Burn outwards and a little sideways (to orbit rather than climb straight out).
    const out = Math.atan2(me.y - CY, me.x - CX) + 0.6;
    const t = turnToward(me.a, out);
    return (t ? `thrust-${t}` : 'thrust') as DuelAction;
  }
  const threat = s.torpedoes.find((t) => {
    if (t.owner === i) return false;
    const rx = off(t.x, me.x, W);
    const ry = off(t.y, me.y, H);
    const rvx = t.vx - me.vx;
    const rvy = t.vy - me.vy;
    const tt = (rx * rvx + ry * rvy) / Math.max(0.01, rvx * rvx + rvy * rvy);
    if (tt < 0 || tt > 30) return false;
    return Math.hypot(rx - rvx * tt, ry - rvy * tt) < SHIP_R + 4;
  });
  if (threat) {
    const across = Math.atan2(threat.vy, threat.vx) + Math.PI / 2;
    const t = turnToward(me.a, across);
    return (t ? `thrust-${t}` : 'thrust') as DuelAction;
  }
  if (!them.alive || them.hyper) return 'idle';
  const [tx, ty] = lead(me, them);
  const want = angleTo(me, tx, ty);
  const t = turnToward(me.a, want);
  const err = Math.abs(Math.atan2(Math.sin(want - me.a), Math.cos(want - me.a)));
  if (err < 0.12 && me.reload === 0 && !s.prevFire[i]) return 'fire';
  // Keep some speed so as not to sit still near the star.
  if (Math.hypot(me.vx, me.vy) < 0.5 && err < 0.5)
    return (t ? `thrust-${t}` : 'thrust') as DuelAction;
  return (t || 'idle') as DuelAction;
}

/** A simple pilot: turns towards the rival's current position and fires; it only burns when the star is very close. */
export function gunnerFor(s: Duel, i: number): DuelAction {
  const me = s.ships[i]!;
  const them = s.ships[1 - i]!;
  if (!me.alive || me.hyper || s.pause || s.over) return 'idle';
  if (Math.hypot(me.x - CX, me.y - CY) < 40) {
    const t = turnToward(me.a, Math.atan2(me.y - CY, me.x - CX));
    return (t ? `thrust-${t}` : 'thrust') as DuelAction;
  }
  const want = angleTo(me, them.x, them.y);
  const t = turnToward(me.a, want);
  if (!t && me.reload === 0 && !s.prevFire[i]) return 'fire';
  return (t || 'idle') as DuelAction;
}

/** The player's duel: seat 0 acts, the computer flies seat 1 as a duellist. */
export function stepWithRival(s: Duel, action: DuelAction): Duel {
  return stepDuel(s, [action, duellistFor(s, 1)]);
}

export function isDuel(d: unknown): d is Duel {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Duel;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.ships) &&
    s.ships.length === 2 &&
    Array.isArray(s.torpedoes) &&
    Number.isFinite(s.score)
  );
}
