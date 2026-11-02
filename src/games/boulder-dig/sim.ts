/**
 * Gem Digger: a cave-digging game with an original name and look, at 60 steps a second; the cave
 * itself moves in ticks of 8 steps. Each cave is generated from the run's seed: earth, walls,
 * boulders and gems inside a steel border, with sparks and moths roaming in pockets. The digger
 * tunnels through earth, collects gems and pushes boulders sideways into empty space. Boulders and
 * gems fall when nothing holds them and roll off other boulders, gems and walls; a falling one that
 * lands on the digger, a spark or a moth crushes it (sparks burst into empty space, moths into
 * gems). Touching a spark or a moth is fatal too. With enough gems the exit opens; reaching it
 * scores the time left and leads to the next cave. Three lives; each cave has 150 seconds.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const COLS = 40;
export const ROWS = 22;
export const TICK = 8;
const CAVE_TIME = 150 * 60;

/** `#` steel, `w` wall, `.` earth, ` ` empty, `o` boulder, `*` gem, `x` spark, `m` moth, `E` exit, `@` digger, `%` explosion. */
export type Tile = '#' | 'w' | '.' | ' ' | 'o' | '*' | 'x' | 'm' | 'E' | '@' | '%';
export type DigAction = 'idle' | 'up' | 'down' | 'left' | 'right';
export const ACTIONS: readonly DigAction[] = ['idle', 'up', 'down', 'left', 'right'];
const D: Record<Exclude<DigAction, 'idle'>, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export interface Dig {
  rng: RngState;
  /** The generator as the cave began (a lost life replays the same cave). */
  caveRng: RngState;
  cave: number;
  grid: Tile[];
  /** Objects falling this tick (by cell), enemy facing (by cell: 0 up, 1 right, 2 down, 3 left), explosion timers. */
  falling: number[];
  facing: Record<number, number>;
  blast: Record<number, { left: number; into: Tile }>;
  digger: number;
  need: number;
  gems: number;
  open: boolean;
  time: number;
  tick: number;
  /** A held push: steps the digger has been pushing a boulder. */
  push: number;
  lives: number;
  score: number;
  dying: number;
  cause: string | null;
  exited: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const idx = (c: number, r: number) => r * COLS + c;
const round = (t: Tile) => t === 'o' || t === '*' || t === 'w';
const heavy = (t: Tile) => t === 'o' || t === '*';
const enemy = (t: Tile) => t === 'x' || t === 'm';

/** A cave from a seed: earth with boulders, gems, a few wall runs, enemy pockets, the exit. */
export function makeCave(
  rng0: RngState,
  cave: number,
): { grid: Tile[]; digger: number; need: number; facing: Record<number, number>; rng: RngState } {
  let rng = rng0;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  const grid: Tile[] = new Array<Tile>(COLS * ROWS).fill('.');
  for (let c = 0; c < COLS; c++) {
    grid[idx(c, 0)] = '#';
    grid[idx(c, ROWS - 1)] = '#';
  }
  for (let r = 0; r < ROWS; r++) {
    grid[idx(0, r)] = '#';
    grid[idx(COLS - 1, r)] = '#';
  }
  const boulderShare = 0.12 + Math.min(0.06, cave * 0.01);
  let gemsPlaced = 0;
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = 1; c < COLS - 1; c++) {
      const p = roll();
      if (p < boulderShare) grid[idx(c, r)] = 'o';
      else if (p < boulderShare + 0.045) {
        grid[idx(c, r)] = '*';
        gemsPlaced++;
      } else if (p < boulderShare + 0.075) grid[idx(c, r)] = ' ';
    }
  // Wall runs.
  for (let k = 0; k < 4 + cave; k++) {
    const r = 3 + Math.floor(roll() * (ROWS - 6));
    const c = 2 + Math.floor(roll() * (COLS - 14));
    const len = 4 + Math.floor(roll() * 8);
    for (let i = 0; i < len; i++) if (grid[idx(c + i, r)] !== '*') grid[idx(c + i, r)] = 'w';
  }
  // Enemy pockets: a small empty room with a spark or a moth.
  const facing: Record<number, number> = {};
  for (let k = 0; k < 2 + Math.min(4, cave); k++) {
    const r = 3 + Math.floor(roll() * (ROWS - 7));
    const c = 8 + Math.floor(roll() * (COLS - 12));
    for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 4; dc++) grid[idx(c + dc, r + dr)] = ' ';
    grid[idx(c, r)] = roll() < 0.5 ? 'x' : 'm';
    facing[idx(c, r)] = 1;
  }
  // The digger's start (top left) and its surroundings cleared of boulders; the exit bottom right.
  const digger = idx(2, 2);
  for (let r = 1; r <= 4; r++)
    for (let c = 1; c <= 4; c++) if (grid[idx(c, r)] !== '#') grid[idx(c, r)] = '.';
  grid[digger] = '@';
  grid[idx(COLS - 3, ROWS - 3)] = 'E';
  const need = Math.max(8, Math.floor(gemsPlaced * 0.55));
  return { grid, digger, need, facing, rng };
}

