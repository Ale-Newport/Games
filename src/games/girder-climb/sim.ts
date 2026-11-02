/**
 * Girder Climb: a single-screen climbing game with an original cast, at 60 steps a second. Six
 * sloping girders zigzag up the screen, joined by ladders (some broken, which only drums can use);
 * at the top a runaway robot rolls drums down the slopes, and a kitten waits on the platform above.
 * Drums roll downhill, drop off the low end of each girder onto the next, and sometimes take a
 * ladder down instead (more often when the climber is below). The climber walks the slopes, climbs
 * whole ladders, and jumps (a fixed arc) — over a drum for 100 points. Two hammers hang on the way:
 * holding one for ten seconds smashes drums for 300, but no jumping or climbing meanwhile. A bonus
 * counts down from 5000; reaching the kitten scores what is left and starts a faster level. A drum,
 * a long fall or the bonus running out costs a life (three; one more at 10 000).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 224;
export const H = 256;

export type GirderAction =
  'idle' | 'left' | 'right' | 'up' | 'down' | 'jump' | 'jump-left' | 'jump-right';
export const ACTIONS: readonly GirderAction[] = [
  'idle',
  'left',
  'right',
  'up',
  'down',
  'jump',
  'jump-left',
  'jump-right',
];

export interface Girder {
  x0: number;
  x1: number;
  /** Top surface height at the left and right ends. */
  yl: number;
  yr: number;
}

export interface Ladder {
  x: number;
  /** The girder it starts on (below) and reaches (above). */
  from: number;
  to: number;
  broken: boolean;
}

export const GIRDERS: readonly Girder[] = [
  { x0: 0, x1: 224, yl: 248, yr: 242 },
  { x0: 0, x1: 208, yl: 208, yr: 216 },
  { x0: 16, x1: 224, yl: 182, yr: 174 },
  { x0: 0, x1: 208, yl: 142, yr: 150 },
  { x0: 16, x1: 224, yl: 116, yr: 108 },
  { x0: 0, x1: 208, yl: 76, yr: 84 },
  { x0: 96, x1: 160, yl: 44, yr: 44 },
];
export const TOP = GIRDERS.length - 1;

export const LADDERS: readonly Ladder[] = [
  { x: 184, from: 0, to: 1, broken: false },
  { x: 80, from: 0, to: 1, broken: true },
  { x: 40, from: 1, to: 2, broken: false },
  { x: 104, from: 1, to: 2, broken: false },
  { x: 160, from: 1, to: 2, broken: true },
  { x: 72, from: 2, to: 3, broken: false },
  { x: 192, from: 2, to: 3, broken: false },
  { x: 168, from: 3, to: 4, broken: false },
  { x: 56, from: 3, to: 4, broken: true },
  { x: 112, from: 3, to: 4, broken: false },
  { x: 184, from: 4, to: 5, broken: false },
  { x: 88, from: 4, to: 5, broken: true },
  { x: 136, from: 5, to: 6, broken: false },
];

/** Where each hammer hangs (girder and x). */
export const HAMMERS: readonly { g: number; x: number }[] = [
  { g: 1, x: 24 },
  { g: 4, x: 200 },
];
const KITTEN_X = 120;
const ROBOT_X = 36;
const DRUM_X = 10;

export function girderY(g: number, x: number): number {
  const gi = GIRDERS[g]!;
  const t = (x - gi.x0) / (gi.x1 - gi.x0);
  return gi.yl + (gi.yr - gi.yl) * t;
}
/** The way drums roll on a girder: towards its lower end. */
export const downhill = (g: number): 1 | -1 => (GIRDERS[g]!.yr > GIRDERS[g]!.yl ? 1 : -1);
const onGirder = (g: number, x: number) => x >= GIRDERS[g]!.x0 && x <= GIRDERS[g]!.x1;

