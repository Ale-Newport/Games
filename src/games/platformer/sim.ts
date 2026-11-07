/**
 * Sunny Trail: a side-scrolling platformer with an original hero and three levels, at 60 steps a
 * second. The hero runs (accelerating, with less control in the air) and jumps — higher while the
 * button is held, with a little grace after leaving a ledge and a press remembered just before
 * landing. Beetles walk until they meet a wall and turn; landing on one squashes it (100 points and
 * a bounce), but touching one from the side, or any spiky beetle, hurts. A berry from a prize box
 * gives a shield that takes one hit. Prize boxes are opened from below (a coin, or the berry); coins
 * are worth 10 and every 100 is a life. Falling into a pit, getting hurt without a shield, or the
 * level timer running out costs a life (three); the checkpoint flag halfway is where the next life
 * starts. Touching the flag pole ends the level: 1000 points plus 10 for each second left. Clearing
 * the third level wins.
 */
import { LEVELS, ROWS } from './levels';
import { TILE, move, touching, type Body, type TileMap } from '../shared/platform/physics';

export type PlatAction = 'idle' | 'left' | 'right' | 'jump' | 'left-jump' | 'right-jump';
export const ACTIONS: readonly PlatAction[] = [
  'idle',
  'left',
  'right',
  'jump',
  'left-jump',
  'right-jump',
];

export const VIEW_W = 320;
export const VIEW_H = ROWS * TILE;
const SOLID = '#B?!U';
const HERO_W = 11;
const HERO_H = 14;
const ACCEL = 0.12;
const AIR_ACCEL = 0.08;
const MAX_RUN = 1.8;
const FRICTION = 0.18;
const JUMP_V = -5;
const RISE_GRAVITY = 0.18;
const FALL_GRAVITY = 0.4;
const MAX_FALL = 6;
const COYOTE = 6;
const BUFFER = 6;
const LEVEL_TIME = 200 * 60;

export interface Hero extends Body {
  facing: 1 | -1;
  ground: boolean;
  /** Steps since last on the ground, and since the jump button was pressed. */
  air: number;
  buffer: number;
  shield: boolean;
  invuln: number;
}

export interface Beetle extends Body {
  dir: 1 | -1;
  spiky: boolean;
  alive: boolean;
  /** Squash animation steps left. */
  squash: number;
  awake: boolean;
}

export interface Trail {
  level: number;
  /** Tiles changed by play (opened boxes), as `${tx},${ty}` → new tile. */
  changed: Record<string, string>;
  taken: string[];
  berries: { x: number; y: number }[];
  hero: Hero;
  beetles: Beetle[];
  checkpoint: boolean;
  prevJump: boolean;
  time: number;
  score: number;
  coins: number;
  lives: number;
  dying: number;
  cause: string | null;
  cleared: number;
  won: boolean;
  over: boolean;
  events: string[];
  steps: number;
  stomps: number;
}

const rowsOf = (s: Pick<Trail, 'level' | 'changed'>): string[] => {
  const rows = [...LEVELS[s.level]!];
  for (const [k, c] of Object.entries(s.changed)) {
    const [tx, ty] = k.split(',').map(Number) as [number, number];
    rows[ty] = rows[ty]!.slice(0, tx) + c + rows[ty]!.slice(tx + 1);
  }
  return rows;
};
export const mapOf = (s: Pick<Trail, 'level' | 'changed'>): TileMap => ({
  rows: rowsOf(s),
  solid: SOLID,
});
const checkpointX = (level: number) => LEVELS[level]![ROWS - 3]!.indexOf('C') * TILE;

function heroAt(x: number): Hero {
  return {
    x,
    y: (ROWS - 2) * TILE - HERO_H,
    w: HERO_W,
    h: HERO_H,
    vx: 0,
    vy: 0,
    facing: 1,
    ground: true,
    air: 0,
    buffer: 0,
    shield: false,
    invuln: 0,
  };
}