function freshCave(
  rng: RngState,
  cave: number,
): Pick<
  Dig,
  | 'rng'
  | 'caveRng'
  | 'grid'
  | 'digger'
  | 'need'
  | 'facing'
  | 'falling'
  | 'blast'
  | 'gems'
  | 'open'
  | 'time'
  | 'tick'
  | 'push'
  | 'dying'
  | 'cause'
  | 'exited'
> {
  const made = makeCave(rng, cave);
  return {
    ...made,
    caveRng: rng,
    falling: [],
    blast: {},
    gems: 0,
    open: false,
    time: CAVE_TIME,
    tick: TICK,
    push: 0,
    dying: 0,
    cause: null,
    exited: 0,
  };
}

export function newDig(seed: number): Dig {
  return {
    ...freshCave(seedRng(seed >>> 0), 1),
    cave: 1,
    lives: 3,
    score: 0,
    over: false,
    events: [],
    steps: 0,
  };
}

/** Sets off a 3 × 3 explosion around a cell (steel survives); moths leave gems. */
function explode(
  g: Tile[],
  blast: Record<number, { left: number; into: Tile }>,
  at: number,
  into: Tile,
) {
  const c0 = at % COLS;
  const r0 = Math.floor(at / COLS);
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const i = idx(c0 + dc, r0 + dr);
      if (g[i] === '#' || g[i] === 'E') continue;
      g[i] = '%';
      blast[i] = { left: 2, into };
    }
}

/** One tick of the cave: falling and rolling, enemies, explosions. */
function caveTick(s: Dig): Dig {
  const g = s.grid.slice();
  const blast = { ...s.blast };
  const falling = new Set(s.falling);
  const nextFalling = new Set<number>();
  const facing: Record<number, number> = {};
  const moved = new Set<number>();
  const events: string[] = [];
  let dead: string | null = null;
  // Explosions burn out.
  for (const [k, b] of Object.entries(blast)) {
    const i = Number(k);
    if (b.left <= 1) {
      g[i] = b.into;
      delete blast[i];
    } else blast[i] = { ...b, left: b.left - 1 };
  }
  // Bottom to top so objects fall one cell per tick.
  for (let r = ROWS - 2; r >= 1; r--)
    for (let c = 1; c < COLS - 1; c++) {
      const i = idx(c, r);
      if (moved.has(i)) continue;
      const t = g[i]!;
      if (heavy(t)) {
        const below = i + COLS;
        const bt = g[below]!;
        if (bt === ' ') {
          g[below] = t;
          g[i] = ' ';
          nextFalling.add(below);
          moved.add(below);
        } else if (falling.has(i) && (bt === '@' || enemy(bt))) {
          // Crushed.
          if (bt === '@') dead = 'crushed';
          else events.push(bt === 'm' ? 'moth' : 'spark');
          explode(g, blast, below, bt === 'm' ? '*' : ' ');
        } else if (round(bt)) {
          // Roll off to the left, or else to the right.
          for (const dc of [-1, 1]) {
            if (g[i + dc] === ' ' && g[below + dc] === ' ') {
              g[i + dc] = t;
              g[i] = ' ';
              nextFalling.add(i + dc);
              moved.add(i + dc);
              break;
            }
          }
          if (falling.has(i) && g[i] === t) events.push(t === 'o' ? 'thud' : 'chink');
        } else if (falling.has(i)) events.push(t === 'o' ? 'thud' : 'chink');
      } else if (enemy(t)) {
        // Sparks keep a wall on their left, moths on their right.
        const dirs: [number, number][] = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ];
        const f = s.facing[i] ?? 0;
        const turn = t === 'x' ? 3 : 1;
        // Next to the digger: both go up in flames.
        if ([i - 1, i + 1, i - COLS, i + COLS].includes(s.digger) && g[s.digger] === '@') {
          dead = 'enemy';
          explode(g, blast, i, t === 'm' ? '*' : ' ');
          continue;
        }
        let went = false;
        for (const k of [turn, 0, (4 - turn) % 4, 2]) {
          const nf = (f + k) % 4;
          const n = i + dirs[nf]![0] + dirs[nf]![1] * COLS;
          if (g[n] === ' ') {
            g[n] = t;
            g[i] = ' ';
            facing[n] = nf;
            moved.add(n);
            went = true;
            break;
          }
        }
        if (!went) facing[i] = f;
      }
    }
  return {
    ...s,
    grid: g,
    blast,
    falling: [...nextFalling],
    facing,
    cause: dead,
    events: [...s.events, ...events],
  };
}

