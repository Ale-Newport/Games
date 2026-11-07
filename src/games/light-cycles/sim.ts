/**
 * Neon Trails: a trail-racing game with an original name and look, at 60 steps a second. Racers
 * on a 48 × 36 grid move one cell every 4 steps and leave a glowing wall behind them; a racer that
 * runs into a wall, the edge or anyone's trail is out (two meeting head-on both go out). The last
 * racer moving wins the round; if the last ones crash together it is a draw. The first to three
 * round wins takes the match. The player races against one or three computer racers.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const COLS = 48;
export const ROWS = 36;
export const MOVE = 4;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type Heading = keyof typeof DIRS;
export type TrailAction = 'idle' | Heading;
export const ACTIONS: readonly TrailAction[] = ['idle', 'up', 'down', 'left', 'right'];
const OPPOSITE: Record<Heading, Heading> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export interface Racer {
  at: number;
  heading: Heading;
  /** The turn asked for, applied on the next move. */
  next: Heading;
  alive: boolean;
  wins: number;
}

export interface Trails {
  rng: RngState;
  rivals: number;
  round: number;
  /** Owner of each cell's trail + 1 (0: free). */
  grid: number[];
  racers: Racer[];
  tick: number;
  pause: number;
  roundWinner: number | null;
  score: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const idx = (c: number, r: number) => r * COLS + c;
const step = (at: number, h: Heading): number | null => {
  const c = (at % COLS) + DIRS[h][0];
  const r = Math.floor(at / COLS) + DIRS[h][1];
  return c < 0 || r < 0 || c >= COLS || r >= ROWS ? null : idx(c, r);
};

function freshRound(
  rng0: RngState,
  rivals: number,
  wins: number[],
): Pick<Trails, 'rng' | 'grid' | 'racers' | 'tick' | 'pause' | 'roundWinner'> {
  // Each start is shifted a little at random, so no two racers mirror each other.
  let rng = rng0;
  const off = () => {
    const [j, n] = rand(rng);
    rng = n;
    return Math.floor(j * 7) - 3;
  };
  const starts: [number, Heading][] =
    rivals === 1
      ? [
          [idx(8, ROWS / 2 + off()), 'right'],
          [idx(COLS - 9, ROWS / 2 + off()), 'left'],
        ]
      : [
          [idx(8, 8 + off()), 'right'],
          [idx(COLS - 9, ROWS - 9 + off()), 'left'],
          [idx(COLS - 9 + off(), 6), 'down'],
          [idx(8 + off(), ROWS - 7), 'up'],
        ];
  const grid = new Array<number>(COLS * ROWS).fill(0);
  starts.forEach(([at], i) => (grid[at] = i + 1));
  return {
    rng,
    grid,
    racers: starts.map(([at, heading], i) => ({
      at,
      heading,
      next: heading,
      alive: true,
      wins: wins[i] ?? 0,
    })),
    tick: MOVE,
    pause: 0,
    roundWinner: null,
  };
}

export function newTrails(seed: number, rivals = 1): Trails {
  return {
    ...freshRound(seedRng(seed >>> 0), rivals, []),
    rivals,
    round: 1,
    score: 0,
    over: false,
    events: [],
    steps: 0,
  };
}

/** One step with an action for every racer. */
export function stepTrails(s0: Trails, actions: TrailAction[]): Trails {
  if (s0.over) return s0;
  const s: Trails = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.pause > 0) {
    s.pause--;
    if (s.pause > 0) return s;
    if (s.racers.some((r) => r.wins >= 3)) return { ...s, over: true, events: ['over'] };
    return {
      ...s,
      ...freshRound(
        s.rng,
        s.rivals,
        s.racers.map((r) => r.wins),
      ),
      round: s.round + 1,
      events: ['round'],
    };
  }
  const racers = s.racers.map((r, i) => {
    const a = actions[i] ?? 'idle';
    return a !== 'idle' && a !== OPPOSITE[r.heading] ? { ...r, next: a } : { ...r };
  });
  s.tick--;
  if (s.tick > 0) return { ...s, racers };
  s.tick = MOVE;
  const grid = s.grid.slice();
  // Everyone moves at once; crashes are settled together.
  const targets = racers.map((r) => {
    if (!r.alive) return null;
    r.heading = r.next;
    return step(r.at, r.heading);
  });
  racers.forEach((r, i) => {
    if (!r.alive) return;
    const t = targets[i] ?? null;
    const headOn = t !== null && targets.some((o, k) => k !== i && o === t);
    if (t === null || grid[t] !== 0 || headOn) {
      r.alive = false;
      s.events.push(i === 0 ? 'crash' : 'rival-out');
    }
  });
  racers.forEach((r, i) => {
    if (!r.alive) return;
    r.at = targets[i]!;
    grid[r.at] = i + 1;
  });
  const alive = racers.map((r, i) => (r.alive ? i : -1)).filter((i) => i >= 0);
  if (alive.length <= 1) {
    const winner = alive.length === 1 ? alive[0]! : -1;
    const withWins = racers.map((r, i) => (i === winner ? { ...r, wins: r.wins + 1 } : r));
    return {
      ...s,
      grid,
      racers: withWins,
      pause: 120,
      roundWinner: winner,
      score: s.score + (winner === 0 ? 100 : 0),
      events: [...s.events, winner === 0 ? 'round-won' : winner < 0 ? 'round-draw' : 'round-lost'],
    };
  }
  // Surviving a move scores a point.
  if (racers[0]!.alive) s.score++;
  return { ...s, grid, racers };
}