export interface Climber {
  x: number;
  /** Feet height. */
  y: number;
  mode: 'walk' | 'climb' | 'jump' | 'fall';
  /** The girder walked on, or the ladder climbed. */
  g: number;
  ladder: number;
  vx: number;
  vy: number;
  /** Height the current jump or fall started from. */
  from: number;
  facing: 1 | -1;
  hammer: number;
}

export interface Drum {
  id: number;
  x: number;
  y: number;
  mode: 'roll' | 'ladder' | 'fall';
  g: number;
  ladder: number;
  dir: 1 | -1;
  vy: number;
  /** Already jumped over (scored). */
  cleared: boolean;
  /** Ladders already decided on (so each is considered once). */
  passed: number[];
}

export interface Girders {
  rng: RngState;
  level: number;
  p: Climber;
  drums: Drum[];
  nextId: number;
  throwIn: number;
  hammers: boolean[];
  bonus: number;
  lives: number;
  extraGiven: boolean;
  score: number;
  dying: number;
  cause: string | null;
  /** The pause after reaching the kitten. */
  rescued: number;
  over: boolean;
  events: string[];
  steps: number;
  /** Highest girder reached this life (for the AI and achievements). */
  best: number;
  jumps: number;
  smashes: number;
}

const WALK = 0.75;
const CLIMB = 0.55;
const JUMP_VY = -2.1;
const GRAVITY = 0.11;
const SAFE_FALL = 20;
const BONUS_TICK = 120;

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const drumSpeed = (level: number) => 0.9 + 0.12 * Math.min(level - 1, 6);
const throwEvery = (level: number) => Math.max(80, 170 - 15 * (level - 1));

function startClimber(): Climber {
  return {
    x: 28,
    y: girderY(0, 28),
    mode: 'walk',
    g: 0,
    ladder: -1,
    vx: 0,
    vy: 0,
    from: 0,
    facing: 1,
    hammer: 0,
  };
}

function freshLife(
  s: Pick<Girders, 'level'>,
): Pick<Girders, 'p' | 'drums' | 'throwIn' | 'hammers' | 'bonus' | 'dying' | 'cause' | 'best'> {
  return {
    p: startClimber(),
    drums: [],
    throwIn: 60,
    hammers: HAMMERS.map(() => true),
    bonus: Math.min(8000, 5000 + 1000 * (s.level - 1)),
    dying: 0,
    cause: null,
    best: 0,
  };
}

export function newGirders(seed: number): Girders {
  return {
    rng: seedRng(seed >>> 0),
    level: 1,
    ...freshLife({ level: 1 }),
    nextId: 1,
    lives: 3,
    extraGiven: false,
    score: 0,
    rescued: 0,
    over: false,
    events: [],
    steps: 0,
    jumps: 0,
    smashes: 0,
  };
}

/** The girder whose surface a falling body at x crosses between heights y0 and y1 (descending). */
function landing(x: number, y0: number, y1: number): number {
  for (let g = 0; g < GIRDERS.length; g++) {
    if (!onGirder(g, x)) continue;
    const gy = girderY(g, x);
    if (y0 <= gy + 0.01 && y1 >= gy) return g;
  }
  return -1;
}

/** A ladder the climber can use from where it stands, going up or down. */
export function ladderAt(p: Climber, dir: 'up' | 'down'): number {
  if (p.mode !== 'walk') return -1;
  return LADDERS.findIndex(
    (l) => !l.broken && Math.abs(l.x - p.x) <= 3 && (dir === 'up' ? l.from === p.g : l.to === p.g),
  );
}

function die(s: Girders, cause: string): Girders {
  return { ...s, dying: 90, cause, events: [...s.events, 'die', cause] };
}

