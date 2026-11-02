/**
 * Spike Hop: a precision platformer of eight single-screen rooms, at 60 steps a second. The hero
 * runs, jumps (higher while held), slides down walls it presses against, kicks off them with a
 * wall jump, and dashes once in the air in any of eight directions (the dash comes back on landing).
 * Springs throw it high. Spikes — on floors and ceilings — are instant death, but a death costs only
 * a moment: the hero reappears at the room's start. Reaching the door clears the room. A room is
 * worth 1000, each death −25, and finishing all eight within ten minutes adds 10 a second left.
 */
import { TILE, flowField, move, touching, type TileMap } from '../shared/platform/physics';

export const COLS = 20;
export const ROWS = 14;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;

/** `#` wall, `^` floor spikes, `v` ceiling spikes, `S` spring, `D` door, `P` start. */
export const ROOMS: readonly { name: string; rows: readonly string[] }[] = [
  {
    name: 'first-steps',
    rows: [
      '####################',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#P...............D.#',
      '####^^#####^^^######',
      '####################',
    ],
  },
  {
    name: 'stairway',
    rows: [
      '####################',
      '#..................#',
      '#..................#',
      '#...............D..#',
      '#.............######',
      '#..................#',
      '#..................#',
      '#.........####.....#',
      '#..................#',
      '#..................#',
      '#....####..........#',
      '#P.................#',
      '##^^^^^^^^^^^^^^^^^#',
      '####################',
    ],
  },
  {
    name: 'chimney',
    rows: [
      '####################',
      '#..................#',
      '#.D................#',
      '#####.....##########',
      '#####.....##########',
      '#####.....##########',
      '#####.....##########',
      '#####.....##########',
      '#####.....##########',
      '#####.....##########',
      '#####.....##########',
      '#####..P..##########',
      '####################',
      '####################',
    ],
  },
  {
    name: 'dash-gap',
    rows: [
      '####################',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#P...............D.#',
      '######^^^^^^^#######',
      '####################',
    ],
  },
  {
    name: 'spring',
    rows: [
      '####################',
      '#..................#',
      '#.D................#',
      '######.............#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#P.......S.........#',
      '####################',
      '####################',
    ],
  },
  {
    name: 'low-ceiling',
    rows: [
      '####################',
      '####################',
      '####################',
      '####################',
      '####################',
      '####################',
      '####################',
      '#vvvvvvvvvvvvvvvvvv#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#P...............D.#',
      '###^^##^^###^^##^###',
      '####################',
    ],
  },
  {
    name: 'updraft',
    rows: [
      '####################',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#............D.....#',
      '#...........########',
      '#...........########',
      '#...........########',
      '#...........########',
      '#P..........########',
      '####################',
      '####################',
    ],
  },
  {
    name: 'gauntlet',
    rows: [
      '####################',
      '#..................#',
      '#.................D#',
      '#...............####',
      '#..................#',
      '#..................#',
      '#.........###......#',
      '#..................#',
      '#..................#',
      '#....###...........#',
      '#..................#',
      '#P.................#',
      '##^^^^^^^^^^^^^^^^^#',
      '####################',
    ],
  },
];

export type HopAction =
  | 'idle'
  | 'left'
  | 'right'
  | 'jump'
  | 'left-jump'
  | 'right-jump'
  | 'dash'
  | 'left-dash'
  | 'right-dash'
  | 'up-dash'
  | 'up-left-dash'
  | 'up-right-dash';
export const ACTIONS: readonly HopAction[] = [
  'idle',
  'left',
  'right',
  'jump',
  'left-jump',
  'right-jump',
  'dash',
  'left-dash',
  'right-dash',
  'up-dash',
  'up-left-dash',
  'up-right-dash',
];

const W_HERO = 10;
const H_HERO = 14;
const ACCEL = 0.2;
const AIR_ACCEL = 0.12;
const MAX_RUN = 2;
const FRICTION = 0.25;
const JUMP_V = -5;
const RISE_GRAVITY = 0.2;
const FALL_GRAVITY = 0.42;
const MAX_FALL = 6;
const SLIDE = 1.2;
const WALL_KICK = 2.4;
const WALL_JUMP_V = -4.6;
const LOCK = 8;
const DASH_STEPS = 10;
const DASH_SPEED = 4.2;
const SPRING_V = -8;
const COYOTE = 5;
const TIME_LIMIT = 10 * 60 * 60;

