/**
 * Cube Hopper: an isometric pyramid-hopping game with an original name and look, at 60 steps a
 * second. A pyramid of 28 cubes, seven rows high; the hopper jumps diagonally from cube to cube
 * (each hop takes a moment) and every landing changes the cube's top colour: on level 1 one landing
 * finishes a cube, on level 2 it takes two, and on level 3 each landing toggles it. Turn every cube
 * to the finished colour to clear the round. Red balls drop on to the top rows and bounce down at
 * random; a purple ball bounces to the bottom and hatches into a spring that hops after the hopper.
 * Hopping off the pyramid is a fall — unless a floating disc is there, which carries the hopper to
 * the top (and a spring chasing close behind jumps after it into the void). A green ball freezes
 * everything for a few seconds. Touching a red ball or the spring, or falling, costs a life.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const ROWS = 7;
export const HOP = 18;

export type HopDir = 'up-left' | 'up-right' | 'down-left' | 'down-right';
export type CubeAction = 'idle' | HopDir;
export const ACTIONS: readonly CubeAction[] = [
  'idle',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
];
const STEP: Record<HopDir, [number, number]> = {
  'up-left': [-1, -1],
  'up-right': [-1, 0],
  'down-left': [1, 0],
  'down-right': [1, 1],
};

export type Cell = [number, number];
export const onPyramid = ([r, c]: Cell) => r >= 0 && r < ROWS && c >= 0 && c <= r;
export const cubeIndex = ([r, c]: Cell) => (r * (r + 1)) / 2 + c;
export const CUBES = (ROWS * (ROWS + 1)) / 2;
export const next = ([r, c]: Cell, d: HopDir): Cell => [r + STEP[d][0], c + STEP[d][1]];

export interface Mover {
  at: Cell;
  /** Where it is hopping to, and steps left in the hop. */
  to: Cell | null;
  left: number;
}

export interface Ball extends Mover {
  kind: 'red' | 'purple' | 'green';
  /** Steps between hops. */
  wait: number;
}

export interface Disc {
  /** The row it floats beside, and the side (-1 left, 1 right). */
  row: number;
  side: -1 | 1;
}

export interface Cubes {
  rng: RngState;
  level: number;
  round: number;
  tops: number[];
  hero: Mover;
  facing: HopDir;
  balls: Ball[];
  spring: (Mover & { wait: number }) | null;
  discs: Disc[];
  /** The hopper riding a disc to the top: steps left. */
  riding: number;
  frozen: number;
  spawnIn: number;
  lives: number;
  score: number;
  nextLife: number;
  dying: number;
  cause: string | null;
  /** The pause after a round is cleared. */
  cleared: number;
  over: boolean;
  events: string[];
  steps: number;
  lured: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** Landings needed to finish a cube on a level. */
export const goal = (level: number) => (level === 2 ? 2 : 1);
export const finished = (s: Pick<Cubes, 'tops' | 'level'>, i: number) =>
  s.tops[i] === goal(s.level);
const ballWait = (s: Pick<Cubes, 'level' | 'round'>) =>
  Math.max(18, 40 - (s.level - 1) * 6 - (s.round - 1) * 3);

function freshRound(
  s: Pick<Cubes, 'level' | 'round'>,
): Pick<
  Cubes,
  | 'tops'
  | 'hero'
  | 'facing'
  | 'balls'
  | 'spring'
  | 'discs'
  | 'riding'
  | 'frozen'
  | 'spawnIn'
  | 'dying'
  | 'cause'
  | 'cleared'
> {
  return {
    tops: new Array<number>(CUBES).fill(0),
    hero: { at: [0, 0], to: null, left: 0 },
    facing: 'down-right',
    balls: [],
    spring: null,
    discs: [
      { row: 3 + (s.round % 2), side: -1 },
      { row: 4 - (s.round % 2), side: 1 },
    ],
    riding: 0,
    frozen: 0,
    spawnIn: 120,
    dying: 0,
    cause: null,
    cleared: 0,
  };
}

export function newCubes(seed: number): Cubes {
  return {
    rng: seedRng(seed >>> 0),
    level: 1,
    round: 1,
    ...freshRound({ level: 1, round: 1 }),
    lives: 3,
    score: 0,
    nextLife: 8000,
    over: false,
    events: [],
    steps: 0,
    lured: 0,
  };
}

/** The disc reached by hopping off the pyramid from a cell in a direction, if any. */
export function discFor(s: Pick<Cubes, 'discs'>, from: Cell, d: HopDir): number {
  const [r, c] = from;
  const to = next(from, d);
  if (onPyramid(to)) return -1;
  // Off the left edge (c < 0 or going up-left from c = 0) or the right edge (c > r).
  return s.discs.findIndex(
    (k) =>
      k.row === r &&
      ((k.side < 0 && c === 0 && (d === 'up-left' || to[1] < 0)) ||
        (k.side > 0 && c === r && (d === 'up-right' || to[1] > to[0]))),
  );
}

function land(s: Cubes): Cubes {
  const i = cubeIndex(s.hero.at);
  const before = s.tops[i]!;
  let after = before;
  if (s.level === 3) after = before === 1 ? 0 : 1;
  else if (before < goal(s.level)) after = before + 1;
  if (after === before) return s;
  const tops = s.tops.slice();
  tops[i] = after;
  return {
    ...s,
    tops,
    score: s.score + (after > before ? 25 : 0),
    events: [...s.events, after === goal(s.level) ? 'finish' : 'change'],
  };
}

const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];