export function stepDig(s0: Dig, action: DigAction): Dig {
  if (s0.over) return s0;
  let s: Dig = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.exited > 0) {
    s.exited--;
    if (s.exited > 0) return s;
    const cave = s.cave + 1;
    return { ...s, ...freshCave(s.rng, cave), cave, events: ['cave'] };
  }
  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    // The same cave again, from the start.
    return { ...s, ...freshCave(s.caveRng, s.cave), lives, events: ['retry'] };
  }
  s.time--;
  if (s.time <= 0) return { ...s, dying: 90, cause: 'time', events: ['time'] };
  s.tick--;
  if (s.tick > 0) return s;
  s.tick = TICK;

  // The digger moves first, on the tick.
  if (action !== 'idle') {
    const [dc, dr] = D[action];
    const n = s.digger + dc + dr * COLS;
    const t = s.grid[n]!;
    const g = s.grid.slice();
    let to = -1;
    if (t === '.' || t === ' ') to = n;
    else if (t === '*') {
      to = n;
      s.gems++;
      s.score += s.gems > s.need ? 15 : 10;
      s.events.push('gem');
      if (!s.open && s.gems >= s.need) {
        s.open = true;
        s.events.push('open');
      }
    } else if (t === 'E' && s.open) {
      s.score += Math.ceil(s.time / 60);
      s.events.push('exit');
      g[s.digger] = ' ';
      return { ...s, grid: g, exited: 120 };
    } else if (t === 'o' && dr === 0 && g[n + dc] === ' ' && !s.falling.includes(n)) {
      // Pushing a boulder takes a moment of leaning.
      s.push++;
      if (s.push >= 2) {
        g[n + dc] = 'o';
        to = n;
        s.push = 0;
        s.events.push('push');
      }
    }
    if (t !== 'o') s.push = 0;
    if (to >= 0) {
      g[s.digger] = ' ';
      g[to] = '@';
      s.digger = to;
      s.events.push('step');
    }
    s.grid = g;
  } else s.push = 0;

  s = caveTick(s);
  if (s.cause) return { ...s, dying: 90, events: [...s.events, 'die', s.cause] };
  return s;
}

// ---- Players ----

function bfsTo(s: Dig, goal: (i: number) => boolean, avoid: Set<number>): DigAction | null {
  const prev = new Map<number, [number, DigAction]>();
  const queue = [s.digger];
  prev.set(s.digger, [-1, 'idle']);
  while (queue.length) {
    const i = queue.shift()!;
    if (i !== s.digger && goal(i)) {
      let k = i;
      while (prev.get(k)![0] !== s.digger) k = prev.get(k)![0];
      return prev.get(k)![1];
    }
    for (const a of ['up', 'down', 'left', 'right'] as const) {
      const [dc, dr] = D[a];
      const n = i + dc + dr * COLS;
      const t = s.grid[n]!;
      if (prev.has(n) || avoid.has(n)) continue;
      if (t === '.' || t === ' ' || t === '*' || (t === 'E' && s.open)) {
        prev.set(n, [i, a]);
        queue.push(n);
      }
    }
  }
  return null;
}