function beetlesOf(level: number): Beetle[] {
  const out: Beetle[] = [];
  LEVELS[level]!.forEach((row, ty) =>
    [...row].forEach((c, tx) => {
      if (c === 'e' || c === 's')
        out.push({
          x: tx * TILE + 1,
          y: ty * TILE + 4,
          w: 14,
          h: 12,
          vx: 0,
          vy: 0,
          dir: -1,
          spiky: c === 's',
          alive: true,
          squash: 0,
          awake: false,
        });
    }),
  );
  return out;
}

function startLevel(
  level: number,
  carry: Pick<Trail, 'score' | 'coins' | 'lives'>,
  fromCheckpoint = false,
  keep?: Pick<Trail, 'changed' | 'taken'>,
): Omit<Trail, 'won' | 'over' | 'events' | 'steps' | 'stomps'> {
  return {
    ...carry,
    level,
    changed: keep?.changed ?? {},
    taken: keep?.taken ?? [],
    berries: [],
    hero: heroAt(fromCheckpoint ? checkpointX(level) : 2 * TILE),
    beetles: beetlesOf(level),
    checkpoint: fromCheckpoint,
    prevJump: false,
    time: LEVEL_TIME,
    dying: 0,
    cause: null,
    cleared: 0,
  };
}

export function newTrail(): Trail {
  return {
    ...startLevel(0, { score: 0, coins: 0, lives: 3 }),
    won: false,
    over: false,
    events: [],
    steps: 0,
    stomps: 0,
  };
}

const overlap = (a: Body, b: Body) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function hurt(s: Trail, cause: string): Trail {
  if (s.hero.shield && cause !== 'pit' && cause !== 'time') {
    return {
      ...s,
      hero: { ...s.hero, shield: false, invuln: 90 },
      events: [...s.events, 'shield-lost'],
    };
  }
  return { ...s, dying: 90, cause, events: [...s.events, 'die', cause] };
}