export interface Hero {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  ground: boolean;
  air: number;
  wall: -1 | 0 | 1;
  lock: number;
  dash: number;
  dashDir: [number, number];
  canDash: boolean;
  /** Rising from a spring (light gravity whether or not jump is held). */
  sprung: boolean;
}

export interface Hop {
  room: number;
  hero: Hero;
  prevJump: boolean;
  prevDash: boolean;
  deaths: number;
  roomDeaths: number;
  dying: number;
  /** The pause after reaching a door. */
  cleared: number;
  time: number;
  score: number;
  won: boolean;
  over: boolean;
  events: string[];
  steps: number;
  dashes: number;
  wallJumps: number;
}

export const mapOf = (room: number): TileMap => ({ rows: ROOMS[room]!.rows, solid: '#' });

function start(room: number): Hero {
  const rows = ROOMS[room]!.rows;
  const ty = rows.findIndex((r) => r.includes('P'));
  const tx = rows[ty]!.indexOf('P');
  return {
    x: tx * TILE + 3,
    y: (ty + 1) * TILE - H_HERO,
    vx: 0,
    vy: 0,
    facing: 1,
    ground: true,
    air: 0,
    wall: 0,
    lock: 0,
    dash: 0,
    dashDir: [1, 0],
    canDash: true,
    sprung: false,
  };
}

export function newHop(): Hop {
  return {
    room: 0,
    hero: start(0),
    prevJump: false,
    prevDash: false,
    deaths: 0,
    roomDeaths: 0,
    dying: 0,
    cleared: 0,
    time: TIME_LIMIT,
    score: 0,
    won: false,
    over: false,
    events: [],
    steps: 0,
    dashes: 0,
    wallJumps: 0,
  };
}

function parse(a: HopAction): { h: -1 | 0 | 1; up: boolean; jump: boolean; dash: boolean } {
  return {
    h: a.includes('left') ? -1 : a.includes('right') ? 1 : 0,
    up: a.startsWith('up'),
    jump: a.endsWith('jump'),
    dash: a.endsWith('dash'),
  };
}