function stepClimber(s: Girders, a: GirderAction): Girders {
  const p = { ...s.p };
  const events = s.events;
  const horiz =
    a === 'left' || a === 'jump-left' ? -1 : a === 'right' || a === 'jump-right' ? 1 : 0;
  if (p.hammer > 0) p.hammer--;
  if (p.mode === 'walk') {
    const jump = (a === 'jump' || a === 'jump-left' || a === 'jump-right') && p.hammer === 0;
    const up = a === 'up' ? ladderAt(p, 'up') : -1;
    const down = a === 'down' ? ladderAt(p, 'down') : -1;
    if (jump) {
      p.mode = 'jump';
      p.vx = horiz * WALK;
      p.vy = JUMP_VY;
      p.from = p.y;
      if (horiz) p.facing = horiz as 1 | -1;
      events.push('jump');
    } else if ((up >= 0 || down >= 0) && p.hammer === 0) {
      p.mode = 'climb';
      p.ladder = up >= 0 ? up : down;
      p.x = LADDERS[p.ladder]!.x;
    } else if (horiz) {
      p.facing = horiz as 1 | -1;
      const nx = Math.max(4, Math.min(W - 4, p.x + horiz * WALK));
      p.x = nx;
      if (onGirder(p.g, nx)) p.y = girderY(p.g, nx);
      else {
        p.mode = 'fall';
        p.vy = 0;
        p.from = p.y;
      }
    }
  } else if (p.mode === 'climb') {
    const l = LADDERS[p.ladder]!;
    const top = girderY(l.to, l.x);
    const bottom = girderY(l.from, l.x);
    if (a === 'up') p.y = Math.max(top, p.y - CLIMB);
    else if (a === 'down') p.y = Math.min(bottom, p.y + CLIMB);
    // Near either end, a sideways press steps off onto the girder.
    if (horiz && p.y - top < 6) {
      p.mode = 'walk';
      p.g = l.to;
      p.y = top;
    } else if (horiz && bottom - p.y < 6) {
      p.mode = 'walk';
      p.g = l.from;
      p.y = bottom;
    } else if (p.y <= top && a === 'up') {
      p.mode = 'walk';
      p.g = l.to;
      p.y = top;
    } else if (p.y >= bottom && a === 'down') {
      p.mode = 'walk';
      p.g = l.from;
      p.y = bottom;
    }
  } else {
    // In the air: a jump keeps its sideways speed; a fall drops straight.
    const y0 = p.y;
    p.vy += GRAVITY;
    p.y += p.vy;
    p.x = Math.max(4, Math.min(W - 4, p.x + p.vx));
    if (p.vy > 0) {
      const g = landing(p.x, y0, p.y);
      if (g >= 0) {
        const drop = girderY(g, p.x) - p.from;
        p.mode = 'walk';
        p.g = g;
        p.y = girderY(g, p.x);
        p.vx = 0;
        p.vy = 0;
        if (drop > SAFE_FALL) return die({ ...s, p }, 'fall');
      } else if (p.y > H + 20) return die({ ...s, p }, 'fall');
    }
  }
  // Hammers hang at head height: walking or jumping into one picks it up.
  let hammers = s.hammers;
  HAMMERS.forEach((h, i) => {
    if (
      hammers[i] &&
      Math.abs(p.x - h.x) < 7 &&
      Math.abs(p.y - girderY(h.g, h.x)) < 24 &&
      p.mode !== 'climb'
    ) {
      hammers = hammers.map((v, k) => (k === i ? false : v));
      p.hammer = 600;
      events.push('hammer');
    }
  });
  const best = p.mode === 'walk' ? Math.max(s.best, p.g) : s.best;
  return { ...s, p, hammers, best };
}

