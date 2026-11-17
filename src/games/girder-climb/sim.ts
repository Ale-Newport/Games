/**
 * Girder Climb: a single-screen climbing game with an original cast, at 60 steps a second. Four
 * hand-made stages of sloping girders joined by ladders (some broken, which only drums can use): at
 * the top a runaway robot rolls drums down the slopes, and a kitten waits on a platform above.
 * Drums roll downhill, drop off the low end of each girder onto whatever lies below, and sometimes
 * take a ladder down instead (more often when the climber is below). The climber walks the slopes,
 * climbs whole ladders, and jumps (a fixed arc) — over a drum for 100 points. Two hammers hang on
 * the way: holding one for ten seconds smashes drums for 300, but no jumping or climbing meanwhile.
 * A bonus counts down from 5000; reaching the kitten scores what is left and moves on to the next
 * stage. After the fourth stage the four come round again, faster. A drum, a long fall or the bonus
 * running out costs a life (three; one more at 10 000).
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

/**
 * A stage: girders listed bottom first (girder 0 is the floor the climber starts on; the last is
 * the kitten's platform), the ladders between them, where the hammers hang, where the robot stands
 * and the drums it throws (taken in turn), where the kitten waits and where the recycler swallows
 * drums on the floor.
 */
export interface Stage {
  id: string;
  girders: readonly Girder[];
  ladders: readonly Ladder[];
  hammers: readonly { g: number; x: number }[];
  startX: number;
  robot: { g: number; x: number };
  throws: readonly { g: number; x: number; dir: 1 | -1 }[];
  /** The time between throws relative to the first stage (more for a stage whose drums all cross the route). */
  throwGap: number;
  kittenX: number;
  binX: number;
}

const whole = (x: number, from: number, to: number): Ladder => ({ x, from, to, broken: false });
const broken = (x: number, from: number, to: number): Ladder => ({ x, from, to, broken: true });

/** Stage 1 · Zigzag: six full-width girders sloping alternately, drums crossing every one. */
const ZIGZAG: Stage = {
  id: 'zigzag',
  girders: [
    { x0: 0, x1: 224, yl: 248, yr: 242 },
    { x0: 0, x1: 208, yl: 208, yr: 216 },
    { x0: 16, x1: 224, yl: 182, yr: 174 },
    { x0: 0, x1: 208, yl: 142, yr: 150 },
    { x0: 16, x1: 224, yl: 116, yr: 108 },
    { x0: 0, x1: 208, yl: 76, yr: 84 },
    { x0: 96, x1: 160, yl: 44, yr: 44 },
  ],
  ladders: [
    whole(184, 0, 1),
    broken(80, 0, 1),
    whole(40, 1, 2),
    whole(104, 1, 2),
    broken(160, 1, 2),
    whole(72, 2, 3),
    whole(192, 2, 3),
    whole(168, 3, 4),
    broken(56, 3, 4),
    whole(112, 3, 4),
    whole(184, 4, 5),
    broken(88, 4, 5),
    whole(136, 5, 6),
  ],
  hammers: [
    { g: 1, x: 24 },
    { g: 4, x: 200 },
  ],
  startX: 28,
  robot: { g: 5, x: 36 },
  throws: [{ g: 5, x: 52, dir: 1 }],
  throwGap: 1,
  kittenX: 120,
  binX: 10,
};

/**
 * Stage 2 · Funnel: every level is a valley of two girders sloping down to a gap, the gaps
 * staggered left and right, so drums pour back and forth through the middle of the screen. The
 * main ladders stand right in that stream; the short outer girders are off the route.
 */