export function stepTrail(s0: Trail, action: PlatAction): Trail {
  if (s0.over) return s0;
  let s: Trail = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.cleared > 0) {
    s.cleared--;
    if (s.cleared > 0) return s;
    if (s.level + 1 >= LEVELS.length) return { ...s, won: true, over: true, events: ['won'] };
    return { ...s, ...startLevel(s.level + 1, s), events: ['level'] };
  }
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    return { ...s, ...startLevel(s.level, { ...s, lives }, s.checkpoint, s) };
  }
  const map = mapOf(s);
  const h = { ...s.hero };
  const horiz =
    action === 'left' || action === 'left-jump'
      ? -1
      : action === 'right' || action === 'right-jump'
        ? 1
        : 0;
  const jumpHeld = action === 'jump' || action === 'left-jump' || action === 'right-jump';
  const pressed = jumpHeld && !s.prevJump;
  s.prevJump = jumpHeld;

  // Running.
  if (horiz) {
    h.vx += horiz * (h.ground ? ACCEL : AIR_ACCEL);
    h.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, h.vx));
    h.facing = horiz as 1 | -1;
  } else if (h.ground) h.vx = Math.abs(h.vx) <= FRICTION ? 0 : h.vx - Math.sign(h.vx) * FRICTION;
  // Jumping: a fresh press (or one made just before landing) within a moment of the ground.
  h.buffer = pressed ? BUFFER : Math.max(0, h.buffer - 1);
  if (h.buffer > 0 && h.air <= COYOTE) {
    h.vy = JUMP_V;
    h.buffer = 0;
    h.air = COYOTE + 1;
    s.events.push('jump');
  }
  h.vy = Math.min(MAX_FALL, h.vy + (h.vy < 0 && jumpHeld ? RISE_GRAVITY : FALL_GRAVITY));
  const [b, c] = move(map, h);
  Object.assign(h, b);
  h.ground = c.ground;
  h.air = c.ground ? 0 : h.air + 1;
  if (h.invuln > 0) h.invuln--;

  // A head-butt opens the prize box above.
  let changed = s.changed;
  let berries = s.berries;
  if (c.ceiling) {
    const tx = Math.floor((h.x + h.w / 2) / TILE);
    const ty = Math.floor((h.y - 1) / TILE);
    const tile = map.rows[ty]?.[tx];
    if (tile === '?' || tile === '!') {
      changed = { ...changed, [`${tx},${ty}`]: 'U' };
      if (tile === '?') {
        s.coins++;
        s.score += 10;
        s.events.push('coin');
      } else {
        berries = [...berries, { x: tx * TILE + 3, y: ty * TILE - 10 }];
        s.events.push('berry-out');
      }
    } else s.events.push('bump');
  }

  // Coins, berries, the checkpoint and the flag.
  let taken = s.taken;
  for (const t of touching(map, h.x, h.y, h.w, h.h, 'oCF')) {
    const key = `${t.tx},${t.ty}`;
    if (t.c === 'o' && !taken.includes(key)) {
      taken = [...taken, key];
      s.coins++;
      s.score += 10;
      s.events.push('coin');
    } else if (t.c === 'C' && !s.checkpoint) {
      s.checkpoint = true;
      s.events.push('checkpoint');
    } else if (t.c === 'F') {
      s.score += 1000 + 10 * Math.floor(s.time / 60);
      s.events.push('flag');
      return { ...s, hero: h, changed, berries, taken, cleared: 150 };
    }
  }
  if (s.coins >= 100) {
    s.coins -= 100;
    s.lives++;
    s.events.push('extra');
  }
  berries = berries.filter((be) => {
    if (overlap(h, { x: be.x, y: be.y, w: 10, h: 10, vx: 0, vy: 0 })) {
      h.shield = true;
      s.score += 200;
      s.events.push('berry');
      return false;
    }
    return true;
  });
  s = { ...s, hero: h, changed, berries, taken };

  // Beetles: wake when near, walk, turn at walls, fall into pits.
  const beetles: Beetle[] = [];
  for (const e0 of s.beetles) {
    const e = { ...e0 };
    if (!e.alive) {
      if (e.squash > 0) {
        e.squash--;
        beetles.push(e);
      }
      continue;
    }
    if (!e.awake && Math.abs(e.x - h.x) < VIEW_W * 0.75) e.awake = true;
    if (e.awake) {
      e.vx = e.dir * 0.5;
      e.vy = Math.min(MAX_FALL, e.vy + FALL_GRAVITY);
      const [eb, ec] = move(map, e);
      Object.assign(e, eb);
      if (ec.wall) e.dir = -ec.wall as 1 | -1;
      if (e.y > VIEW_H) continue;
    }
    beetles.push(e);
  }
  s.beetles = beetles;
  // Meeting beetles.
  for (const e of s.beetles) {
    if (!e.alive || !overlap(h, e)) continue;
    const falling = h.vy > 0 && h.y + h.h - h.vy <= e.y + 4;
    if (falling && !e.spiky) {
      e.alive = false;
      e.squash = 30;
      h.vy = s.prevJump ? -5 : -3.5;
      s.score += 100;
      s.stomps++;
      s.events.push('stomp');
    } else if (h.invuln === 0) {
      s = hurt(s, 'beetle');
      // Either the end of this life, or the shield took the hit (and a moment of safety).
      return s;
    }
  }

  if (h.y > VIEW_H) return hurt(s, 'pit');
  s.time--;
  if (s.time <= 0) return hurt(s, 'time');
  return s;
}

export const camera = (s: Trail) =>
  Math.max(0, Math.min(LEVELS[s.level]![0]!.length * TILE - VIEW_W, s.hero.x - VIEW_W * 0.4));