export function stepCubes(s0: Cubes, action: CubeAction): Cubes {
  if (s0.over) return s0;
  let s: Cubes = { ...s0, events: [], steps: s0.steps + 1 };
  let rng = s.rng;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };

  if (s.cleared > 0) {
    s.cleared--;
    if (s.cleared > 0) return s;
    const lastRound = s.round === 4;
    const level = lastRound ? Math.min(3, s.level + 1) : s.level;
    const round = lastRound ? 1 : s.round + 1;
    return { ...s, level, round, ...freshRound({ level, round }), events: ['round'] };
  }
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    return {
      ...s,
      lives,
      hero: { at: [0, 0], to: null, left: 0 },
      balls: [],
      spring: null,
      riding: 0,
      frozen: 0,
      spawnIn: 120,
      cause: null,
    };
  }

  // Riding a disc up to the top.
  if (s.riding > 0) {
    s.riding--;
    if (s.riding === 0) {
      s.hero = { at: [0, 0], to: null, left: 0 };
      s = land(s);
    }
    return { ...s, rng };
  }

  // The hopper: a new hop once landed.
  const h = { ...s.hero };
  if (h.to) {
    h.left--;
    if (h.left === 0) {
      h.at = h.to;
      h.to = null;
      s.hero = h;
      if (!onPyramid(h.at))
        return { ...s, rng, dying: 90, cause: 'fall', events: [...s.events, 'fall'] };
      s = land(s);
    } else s.hero = h;
  } else if (action !== 'idle') {
    const disc = discFor(s, h.at, action);
    s.facing = action;
    if (disc >= 0) {
      // On to the disc: the spring, if hard on the hopper's heels, leaps after it and falls.
      const near =
        s.spring && Math.abs(s.spring.at[0] - h.at[0]) + Math.abs(s.spring.at[1] - h.at[1]) <= 2;
      s.discs = s.discs.filter((_, i) => i !== disc);
      s.events.push('disc');
      if (near) {
        s.spring = null;
        s.score += 500;
        s.lured++;
        s.events.push('lured');
      }
      s.balls = [];
      return { ...s, rng, hero: { at: h.at, to: null, left: 0 }, riding: 90 };
    }
    s.hero = { at: h.at, to: next(h.at, action), left: HOP };
    s.events.push('hop');
  }

  // Everything else, unless frozen.
  if (s.frozen > 0) s.frozen--;
  else {
    const wait = ballWait(s);
    const balls: Ball[] = [];
    let spring = s.spring;
    for (const b0 of s.balls) {
      const b = { ...b0 };
      if (b.to) {
        b.left--;
        if (b.left === 0) {
          b.at = b.to;
          b.to = null;
          b.wait = wait;
          if (!onPyramid(b.at)) continue;
          // A purple ball that reaches the bottom row hatches.
          if (b.kind === 'purple' && b.at[0] === ROWS - 1) {
            spring = { at: b.at, to: null, left: 0, wait };
            s.events.push('hatch');
            continue;
          }
        }
      } else if (--b.wait <= 0) {
        b.to = next(b.at, roll() < 0.5 ? 'down-left' : 'down-right');
        b.left = 12;
        // Green balls vanish after a few bounces.
        if (b.kind === 'green' && b.at[0] >= 4) continue;
      }
      balls.push(b);
    }
    if (spring) {
      const sp = { ...spring };
      if (sp.to) {
        sp.left--;
        if (sp.left === 0) {
          sp.at = sp.to;
          sp.to = null;
          sp.wait = wait + 6;
        }
      } else if (--sp.wait <= 0) {
        // Hop to whichever neighbour is nearest the hopper (aiming for where it is going).
        const target = s.hero.to && onPyramid(s.hero.to) ? s.hero.to : s.hero.at;
        let best: Cell | null = null;
        let bd = Infinity;
        for (const d of ['up-left', 'up-right', 'down-left', 'down-right'] as const) {
          const n = next(sp.at, d);
          if (!onPyramid(n)) continue;
          const dist =
            Math.abs(n[0] - target[0]) +
            Math.abs(n[1] - target[1]) +
            Math.abs(n[0] - n[1] - (target[0] - target[1]));
          if (dist < bd) {
            bd = dist;
            best = n;
          }
        }
        if (best) {
          sp.to = best;
          sp.left = 14;
        }
      }
      spring = sp;
    }
    s.balls = balls;
    s.spring = spring;
    // New balls drop on to the second row.
    s.spawnIn--;
    if (s.spawnIn <= 0) {
      const r = roll();
      const kind =
        !s.spring && !s.balls.some((b) => b.kind === 'purple') && r < 0.3
          ? 'purple'
          : r > 0.93
            ? 'green'
            : 'red';
      s.balls = [...s.balls, { at: [1, roll() < 0.5 ? 0 : 1], to: null, left: 0, kind, wait }];
      s.spawnIn = Math.max(90, 220 - (s.level - 1) * 40 - (s.round - 1) * 10);
    }
  }
  s.rng = rng;

  // Meetings (only on landed cells; a hop in the air passes over).
  if (!s.hero.to) {
    for (const b of s.balls) {
      if (b.to || !same(b.at, s.hero.at)) continue;
      if (b.kind === 'green') {
        s.balls = s.balls.filter((k) => k !== b);
        s.frozen = 240;
        s.score += 100;
        s.events.push('freeze');
        break;
      }
      return { ...s, dying: 90, cause: 'ball', events: [...s.events, 'caught'] };
    }
    if (s.spring && !s.spring.to && same(s.spring.at, s.hero.at))
      return { ...s, dying: 90, cause: 'spring', events: [...s.events, 'caught'] };
  }

  if (s.score >= s.nextLife) {
    s.lives++;
    s.nextLife += 8000;
    s.events.push('extra');
  }
  if (s.tops.every((_, i) => finished(s, i))) {
    const bonus = 1000 + 250 * (s.round - 1) + 50 * s.discs.length;
    return {
      ...s,
      score: s.score + bonus,
      cleared: 150,
      balls: [],
      spring: null,
      events: [...s.events, 'cleared'],
    };
  }
  return s;
}