function stepDrums(s: Girders): Girders {
  let rng = s.rng;
  const speed = drumSpeed(s.level);
  const drums: Drum[] = [];
  const p = s.p;
  for (const d0 of s.drums) {
    const d = { ...d0, passed: d0.passed };
    if (d.mode === 'roll') {
      // Each ladder down from this girder is considered once as the drum passes its top.
      const li = LADDERS.findIndex(
        (l, i) => l.to === d.g && Math.abs(l.x - d.x) < speed / 2 + 0.01 && !d.passed.includes(i),
      );
      if (li >= 0) {
        d.passed = [...d.passed, li];
        const below = p.y > d.y + 8;
        const [r, n] = rand(rng);
        rng = n;
        if (r < (below ? 0.4 : 0.15) + 0.04 * Math.min(s.level - 1, 5)) {
          d.mode = 'ladder';
          d.ladder = li;
          d.x = LADDERS[li]!.x;
        }
      }
      if (d.mode === 'roll') {
        d.x += d.dir * speed;
        if (onGirder(d.g, d.x)) d.y = girderY(d.g, d.x);
        else {
          d.mode = 'fall';
          d.vy = 0;
        }
      }
    } else if (d.mode === 'ladder') {
      const l = LADDERS[d.ladder]!;
      d.y += speed;
      const bottom = girderY(l.from, l.x);
      if (d.y >= bottom) {
        d.mode = 'roll';
        d.g = l.from;
        d.y = bottom;
        d.dir = downhill(l.from);
      }
    } else {
      const y0 = d.y;
      d.vy = Math.min(3, d.vy + GRAVITY * 2);
      d.y += d.vy;
      const g = landing(d.x, y0, d.y);
      if (g >= 0) {
        d.mode = 'roll';
        d.g = g;
        d.y = girderY(g, d.x);
        d.dir = downhill(g);
      }
    }
    // Into the drum at the bottom left, or off the screen.
    if ((d.g === 0 && d.mode === 'roll' && d.x <= DRUM_X + 6) || d.y > H + 10) continue;
    drums.push(d);
  }
  return { ...s, drums, rng };
}

export function stepGirders(s0: Girders, action: GirderAction): Girders {
  if (s0.over) return s0;
  let s: Girders = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.rescued > 0) {
    s.rescued--;
    if (s.rescued === 0)
      return { ...s, level: s.level + 1, ...freshLife({ level: s.level + 1 }), events: ['level'] };
    return s;
  }
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    return { ...s, lives, ...freshLife(s) };
  }

  s = stepClimber(s, action);
  if (s.dying) return s;
  s = stepDrums(s);

  // The robot throws a drum now and then.
  s.throwIn--;
  if (s.throwIn <= 0) {
    const [r, n] = rand(s.rng);
    s.rng = n;
    s.drums = [
      ...s.drums,
      {
        id: s.nextId,
        x: ROBOT_X + 16,
        y: girderY(5, ROBOT_X + 16),
        mode: 'roll',
        g: 5,
        ladder: -1,
        dir: 1,
        vy: 0,
        cleared: false,
        passed: [],
      },
    ];
    s.nextId++;
    s.throwIn = Math.round(throwEvery(s.level) * (0.7 + 0.6 * r));
    s.events.push('throw');
  }

  // Drums against the climber: smashed by a hammer, cleared by a jump, or a hit.
  const p = s.p;
  const drums: Drum[] = [];
  for (const d of s.drums) {
    const dx = Math.abs(d.x - p.x);
    const headroom = d.y - p.y; // > 0 when the climber's feet are above the drum's base
    if (p.hammer > 0 && dx < 14 && Math.abs(d.y - p.y) < 14) {
      s.score += 300;
      s.smashes++;
      s.events.push('smash');
      continue;
    }
    if (dx < 7 && headroom < 10 && headroom > -14) return die({ ...s, drums: s.drums }, 'drum');
    if (!d.cleared && p.mode === 'jump' && dx < 4 && headroom >= 10 && headroom < 34) {
      drums.push({ ...d, cleared: true });
      s.score += 100;
      s.jumps++;
      s.events.push('over-drum');
      continue;
    }
    drums.push(d);
  }
  s.drums = drums;

  // The kitten.
  if (p.mode === 'walk' && p.g === TOP && Math.abs(p.x - KITTEN_X) < 10) {
    s.score += s.bonus;
    s.events.push('rescue');
    s.rescued = 150;
  }

  if (s.steps % BONUS_TICK === 0) {
    s.bonus = Math.max(0, s.bonus - 100);
    if (s.bonus === 0) return die(s, 'time');
  }
  if (!s.extraGiven && s.score >= 10000) {
    s.lives++;
    s.extraGiven = true;
    s.events.push('extra');
  }
  return s;
}