const FUNNEL: Stage = {
  id: 'funnel',
  girders: [
    { x0: 0, x1: 224, yl: 244, yr: 250 },
    { x0: 0, x1: 148, yl: 210, yr: 216 },
    { x0: 160, x1: 224, yl: 216, yr: 212 },
    { x0: 0, x1: 68, yl: 176, yr: 182 },
    { x0: 80, x1: 224, yl: 182, yr: 176 },
    { x0: 0, x1: 148, yl: 142, yr: 148 },
    { x0: 160, x1: 224, yl: 148, yr: 144 },
    { x0: 0, x1: 68, yl: 108, yr: 114 },
    { x0: 80, x1: 224, yl: 114, yr: 108 },
    { x0: 0, x1: 148, yl: 74, yr: 80 },
    { x0: 160, x1: 224, yl: 80, yr: 76 },
    { x0: 112, x1: 200, yl: 44, yr: 44 },
  ],
  ladders: [
    whole(56, 0, 1),
    broken(96, 0, 1),
    whole(200, 0, 2),
    whole(124, 1, 4),
    broken(104, 1, 4),
    whole(208, 2, 4),
    whole(40, 3, 5),
    whole(96, 4, 5),
    broken(120, 4, 5),
    whole(124, 5, 8),
    broken(104, 5, 8),
    whole(200, 6, 8),
    whole(40, 7, 9),
    whole(96, 8, 9),
    broken(120, 8, 9),
    whole(128, 9, 11),
    whole(184, 10, 11),
  ],
  hammers: [
    { g: 1, x: 16 },
    { g: 8, x: 200 },
  ],
  startX: 28,
  robot: { g: 9, x: 36 },
  throws: [{ g: 9, x: 52, dir: 1 }],
  throwGap: 0.95,
  kittenX: 160,
  binX: 214,
};

/**
 * Stage 3 · Cascade: peaks and valleys in turn. The robot stands on the top peak and throws to both
 * sides; drums run off the peaks' outer ends, back along the valleys to their middle gaps, and out
 * again, down both halves of the screen at once. The peaks can be walked across.
 */
const CASCADE: Stage = {
  id: 'cascade',
  girders: [
    { x0: 0, x1: 224, yl: 244, yr: 250 },
    { x0: 16, x1: 112, yl: 218, yr: 212 },
    { x0: 112, x1: 208, yl: 212, yr: 218 },
    { x0: 0, x1: 106, yl: 178, yr: 184 },
    { x0: 118, x1: 224, yl: 184, yr: 178 },
    { x0: 16, x1: 112, yl: 150, yr: 144 },
    { x0: 112, x1: 208, yl: 144, yr: 150 },
    { x0: 0, x1: 106, yl: 110, yr: 116 },
    { x0: 118, x1: 224, yl: 116, yr: 110 },
    { x0: 24, x1: 112, yl: 82, yr: 76 },
    { x0: 112, x1: 200, yl: 76, yr: 82 },
    { x0: 8, x1: 64, yl: 44, yr: 44 },
  ],
  ladders: [
    whole(64, 0, 1),
    broken(40, 0, 1),
    whole(176, 0, 2),
    broken(150, 0, 2),
    broken(32, 1, 3),
    broken(88, 1, 3),
    whole(192, 2, 4),
    broken(136, 2, 4),
    whole(88, 3, 5),
    broken(40, 3, 5),
    whole(136, 4, 6),
    broken(184, 4, 6),
    whole(32, 5, 7),
    broken(72, 5, 7),
    broken(192, 6, 8),
    broken(152, 6, 8),
    whole(88, 7, 9),
    whole(136, 8, 10),
    whole(40, 9, 11),
  ],
  hammers: [
    { g: 3, x: 16 },
    { g: 8, x: 208 },
  ],
  startX: 28,
  robot: { g: 9, x: 112 },
  throws: [
    { g: 10, x: 128, dir: 1 },
    { g: 9, x: 96, dir: -1 },
  ],
  throwGap: 0.85,
  kittenX: 22,
  binX: 214,
};

/**
 * Stage 4 · Stairway: five short girders climb from the bottom left to the top right, each sloping
 * down to the left and overlapping the next. The robot throws from the top step; drums run down
 * each step and drop onto the one below, right across the climber's way up.
 */
const STAIRWAY: Stage = {
  id: 'stairway',
  girders: [
    { x0: 0, x1: 224, yl: 250, yr: 244 },
    { x0: 6, x1: 92, yl: 218, yr: 212 },
    { x0: 39, x1: 125, yl: 184, yr: 178 },
    { x0: 72, x1: 158, yl: 150, yr: 144 },
    { x0: 105, x1: 191, yl: 116, yr: 110 },
    { x0: 138, x1: 224, yl: 82, yr: 76 },
    { x0: 96, x1: 176, yl: 44, yr: 44 },
  ],
  ladders: [
    whole(24, 0, 1),
    whole(83, 1, 2),
    broken(56, 1, 2),
    whole(94, 2, 3),
    whole(146, 3, 4),
    broken(120, 3, 4),
    whole(172, 4, 5),
    whole(150, 5, 6),
  ],
  hammers: [
    { g: 1, x: 12 },
    { g: 3, x: 80 },
  ],
  startX: 150,
  robot: { g: 5, x: 202 },
  throws: [{ g: 5, x: 186, dir: -1 }],
  throwGap: 1.5,
  kittenX: 110,
  binX: 8,
};