// ---- Players ----

const DIRS: HopDir[] = ['up-left', 'up-right', 'down-left', 'down-right'];

/** Cells an enemy might stand on within the next hop or two. */
function danger(s: Cubes): Set<number> {
  const out = new Set<number>();
  const add = (c: Cell) => onPyramid(c) && out.add(cubeIndex(c));
  for (const b of s.balls) {
    if (b.kind === 'green') continue;
    const at = b.to ?? b.at;
    add(at);
    add(next(at, 'down-left'));
    add(next(at, 'down-right'));
  }
  if (s.spring) {
    const at = s.spring.to ?? s.spring.at;
    add(at);
    for (const d of DIRS) add(next(at, d));
  }
  return out;
}

/**
 * A planner: breadth-first through the pyramid to the nearest unfinished cube, avoiding cubes a
 * ball or the spring could reach in the next moment; when the spring is close and a disc is in
 * reach it lures the spring off; it heads for a green ball if one is near.
 */
export function plannerPolicy(s: Cubes): CubeAction {
  if (s.over || s.dying || s.cleared || s.riding || s.hero.to) return 'idle';
  const here = s.hero.at;
  const bad = s.frozen > 0 ? new Set<number>() : danger(s);
  // Lure the spring off when it is close.
  if (s.spring && Math.abs(s.spring.at[0] - here[0]) + Math.abs(s.spring.at[1] - here[1]) <= 2)
    for (const d of DIRS) if (discFor(s, here, d) >= 0) return d;
  const green = s.balls.find((b) => b.kind === 'green');
  const want = (c: Cell) =>
    (green && same(green.to ?? green.at, c)) ||
    (s.level === 3 ? s.tops[cubeIndex(c)] !== 1 : !finished(s, cubeIndex(c)));
  // BFS over safe cells.
  const prev = new Map<number, [number, HopDir]>();
  const start = cubeIndex(here);
  const queue: Cell[] = [here];
  prev.set(start, [-1, 'up-left']);
  while (queue.length) {
    const c = queue.shift()!;
    const ci = cubeIndex(c);
    if (ci !== start && want(c)) {
      let k = ci;
      while (prev.get(k)![0] !== start) k = prev.get(k)![0];
      return prev.get(k)![1];
    }
    for (const d of DIRS) {
      const n = next(c, d);
      if (!onPyramid(n)) continue;
      const ni = cubeIndex(n);
      if (prev.has(ni) || (bad.has(ni) && Math.abs(n[0] - here[0]) <= 2)) continue;
      prev.set(ni, [ci, d]);
      queue.push(n);
    }
  }
  // Nothing safe to aim for: stay unless standing in danger, then take any safe neighbour.
  if (!bad.has(start)) return 'idle';
  for (const d of DIRS) {
    const n = next(here, d);
    if (onPyramid(n) && !bad.has(cubeIndex(n))) return d;
  }
  return 'idle';
}

/** A simple player: hops towards the nearest unfinished cube, paying no attention to anything else. */
export function eagerPolicy(s: Cubes): CubeAction {
  if (s.over || s.dying || s.cleared || s.riding || s.hero.to) return 'idle';
  const here = s.hero.at;
  let best: HopDir | null = null;
  let bd = Infinity;
  for (const d of DIRS) {
    const n = next(here, d);
    if (!onPyramid(n)) continue;
    for (let i = 0; i < CUBES; i++) {
      if (finished(s, i)) continue;
      let r = 0;
      while (((r + 1) * (r + 2)) / 2 <= i) r++;
      const c = i - (r * (r + 1)) / 2;
      const dist = Math.abs(r - n[0]) + Math.abs(c - n[1]) + (finished(s, cubeIndex(n)) ? 1 : 0);
      if (dist < bd) {
        bd = dist;
        best = d;
      }
    }
  }
  return best ?? 'idle';
}

export function isCubes(d: unknown): d is Cubes {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Cubes;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.tops) &&
    s.tops.length === CUBES &&
    typeof s.hero === 'object' &&
    Number.isFinite(s.score)
  );
}