/** The usable ladder up from each girder that the AI aims for (the nearest to where it arrives). */
function nextLadder(g: number, x: number): Ladder | null {
  let best: Ladder | null = null;
  for (const l of LADDERS)
    if (l.from === g && !l.broken && (!best || Math.abs(l.x - x) < Math.abs(best.x - x))) best = l;
  return best;
}

/**
 * A climber: heads for the nearest whole ladder up (or the kitten), jumps drums rolling at it when
 * they come within jumping range, waits at the foot of a ladder while a drum is on it or about to
 * reach its top, and steps aside from drums dropping from above.
 */
export function climberPolicy(s: Girders): GirderAction {
  if (s.dying || s.rescued || s.over) return 'idle';
  const p = s.p;
  if (p.mode === 'jump' || p.mode === 'fall') return 'idle';
  if (p.mode === 'climb') {
    const l = LADDERS[p.ladder]!;
    const goingUp = l.to > p.g || p.y < girderY(l.from, l.x) - 0.01;
    // A drum coming down this ladder: back off the way we came.
    const threat = s.drums.some((d) => d.mode === 'ladder' && d.ladder === p.ladder && d.y < p.y);
    return threat && p.y > girderY(l.to, l.x) + 10 ? 'down' : goingUp ? 'up' : 'up';
  }
  const speed = drumSpeed(s.level);
  // Drums rolling at us on this girder.
  for (const d of s.drums) {
    if (d.mode !== 'roll' || d.g !== p.g || p.hammer > 0) continue;
    const toward = (p.x - d.x) * d.dir;
    if (toward > 0 && toward < 9 + speed * 9) return 'jump';
  }
  // Drums falling or coming down a ladder just above.
  for (const d of s.drums) {
    if (
      (d.mode === 'fall' || d.mode === 'ladder') &&
      Math.abs(d.x - p.x) < 10 &&
      d.y < p.y &&
      p.y - d.y < 40
    )
      return d.x > p.x ? 'left' : 'right';
  }
  const target = p.g === TOP ? KITTEN_X : (nextLadder(p.g, p.x)?.x ?? p.x);
  if (Math.abs(target - p.x) <= 1) {
    if (p.g === TOP) return 'idle';
    const li = ladderAt(p, 'up');
    if (li < 0) return target > p.x ? 'right' : 'left';
    const l = LADDERS[li]!;
    // Wait while a drum is on the ladder or about to pass its top.
    const busy = s.drums.some(
      (d) =>
        (d.mode === 'ladder' && d.ladder === li) ||
        (d.mode === 'roll' && d.g === l.to && (l.x - d.x) * d.dir > -4 && (l.x - d.x) * d.dir < 40),
    );
    return busy ? 'idle' : 'up';
  }
  return target > p.x ? 'right' : 'left';
}

/** A naive climber: the same route, but it never jumps or waits. */
export function walkerPolicy(s: Girders): GirderAction {
  if (s.dying || s.rescued || s.over) return 'idle';
  const p = s.p;
  if (p.mode === 'climb') return 'up';
  if (p.mode !== 'walk') return 'idle';
  const target = p.g === TOP ? KITTEN_X : (nextLadder(p.g, p.x)?.x ?? p.x);
  if (Math.abs(target - p.x) <= 1) return p.g === TOP ? 'idle' : 'up';
  return target > p.x ? 'right' : 'left';
}

export function isGirders(d: unknown): d is Girders {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Girders;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.drums) &&
    typeof s.p === 'object' &&
    s.p !== null &&
    Number.isFinite(s.score)
  );
}