export function stepHop(s0: Hop, action: HopAction): Hop {
  if (s0.over) return s0;
  const s: Hop = { ...s0, events: [], steps: s0.steps + 1, time: s0.time - 1 };
  if (s.time <= 0) return { ...s, over: true, events: ['timeout'] };
  if (s.cleared > 0) {
    s.cleared--;
    if (s.cleared > 0) return s;
    if (s.room + 1 >= ROOMS.length) {
      const bonus = 10 * Math.floor(s.time / 60);
      return { ...s, score: s.score + bonus, won: true, over: true, events: ['won'] };
    }
    return {
      ...s,
      room: s.room + 1,
      hero: start(s.room + 1),
      roomDeaths: 0,
      prevJump: false,
      prevDash: false,
      events: ['room'],
    };
  }
  if (s.dying > 0) {
    s.dying--;
    if (s.dying === 0)
      return { ...s, hero: start(s.room), prevJump: false, prevDash: false, events: ['respawn'] };
    return s;
  }
  const map = mapOf(s.room);
  const h: Hero = { ...s.hero };
  const a = parse(action);
  const jumpPressed = a.jump && !s.prevJump;
  const dashPressed = a.dash && !s.prevDash;
  s.prevJump = a.jump;
  s.prevDash = a.dash;

  if (dashPressed && h.canDash && h.dash === 0) {
    let dx = a.h;
    const dy = a.up ? -1 : 0;
    if (dx === 0 && dy === 0) dx = h.facing;
    const n = Math.hypot(dx, dy);
    h.dashDir = [dx / n, dy / n];
    h.dash = DASH_STEPS;
    h.canDash = false;
    s.dashes++;
    s.events.push('dash');
  }
  if (h.dash > 0) {
    h.vx = h.dashDir[0] * DASH_SPEED;
    h.vy = h.dashDir[1] * DASH_SPEED;
    h.dash--;
    if (h.dash === 0) {
      h.vx = h.dashDir[0] * MAX_RUN;
      h.vy = h.dashDir[1] * 2;
    }
  } else {
    // Running (briefly locked after a wall jump).
    if (h.lock > 0) h.lock--;
    else if (a.h) {
      h.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, h.vx + a.h * (h.ground ? ACCEL : AIR_ACCEL)));
      h.facing = a.h;
    } else if (h.ground) h.vx = Math.abs(h.vx) <= FRICTION ? 0 : h.vx - Math.sign(h.vx) * FRICTION;
    // Jumping from the ground, or kicking off a wall.
    if (jumpPressed && h.air <= COYOTE) {
      h.vy = JUMP_V;
      h.air = COYOTE + 1;
      s.events.push('jump');
    } else if (jumpPressed && h.wall !== 0) {
      h.vx = -h.wall * WALL_KICK;
      h.vy = WALL_JUMP_V;
      h.facing = -h.wall as 1 | -1;
      h.lock = LOCK;
      s.wallJumps++;
      s.events.push('wall-jump');
    }
    if (h.vy >= 0) h.sprung = false;
    h.vy = Math.min(
      MAX_FALL,
      h.vy + (h.vy < 0 && (a.jump || h.sprung) ? RISE_GRAVITY : FALL_GRAVITY),
    );
    // Sliding down a wall pressed against.
    if (!h.ground && h.wall !== 0 && a.h === h.wall && h.vy > SLIDE) h.vy = SLIDE;
  }
  const [b, c] = move(map, { x: h.x, y: h.y, w: W_HERO, h: H_HERO, vx: h.vx, vy: h.vy });
  h.x = b.x;
  h.y = b.y;
  h.vx = b.vx;
  h.vy = b.vy;
  if (c.ground && h.dash > 0 && h.dashDir[1] > 0) h.dash = 0;
  h.ground = c.ground;
  h.wall = c.wall;
  h.air = c.ground ? 0 : h.air + 1;
  if (c.ground && h.dash === 0) h.canDash = true;

  const hit = touching(map, h.x + 1, h.y + 1, W_HERO - 2, H_HERO - 2, '^vSD');
  if (hit.some((t) => t.c === '^' || t.c === 'v') || h.y > VIEW_H) {
    return {
      ...s,
      hero: h,
      dying: 30,
      deaths: s.deaths + 1,
      roomDeaths: s.roomDeaths + 1,
      score: s.score - 25,
      events: [...s.events, 'die'],
    };
  }
  if (hit.some((t) => t.c === 'D')) {
    return { ...s, hero: h, cleared: 60, score: s.score + 1000, events: [...s.events, 'door'] };
  }
  if (hit.some((t) => t.c === 'S') && h.vy >= 0) {
    h.vy = SPRING_V;
    h.sprung = true;
    h.canDash = true;
    s.events.push('spring');
  }
  return { ...s, hero: h };
}

// ---- Players ----

const fields = new Map<number, Int16Array>();
function field(room: number): Int16Array {
  let f = fields.get(room);
  if (!f) {
    const rows = ROOMS[room]!.rows;
    const door: [number, number][] = [];
    rows.forEach((r, ty) => [...r].forEach((ch, tx) => ch === 'D' && door.push([tx, ty])));
    // Spikes count as walls for the guide, so it never leads through them.
    f = flowField({ rows, solid: '#^v' }, door);
    fields.set(room, f);
  }
  return f;
}

const MACROS: HopAction[] = [
  'right',
  'left',
  'right-jump',
  'left-jump',
  'jump',
  'idle',
  'right-dash',
  'left-dash',
  'up-dash',
  'up-right-dash',
  'up-left-dash',
];
const HOLD = 6;
const DEPTH = 7;
const BEAM = 40;
const plans = new Map<string, HopAction>();
const keyOf = (s: Hop) =>
  `${s.room}:${s.steps}:${s.hero.x.toFixed(2)}:${s.hero.y.toFixed(2)}:${s.hero.vx.toFixed(3)}:${s.hero.vy.toFixed(3)}:${s.deaths}`;