/** Steps of the shortest way from the digger to a goal through earth and open space (-1: none). */
function distance(s: Dig, goal: (i: number) => boolean, avoid: Set<number>): number {
  const seen = new Map<number, number>([[s.digger, 0]]);
  const queue = [s.digger];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    const d = seen.get(i)!;
    if (i !== s.digger && goal(i)) return d;
    for (const n of [i - 1, i + 1, i - COLS, i + COLS]) {
      const t = s.grid[n]!;
      if (seen.has(n) || avoid.has(n)) continue;
      if (t === '.' || t === ' ' || t === '*' || (t === 'E' && s.open)) {
        seen.set(n, d + 1);
        queue.push(n);
      }
    }
  }
  return -1;
}

const MOVES: DigAction[] = ['left', 'right', 'up', 'down', 'idle'];

/**
 * A miner: on each tick of the cave it tries every sequence of three moves, plays the cave forward
 * (and two quiet ticks after) to see that nothing falls on it or catches it, and takes the first
 * move of the safe sequence that brings it nearest the next gem (the exit once open) by the
 * shortest way through earth, keeping clear of sparks and moths.
 */
export function minerPolicy(s: Dig): DigAction {
  if (s.over || s.dying || s.exited || s.tick !== 1) return 'idle';
  const goalOf = (t: Dig) =>
    t.open ? (i: number) => t.grid[i] === 'E' : (i: number) => t.grid[i] === '*';
  const avoidOf = (t: Dig) => {
    const out = new Set<number>();
    t.grid.forEach((c, i) => {
      if (enemy(c))
        for (const n of [
          i,
          i - 1,
          i + 1,
          i - COLS,
          i + COLS,
          i - COLS - 1,
          i - COLS + 1,
          i + COLS - 1,
          i + COLS + 1,
        ])
          out.add(n);
    });
    return out;
  };
  const tickWith = (t: Dig, a: DigAction) => stepDig({ ...t, tick: 1 }, a);
  const value = (t: Dig): number => {
    if (t.dying) return -1e9;
    // Leaving sooner is better (more of the exit pause left).
    if (t.exited) return 1e8 + t.exited;
    // Safe if some way out survives the next two ticks (keeping going, or staying put).
    const escape = MOVES.some((m) => {
      let u = tickWith(t, m);
      if (u.dying) return false;
      u = tickWith(u, m);
      return !u.dying;
    });
    if (!escape) return -1e9;
    const d = distance(t, goalOf(t), avoidOf(t));
    return t.gems * 1000 + t.score - (d < 0 ? 500 : d * 10);
  };
  let best: DigAction = 'idle';
  let bv = -Infinity;
  for (const a of MOVES) {
    const t1 = tickWith(s, a);
    if (t1.dying) continue;
    let av = -Infinity;
    for (const b of MOVES) {
      const t2 = tickWith(t1, b);
      if (t2.dying) continue;
      // Gems picked up sooner count a little more.
      const early = (t1.gems - s.gems) * 300 + (t2.gems - s.gems) * 100;
      for (const c of MOVES) av = Math.max(av, value(tickWith(t2, c)) + early);
    }
    if (t1.exited) av = 2e8;
    // A slight preference for moving over waiting breaks ties; a move that goes nowhere is waiting.
    if (a === 'idle' || t1.digger === s.digger) av -= 1;
    if (av > bv) {
      bv = av;
      best = a;
    }
  }
  return best;
}

/** A simple player: digs straight for the nearest gem, never checking what might fall. */
export function grabberPolicy(s: Dig): DigAction {
  if (s.over || s.dying || s.exited) return 'idle';
  const goal = s.open ? (i: number) => s.grid[i] === 'E' : (i: number) => s.grid[i] === '*';
  return bfsTo(s, goal, new Set()) ?? 'idle';
}

export function isDig(d: unknown): d is Dig {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Dig;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.grid) &&
    s.grid.length === COLS * ROWS &&
    Number.isInteger(s.digger) &&
    Number.isFinite(s.score)
  );
}