// ---- Players ----

/** Cells reachable from a cell through free cells (capped). */
function room(grid: number[], from: number, cap = 600): number {
  const seen = new Set([from]);
  const q = [from];
  for (let i = 0; i < q.length && seen.size < cap; i++)
    for (const h of Object.keys(DIRS) as Heading[]) {
      const n = step(q[i]!, h);
      if (n !== null && grid[n] === 0 && !seen.has(n)) {
        seen.add(n);
        q.push(n);
      }
    }
  return seen.size;
}

/** Cells this racer reaches before any rival (breadth-first from everyone at once). */
function territory(s: Trails, me: number, myStart: number): number {
  const owner = new Int16Array(COLS * ROWS).fill(-1);
  const q: number[] = [];
  owner[myStart] = me;
  q.push(myStart);
  s.racers.forEach((r, i) => {
    if (i !== me && r.alive) {
      owner[r.at] = i;
      q.push(r.at);
    }
  });
  let mine = 0;
  for (let k = 0; k < q.length; k++) {
    const c = q[k]!;
    const o = owner[c]!;
    for (const h of Object.keys(DIRS) as Heading[]) {
      const n = step(c, h);
      if (n === null || s.grid[n] !== 0 || owner[n] !== -1) continue;
      owner[n] = o;
      if (o === me) mine++;
      q.push(n);
    }
  }
  return mine;
}

/**
 * A strategist: on each move it weighs every turn by the room it would leave (cells reachable) and,
 * among roomy turns, by the cells it would reach before any rival; it never turns into a wall when
 * any other way is open, and avoids cells a rival could also enter next.
 */
export function strategistFor(s: Trails, i: number): TrailAction {
  const me = s.racers[i]!;
  if (!me.alive || s.pause || s.over || s.tick !== 1) return 'idle';
  let best: Heading = me.heading;
  let bv = -Infinity;
  const rivalsNext = new Set<number>();
  s.racers.forEach((r, k) => {
    if (k === i || !r.alive) return;
    for (const h of Object.keys(DIRS) as Heading[]) {
      const n = step(r.at, h);
      if (n !== null && h !== OPPOSITE[r.heading]) rivalsNext.add(n);
    }
  });
  for (const h of Object.keys(DIRS) as Heading[]) {
    if (h === OPPOSITE[me.heading]) continue;
    const n = step(me.at, h);
    if (n === null || s.grid[n] !== 0) continue;
    const g = s.grid.slice();
    g[n] = i + 1;
    const space = room(g, n);
    const terr = territory({ ...s, grid: g }, i, n);
    const v =
      Math.min(space, 400) * 10 +
      terr -
      (rivalsNext.has(n) ? 3000 : 0) +
      (h === me.heading ? 2 : 0);
    if (v > bv) {
      bv = v;
      best = h;
    }
  }
  return best === me.heading ? 'idle' : best;
}

/** A simple racer: keeps straight until the cell ahead is taken, then turns to the roomier side. */
export function cruiserFor(s: Trails, i: number): TrailAction {
  const me = s.racers[i]!;
  if (!me.alive || s.pause || s.over || s.tick !== 1) return 'idle';
  const ahead = step(me.at, me.heading);
  if (ahead !== null && s.grid[ahead] === 0) return 'idle';
  let best: TrailAction = 'idle';
  let bv = -1;
  for (const h of Object.keys(DIRS) as Heading[]) {
    if (h === OPPOSITE[me.heading] || h === me.heading) continue;
    const n = step(me.at, h);
    if (n === null || s.grid[n] !== 0) continue;
    const v = room(s.grid, n, 200);
    if (v > bv) {
      bv = v;
      best = h;
    }
  }
  return best;
}

/** The player's race: seat 0 acts, the others are strategists. */
export function stepWithRivals(s: Trails, action: TrailAction): Trails {
  return stepTrails(
    s,
    s.racers.map((_, i) => (i === 0 ? action : strategistFor(s, i))),
  );
}

export function isTrails(d: unknown): d is Trails {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Trails;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.grid) &&
    s.grid.length === COLS * ROWS &&
    Array.isArray(s.racers) &&
    (s.racers.length === 2 || s.racers.length === 4) &&
    Number.isFinite(s.score)
  );
}