function distance(s: Hop): number {
  const f = field(s.room);
  const cx = Math.floor((s.hero.x + W_HERO / 2) / TILE);
  const cy = Math.floor((s.hero.y + H_HERO / 2) / TILE);
  const d = f[cy * COLS + cx];
  return d === undefined || d < 0 ? 99 : d;
}

/**
 * A planner: rooms hold no chance, so it searches them — a beam search over the next seven moves
 * of six steps (run, jump, wait or dash in five directions), keeping the 40 best positions, scored
 * by the shortest open path from the hero to the door (spikes count as walls) and whether a dash
 * is still in hand.
 */
export function plannerPolicy(s: Hop): HopAction {
  if (s.dying || s.cleared || s.over) return 'idle';
  const known = plans.get(keyOf(s));
  if (known) return known;
  type Node = { t: Hop; first: HopAction; v: number; trail: Hop[] };
  const value = (t: Hop) =>
    t.dying
      ? -1e9
      : t.cleared || t.room > s.room
        ? 1e6
        : -distance(t) * 100 -
          t.hero.y * 0.1 +
          (t.hero.canDash ? 30 : 0) +
          (t.hero.ground ? 10 : 0);
  let layer: Node[] = [{ t: s, first: 'idle', v: value(s), trail: [] }];
  let best: Node = layer[0]!;
  for (let d = 0; d < DEPTH && layer.length; d++) {
    const next = new Map<string, Node>();
    for (const n of layer)
      for (const m of MACROS) {
        let t = n.t;
        const seen: Hop[] = [];
        for (let k = 0; k < HOLD && !t.dying && !t.cleared; k++) {
          t = stepHop(t, m);
          seen.push(t);
        }
        if (t.dying) continue;
        const node: Node = {
          t,
          first: d === 0 ? m : n.first,
          v: value(t),
          trail: d === 0 ? seen : n.trail,
        };
        if (t.cleared) {
          if (node.v > best.v || best.t === s) best = node;
          continue;
        }
        const key = `${Math.round(t.hero.x / 2)}:${Math.round(t.hero.y / 2)}:${Math.round(t.hero.vy)}:${t.hero.canDash ? 1 : 0}`;
        const old = next.get(key);
        if (!old || node.v > old.v) next.set(key, node);
      }
    layer = [...next.values()].sort((a, b) => b.v - a.v).slice(0, BEAM);
    if (layer[0] && layer[0].v > best.v) best = layer[0];
  }
  const move = best.first === 'idle' && best.t === s ? 'right' : best.first;
  if (plans.size > 4000) plans.clear();
  for (const t of best.trail.slice(0, -1)) plans.set(keyOf(t), move);
  return move;
}

/** A naive player: runs at the door and jumps at spikes and walls just ahead; never dashes. */
export function hopperPolicy(s: Hop): HopAction {
  if (s.dying || s.cleared || s.over) return 'idle';
  const rows = ROOMS[s.room]!.rows;
  const doorX = rows.find((r) => r.includes('D'))!.indexOf('D') * TILE;
  const dir = doorX > s.hero.x ? 1 : -1;
  const map = mapOf(s.room);
  const ahead = s.hero.x + (dir > 0 ? W_HERO + 14 : -14);
  const feet = s.hero.y + H_HERO + 2;
  const danger =
    touching(map, ahead, feet, 2, 2, '^').length > 0 ||
    map.rows[Math.floor(feet / TILE)]?.[Math.floor(ahead / TILE)] === '.';
  const wall = map.rows[Math.floor((s.hero.y + 4) / TILE)]?.[Math.floor(ahead / TILE)] === '#';
  const go = dir > 0 ? 'right' : 'left';
  if ((danger || wall) && s.hero.ground && !s.prevJump) return dir > 0 ? 'right-jump' : 'left-jump';
  if (!s.hero.ground && s.hero.vy < 0 && s.prevJump) return dir > 0 ? 'right-jump' : 'left-jump';
  return go;
}

export function isHop(d: unknown): d is Hop {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Hop;
  return (
    Number.isInteger(s.room) &&
    s.room >= 0 &&
    s.room < ROOMS.length &&
    typeof s.hero === 'object' &&
    Number.isFinite(s.score)
  );
}