/** The stages in play order; after the last the first comes round again, faster. */
export const STAGES: readonly Stage[] = [ZIGZAG, FUNNEL, CASCADE, STAIRWAY];

/** The stage a level is played on, and how many times the four have been cleared before it. */
export const stageOf = (level: number): Stage => STAGES[(level - 1) % STAGES.length]!;
export const loopOf = (level: number): number => Math.floor((level - 1) / STAGES.length);
/** The kitten's platform: the stage's last girder. */
export const topOf = (st: Stage): number => st.girders.length - 1;

export function girderY(st: Stage, g: number, x: number): number {
  const gi = st.girders[g]!;
  const t = (x - gi.x0) / (gi.x1 - gi.x0);
  return gi.yl + (gi.yr - gi.yl) * t;
}
/** The way drums roll on a girder: towards its lower end (left on a level one). */
export const downhill = (st: Stage, g: number): 1 | -1 =>
  st.girders[g]!.yr > st.girders[g]!.yl ? 1 : -1;
const onGirder = (st: Stage, g: number, x: number) =>
  x >= st.girders[g]!.x0 && x <= st.girders[g]!.x1;

/**
 * Where girders meet end to end at the same height (the two sides of a peak): walking off one end
 * steps straight onto the other girder.
 */
export function joinsOf(st: Stage): { from: number; to: number; x: number }[] {
  const out: { from: number; to: number; x: number }[] = [];
  st.girders.forEach((a, i) =>
    st.girders.forEach((b, k) => {
      if (Math.abs(a.x1 - b.x0) <= 1 && Math.abs(a.yr - b.yl) <= 2) {
        out.push({ from: i, to: k, x: a.x1 + 2 });
        out.push({ from: k, to: i, x: b.x0 - 2 });
      }
    }),
  );
  return out;
}

/**
 * The climbing route: for each girder, how many moves (a whole ladder up, or across a join) it
 * takes to reach the kitten's platform — Infinity where there is no way up.
 */
const routeCache = new Map<string, number[]>();
export function routeOf(st: Stage): number[] {
  const cached = routeCache.get(st.id);
  if (cached) return cached;
  const moves = [
    ...st.ladders.filter((l) => !l.broken).map((l) => ({ from: l.from, to: l.to })),
    ...joinsOf(st),
  ];
  const dist = st.girders.map(() => Infinity);
  dist[topOf(st)] = 0;
  for (let changed = true; changed;) {
    changed = false;
    for (const m of moves)
      if (dist[m.to]! + 1 < dist[m.from]!) {
        dist[m.from] = dist[m.to]! + 1;
        changed = true;
      }
  }
  routeCache.set(st.id, dist);
  return dist;
}

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

/** Difficulty by round of the four stages (0 for the first time through). */
const drumSpeed = (loop: number) => 0.9 + 0.12 * Math.min(loop, 6);
const throwEvery = (loop: number) => Math.max(80, 170 - 15 * loop);