/** A naive runner: holds right, jumps at walls, gaps and beetles just ahead. */
export function runnerPolicy(s: Trail): PlatAction {
  if (s.dying || s.cleared || s.over) return 'idle';
  const h = s.hero;
  const map = mapOf(s);
  const ahead = h.x + h.w + 10;
  const tx = Math.floor(ahead / TILE);
  const feet = Math.floor((h.y + h.h + 2) / TILE);
  const wall = map.solid.includes(map.rows[Math.floor((h.y + h.h - 2) / TILE)]?.[tx] ?? '.');
  const gap =
    !map.solid.includes(map.rows[feet]?.[tx] ?? '.') &&
    !map.solid.includes(map.rows[feet + 1]?.[tx] ?? '.');
  const beetle = s.beetles.some(
    (e) => e.alive && e.x > h.x && e.x - h.x < 36 && Math.abs(e.y - h.y) < 20,
  );
  if ((wall || gap || beetle) && h.ground) return 'right-jump';
  if (!h.ground && h.vy < 0) return 'right-jump';
  return 'right';
}

const MACROS: PlatAction[] = ['right', 'right-jump', 'idle', 'left', 'left-jump', 'jump'];
const HOLD = 8;
const DEPTH = 6;
const BEAM = 24;
const plans = new Map<string, PlatAction>();
const keyOf = (s: Trail) =>
  `${s.level}:${s.steps}:${s.hero.x.toFixed(2)}:${s.hero.y.toFixed(2)}:${s.hero.vx.toFixed(3)}:${s.hero.vy.toFixed(3)}:${s.lives}:${s.score}`;

/**
 * A planner: the levels hold no chance, so it searches them — a beam search over the next six
 * moves of eight steps each (run, jump, wait or back off), keeping the 24 most promising, scored on
 * distance along the level, coins and berries, and staying alive.
 */
export function plannerPolicy(s: Trail): PlatAction {
  if (s.dying || s.cleared || s.over) return 'idle';
  const known = plans.get(keyOf(s));
  if (known) return known;
  type Node = { t: Trail; first: PlatAction; v: number; trail: Trail[] };
  const value = (t: Trail) =>
    t.dying || (t.over && !t.won)
      ? -1e9
      : t.cleared || t.won
        ? 1e7 + t.score
        : t.hero.x * 10 +
          t.score * 0.5 +
          (t.hero.shield ? 300 : 0) -
          (t.hero.y > VIEW_H - 3 * TILE ? 50 : 0);
  let layer: Node[] = [{ t: s, first: 'idle', v: 0, trail: [] }];
  let best: Node | null = null;
  for (let d = 0; d < DEPTH && layer.length; d++) {
    const next = new Map<string, Node>();
    for (const n of layer)
      for (const m of MACROS) {
        let t = n.t;
        const seen: Trail[] = [];
        for (let k = 0; k < HOLD && !t.dying && !t.over && !t.cleared; k++) {
          t = stepTrail(t, m);
          seen.push(t);
        }
        if (t.dying || (t.over && !t.won)) continue;
        const node: Node = {
          t,
          first: d === 0 ? m : n.first,
          v: value(t),
          trail: d === 0 ? seen : n.trail,
        };
        const key = `${Math.round(t.hero.x / 3)}:${Math.round(t.hero.y / 3)}:${Math.sign(Math.round(t.hero.vy))}`;
        const old = next.get(key);
        if (!old || node.v > old.v) next.set(key, node);
      }
    layer = [...next.values()].sort((a, b) => b.v - a.v).slice(0, BEAM);
    if (layer[0] && (!best || layer[0].v >= best.v || d === DEPTH - 1)) best = layer[0];
  }
  const move = best?.first ?? 'right';
  // The first move lasts eight steps: remember it for the states it passes through.
  if (plans.size > 4000) plans.clear();
  for (const t of best?.trail.slice(0, -1) ?? []) plans.set(keyOf(t), move);
  return move;
}

export function isTrail(d: unknown): d is Trail {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Trail;
  return (
    Number.isInteger(s.level) &&
    s.level >= 0 &&
    s.level < LEVELS.length &&
    typeof s.hero === 'object' &&
    Array.isArray(s.beetles) &&
    Number.isFinite(s.score)
  );
}