function startClimber(st: Stage): Climber {
  return {
    x: st.startX,
    y: girderY(st, 0, st.startX),
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
  const st = stageOf(s.level);
  return {
    p: startClimber(st),
    drums: [],
    throwIn: 60,
    hammers: st.hammers.map(() => true),
    bonus: Math.min(8000, 5000 + 1000 * loopOf(s.level)),
    dying: 0,
    cause: null,
    best: 0,
  };
}

export function newGirders(seed: number, level = 1): Girders {
  return {
    rng: seedRng(seed >>> 0),
    level,
    ...freshLife({ level }),
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
function landing(st: Stage, x: number, y0: number, y1: number): number {
  for (let g = 0; g < st.girders.length; g++) {
    if (!onGirder(st, g, x)) continue;
    const gy = girderY(st, g, x);
    if (y0 <= gy + 0.01 && y1 >= gy) return g;
  }
  return -1;
}

/** A ladder the climber can use from where it stands, going up or down. */
export function ladderAt(st: Stage, p: Climber, dir: 'up' | 'down'): number {
  if (p.mode !== 'walk') return -1;
  return st.ladders.findIndex(
    (l) => !l.broken && Math.abs(l.x - p.x) <= 3 && (dir === 'up' ? l.from === p.g : l.to === p.g),
  );
}

function die(s: Girders, cause: string): Girders {
  return { ...s, dying: 90, cause, events: [...s.events, 'die', cause] };
}

function stepClimber(st: Stage, s: Girders, a: GirderAction): Girders {
  const p = { ...s.p };
  const events = s.events;
  const horiz =
    a === 'left' || a === 'jump-left' ? -1 : a === 'right' || a === 'jump-right' ? 1 : 0;
  if (p.hammer > 0) p.hammer--;
  if (p.mode === 'walk') {
    const jump = (a === 'jump' || a === 'jump-left' || a === 'jump-right') && p.hammer === 0;
    const up = a === 'up' ? ladderAt(st, p, 'up') : -1;
    const down = a === 'down' ? ladderAt(st, p, 'down') : -1;
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
      p.x = st.ladders[p.ladder]!.x;
    } else if (horiz) {
      p.facing = horiz as 1 | -1;
      const nx = Math.max(4, Math.min(W - 4, p.x + horiz * WALK));
      p.x = nx;
      if (onGirder(st, p.g, nx)) p.y = girderY(st, p.g, nx);
      else {
        p.mode = 'fall';
        p.vy = 0;
        p.from = p.y;
      }
    }
  } else if (p.mode === 'climb') {
    const l = st.ladders[p.ladder]!;
    const top = girderY(st, l.to, l.x);
    const bottom = girderY(st, l.from, l.x);
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
      const g = landing(st, p.x, y0, p.y);
      if (g >= 0) {
        const drop = girderY(st, g, p.x) - p.from;
        p.mode = 'walk';
        p.g = g;
        p.y = girderY(st, g, p.x);
        p.vx = 0;
        p.vy = 0;
        if (drop > SAFE_FALL) return die({ ...s, p }, 'fall');
      } else if (p.y > H + 20) return die({ ...s, p }, 'fall');
    }
  }
  // Hammers hang at head height: walking or jumping into one picks it up.
  let hammers = s.hammers;
  st.hammers.forEach((h, i) => {
    if (
      hammers[i] &&
      Math.abs(p.x - h.x) < 7 &&
      Math.abs(p.y - girderY(st, h.g, h.x)) < 24 &&
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

function stepDrums(st: Stage, s: Girders): Girders {
  let rng = s.rng;
  const loop = loopOf(s.level);
  const speed = drumSpeed(loop);
  const drums: Drum[] = [];
  const p = s.p;
  for (const d0 of s.drums) {
    const d = { ...d0, passed: d0.passed };
    if (d.mode === 'roll') {
      // Each ladder down from this girder is considered once as the drum passes its top.
      const li = st.ladders.findIndex(
        (l, i) => l.to === d.g && Math.abs(l.x - d.x) < speed / 2 + 0.01 && !d.passed.includes(i),
      );
      if (li >= 0) {
        d.passed = [...d.passed, li];
        const below = p.y > d.y + 8;
        const [r, n] = rand(rng);
        rng = n;
        if (r < (below ? 0.4 : 0.15) + 0.04 * Math.min(loop, 5)) {
          d.mode = 'ladder';
          d.ladder = li;
          d.x = st.ladders[li]!.x;
        }
      }
      if (d.mode === 'roll') {
        d.x += d.dir * speed;
        if (onGirder(st, d.g, d.x)) d.y = girderY(st, d.g, d.x);
        else {
          d.mode = 'fall';
          d.vy = 0;
        }
      }
    } else if (d.mode === 'ladder') {
      const l = st.ladders[d.ladder]!;
      d.y += speed;
      const bottom = girderY(st, l.from, l.x);
      if (d.y >= bottom) {
        d.mode = 'roll';
        d.g = l.from;
        d.y = bottom;
        d.dir = downhill(st, l.from);
      }
    } else {
      const y0 = d.y;
      d.vy = Math.min(3, d.vy + GRAVITY * 2);
      d.y += d.vy;
      const g = landing(st, d.x, y0, d.y);
      if (g >= 0) {
        d.mode = 'roll';
        d.g = g;
        d.y = girderY(st, g, d.x);
        d.dir = downhill(st, g);
      }
    }
    // Into the recycler on the floor, or off the screen.
    if ((d.g === 0 && d.mode === 'roll' && Math.abs(d.x - st.binX) <= 6) || d.y > H + 10) continue;
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

  const st = stageOf(s.level);
  s = stepClimber(st, s, action);
  if (s.dying) return s;
  s = stepDrums(st, s);

  // The robot throws a drum now and then (taking its throws in turn).
  s.throwIn--;
  if (s.throwIn <= 0) {
    const [r, n] = rand(s.rng);
    s.rng = n;
    const t = st.throws[s.nextId % st.throws.length]!;
    s.drums = [
      ...s.drums,
      {
        id: s.nextId,
        x: t.x,
        y: girderY(st, t.g, t.x),
        mode: 'roll',
        g: t.g,
        ladder: -1,
        dir: t.dir,
        vy: 0,
        cleared: false,
        passed: [],
      },
    ];
    s.nextId++;
    s.throwIn = Math.round(throwEvery(loopOf(s.level)) * st.throwGap * (0.7 + 0.6 * r));
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
  if (p.mode === 'walk' && p.g === topOf(st) && Math.abs(p.x - st.kittenX) < 10) {
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

/**
 * Where the climber heads next on girder g from x: the kitten on the top platform, or the nearest
 * way up (a whole ladder or a join) that is a step closer to it on the route.
 */
export function nextExit(st: Stage, g: number, x: number): number | null {
  if (g === topOf(st)) return st.kittenX;
  const dist = routeOf(st);
  const exits = [
    ...st.ladders.filter((l) => !l.broken && l.from === g).map((l) => ({ to: l.to, x: l.x })),
    ...joinsOf(st).filter((j) => j.from === g),
  ].filter((e) => dist[e.to]! < dist[g]!);
  let best: { to: number; x: number } | null = null;
  for (const e of exits)
    if (
      !best ||
      dist[e.to]! < dist[best.to]! ||
      (dist[e.to] === dist[best.to] && Math.abs(e.x - x) < Math.abs(best.x - x))
    )
      best = e;
  return best ? best.x : null;
}

/**
 * A climber: heads up the route (the nearest whole ladder or join that brings the kitten closer),
 * jumps drums rolling at it when they come within jumping range, waits at the foot of a ladder while
 * a drum is on it or about to reach its top, and steps aside from drums dropping from above.
 */
export function climberPolicy(s: Girders): GirderAction {
  if (s.dying || s.rescued || s.over) return 'idle';
  const st = stageOf(s.level);
  const p = s.p;
  if (p.mode === 'jump' || p.mode === 'fall') return 'idle';
  if (p.mode === 'climb') {
    const l = st.ladders[p.ladder]!;
    // A drum coming down this ladder: back off the way we came.
    const threat = s.drums.some((d) => d.mode === 'ladder' && d.ladder === p.ladder && d.y < p.y);
    return threat && p.y > girderY(st, l.to, l.x) + 10 ? 'down' : 'up';
  }
  const speed = drumSpeed(loopOf(s.level));
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
  const target = nextExit(st, p.g, p.x) ?? p.x;
  if (Math.abs(target - p.x) <= 1) {
    if (p.g === topOf(st)) return 'idle';
    const li = ladderAt(st, p, 'up');
    if (li < 0) return target > p.x ? 'right' : 'left';
    const l = st.ladders[li]!;
    // Wait while a drum is on the ladder or would pass its top before the climb is over.
    const reach = ((girderY(st, l.from, l.x) - girderY(st, l.to, l.x)) / CLIMB) * speed + 8;
    const busy = s.drums.some(
      (d) =>
        (d.mode === 'ladder' && d.ladder === li) ||
        (d.mode === 'roll' &&
          d.g === l.to &&
          (l.x - d.x) * d.dir > -4 &&
          (l.x - d.x) * d.dir < Math.max(40, reach)),
    );
    return busy ? 'idle' : 'up';
  }
  return target > p.x ? 'right' : 'left';
}

/** A naive climber: the same route, but it never jumps or waits. */
export function walkerPolicy(s: Girders): GirderAction {
  if (s.dying || s.rescued || s.over) return 'idle';
  const st = stageOf(s.level);
  const p = s.p;
  if (p.mode === 'climb') return 'up';
  if (p.mode !== 'walk') return 'idle';
  const target = nextExit(st, p.g, p.x) ?? p.x;
  if (Math.abs(target - p.x) <= 1) return p.g === topOf(st) ? 'idle' : 'up';
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
    Number.isInteger(s.level) &&
    s.level >= 1 &&
    Array.isArray(s.hammers) &&
    s.hammers.length === stageOf(s.level).hammers.length &&
    Number.isFinite(s.score)
  );
}
