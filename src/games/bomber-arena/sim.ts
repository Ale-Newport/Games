/**
 * Blast Arena: a bomb-laying arena game with an original name and look, at 60 steps a second. Four
 * blasters start in the corners of a 15 × 13 arena of fixed pillars and wooden crates (some hiding
 * power-ups: an extra bomb, a longer flame, more speed). A blaster walks from cell to cell and drops
 * bombs; a bomb bursts after 2.5 seconds into a cross of flame as long as its owner's flame, stopped
 * by pillars and by the first crate it burns, setting off other bombs in its way. Flame kills any
 * blaster it touches. The last blaster standing wins the round (a round that runs out of time, or
 * where the last ones fall together, is a draw); the first to two round wins takes the match. The
 * player is the white blaster; the other three are computer players.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const COLS = 15;
export const ROWS = 13;
const FUSE = 150;
const FLAME = 30;
const ROUND_TIME = 120 * 60;
export const SEATS = 4;

export type BlastAction = 'idle' | 'up' | 'down' | 'left' | 'right' | 'bomb';
export const ACTIONS: readonly BlastAction[] = ['idle', 'up', 'down', 'left', 'right', 'bomb'];
const D: Record<'up' | 'down' | 'left' | 'right', [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** `#` pillar, `+` crate, ` ` floor. */
export type Cell = '#' | '+' | ' ';
export type Power = 'bomb' | 'flame' | 'speed';

export interface Blaster {
  /** Cell and, while walking, the cell it is walking to. */
  at: number;
  to: number | null;
  /** Steps left in the current walk, and steps a walk takes. */
  left: number;
  pace: number;
  bombs: number;
  flame: number;
  alive: boolean;
  wins: number;
  facing: 'up' | 'down' | 'left' | 'right';
}

export interface Bomb {
  at: number;
  owner: number;
  fuse: number;
  flame: number;
}

export interface Blast {
  cells: Record<number, number>;
}

export interface Arena {
  rng: RngState;
  round: number;
  grid: Cell[];
  powers: Record<number, Power>;
  blasters: Blaster[];
  bombs: Bomb[];
  /** Burning cells and steps left. */
  fire: Record<number, number>;
  time: number;
  /** The pause after a round, and who won it (-1: a draw). */
  pause: number;
  roundWinner: number | null;
  score: number;
  kills: number;
  crates: number;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const idx = (c: number, r: number) => r * COLS + c;
const START = [idx(1, 1), idx(COLS - 2, ROWS - 2), idx(COLS - 2, 1), idx(1, ROWS - 2)];
/** In the last 40 seconds the arena closes in: blocks fill it in a spiral, one every 15 steps. */
export const CLOSING = 40 * 60;
const CLOSE_EVERY = 15;
export const SPIRAL: number[] = (() => {
  const out: number[] = [];
  let [c0, r0, c1, r1] = [1, 1, COLS - 2, ROWS - 2];
  while (c0 <= c1 && r0 <= r1) {
    for (let c = c0; c <= c1; c++) out.push(idx(c, r0));
    for (let r = r0 + 1; r <= r1; r++) out.push(idx(c1, r));
    if (r0 < r1) for (let c = c1 - 1; c >= c0; c--) out.push(idx(c, r1));
    if (c0 < c1) for (let r = r1 - 1; r > r0; r--) out.push(idx(c0, r));
    [c0, r0, c1, r1] = [c0 + 1, r0 + 1, c1 - 1, r1 - 1];
  }
  return out.filter((i) => !((i % COLS) % 2 === 0 && Math.floor(i / COLS) % 2 === 0));
})();

function makeArena(rng0: RngState): { grid: Cell[]; powers: Record<number, Power>; rng: RngState } {
  let rng = rng0;
  const roll = () => {
    const [r, n] = rand(rng);
    rng = n;
    return r;
  };
  const grid: Cell[] = [];
  const powers: Record<number, Power> = {};
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const edge = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
      const pillar = r % 2 === 0 && c % 2 === 0;
      grid.push(edge || pillar ? '#' : ' ');
    }
  // Crates everywhere but the corners' elbow room.
  const clear = new Set<number>();
  for (const s of START)
    for (const d of [0, 1, -1, COLS, -COLS, 2, -2, 2 * COLS, -2 * COLS]) clear.add(s + d);
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== ' ' || clear.has(i)) continue;
    if (roll() < 0.7) {
      grid[i] = '+';
      const p = roll();
      if (p < 0.12) powers[i] = 'bomb';
      else if (p < 0.24) powers[i] = 'flame';
      else if (p < 0.3) powers[i] = 'speed';
    }
  }
  return { grid, powers, rng };
}

function freshRound(
  rng: RngState,
  wins: number[],
): Pick<
  Arena,
  'rng' | 'grid' | 'powers' | 'blasters' | 'bombs' | 'fire' | 'time' | 'pause' | 'roundWinner'
> {
  const made = makeArena(rng);
  return {
    ...made,
    blasters: START.map((at, i) => ({
      at,
      to: null,
      left: 0,
      pace: 14,
      bombs: 1,
      flame: 2,
      alive: true,
      wins: wins[i] ?? 0,
      facing: 'down',
    })),
    bombs: [],
    fire: {},
    time: ROUND_TIME,
    pause: 0,
    roundWinner: null,
  };
}

export function newArena(seed: number): Arena {
  return {
    ...freshRound(seedRng(seed >>> 0), [0, 0, 0, 0]),
    round: 1,
    score: 0,
    kills: 0,
    crates: 0,
    over: false,
    events: [],
    steps: 0,
  };
}

const walkable = (s: Pick<Arena, 'grid' | 'bombs'>, i: number) =>
  s.grid[i] === ' ' && !s.bombs.some((b) => b.at === i);

/** The cells a bomb's flame would reach. */
export function flameCells(s: Pick<Arena, 'grid'>, at: number, len: number): number[] {
  const out = [at];
  for (const [dc, dr] of Object.values(D)) {
    for (let k = 1; k <= len; k++) {
      const i = at + dc * k + dr * k * COLS;
      if (s.grid[i] === '#') break;
      out.push(i);
      if (s.grid[i] === '+') break;
    }
  }
  return out;
}

/** One step of the world for a set of actions (one per blaster; computer seats are filled in by the caller). */
export function stepArena(s0: Arena, actions: BlastAction[]): Arena {
  if (s0.over) return s0;
  let s: Arena = { ...s0, events: [], steps: s0.steps + 1 };
  if (s.pause > 0) {
    s.pause--;
    if (s.pause > 0) return s;
    const wins = s.blasters.map((b) => b.wins);
    if (wins.some((w) => w >= 2)) return { ...s, over: true, events: ['over'] };
    return { ...s, ...freshRound(s.rng, wins), round: s.round + 1, events: ['round'] };
  }
  const grid = s.grid.slice();
  let bombs = s.bombs.map((b) => ({ ...b }));
  const blasters = s.blasters.map((b) => ({ ...b }));
  // Walking and dropping bombs.
  blasters.forEach((b, i) => {
    if (!b.alive) return;
    const a = actions[i] ?? 'idle';
    if (b.to !== null) {
      b.left--;
      if (b.left <= 0) {
        b.at = b.to;
        b.to = null;
        const p = s.powers[b.at];
        if (p) {
          if (p === 'bomb') b.bombs++;
          if (p === 'flame') b.flame++;
          if (p === 'speed') b.pace = Math.max(8, b.pace - 2);
          s.powers = { ...s.powers };
          delete s.powers[b.at];
          if (i === 0) s.score += 50;
          s.events.push('power');
        }
      }
      return;
    }
    if (a === 'bomb') {
      const placed = bombs.filter((k) => k.owner === i).length;
      if (placed < b.bombs && !bombs.some((k) => k.at === b.at)) {
        bombs.push({ at: b.at, owner: i, fuse: FUSE, flame: b.flame });
        s.events.push('drop');
      }
    } else if (a !== 'idle') {
      const [dc, dr] = D[a];
      const n = b.at + dc + dr * COLS;
      b.facing = a;
      if (
        walkable({ grid, bombs }, n) &&
        !blasters.some((o, k) => k !== i && o.alive && (o.at === n || o.to === n))
      ) {
        b.to = n;
        b.left = b.pace;
      }
    }
  });
  // Fuses, and chains of bursts.
  const fire: Record<number, number> = {};
  for (const [k, v] of Object.entries(s.fire)) if (v > 1) fire[Number(k)] = v - 1;
  for (const b of bombs) b.fuse--;
  let burst = bombs.filter((b) => b.fuse <= 0 || fire[b.at] !== undefined);
  let playerBurst = false;
  while (burst.length) {
    const next: Bomb[] = [];
    for (const b of burst) {
      bombs = bombs.filter((k) => k !== b);
      if (b.owner === 0) playerBurst = true;
      s.events.push('boom');
      for (const c of flameCells({ grid }, b.at, b.flame)) {
        fire[c] = FLAME;
        if (grid[c] === '+') {
          grid[c] = ' ';
          if (b.owner === 0) {
            s.crates++;
            s.score += 10;
          }
        }
        const chained = bombs.find((k) => k.at === c && !next.includes(k));
        if (chained) next.push(chained);
      }
    }
    burst = next;
  }
  // Flame burns power-ups lying in the open, and blasters.
  const powers = { ...s.powers };
  for (const k of Object.keys(fire)) {
    const c = Number(k);
    if (powers[c] && grid[c] === ' ' && s.grid[c] === ' ') delete powers[c];
  }
  blasters.forEach((b, i) => {
    if (!b.alive) return;
    if (
      fire[b.at] !== undefined ||
      (b.to !== null && fire[b.to] !== undefined && b.left < b.pace / 2)
    ) {
      b.alive = false;
      s.events.push(i === 0 ? 'you-out' : 'out');
      // A rival caught as one of the player's bombs bursts counts as the player's.
      if (i !== 0 && playerBurst) {
        s.kills++;
        s.score += 200;
      }
    }
  });
  // The closing arena.
  if (s.time <= CLOSING && (CLOSING - s.time) % CLOSE_EVERY === 0) {
    const k = (CLOSING - s.time) / CLOSE_EVERY;
    const cell = SPIRAL[k];
    if (cell !== undefined) {
      grid[cell] = '#';
      delete powers[cell];
      bombs = bombs.filter((b) => b.at !== cell);
      s.events.push('close');
      blasters.forEach((b, i) => {
        if (b.alive && (b.at === cell || b.to === cell)) {
          b.alive = false;
          s.events.push(i === 0 ? 'you-out' : 'out');
        }
      });
    }
  }
  s = { ...s, grid, bombs, blasters, fire, powers };
  s.time--;
  const alive = blasters.map((b, i) => (b.alive ? i : -1)).filter((i) => i >= 0);
  if (alive.length <= 1 || s.time <= 0) {
    const winner = alive.length === 1 && s.time > 0 ? alive[0]! : -1;
    const blasters2 = blasters.map((b, i) => (i === winner ? { ...b, wins: b.wins + 1 } : b));
    const score = s.score + (winner === 0 ? 1000 : 0);
    return {
      ...s,
      blasters: blasters2,
      score,
      pause: 150,
      roundWinner: winner,
      events: [...s.events, winner === 0 ? 'round-won' : winner < 0 ? 'round-draw' : 'round-lost'],
    };
  }
  return s;
}

// ---- Players ----

/** When each cell will burn: the steps from now until it catches fire (Infinity: never) and until it goes out. */
export function dangerMap(s: Pick<Arena, 'grid' | 'bombs' | 'fire'>): {
  from: number[];
  to: number[];
} {
  const from = new Array<number>(COLS * ROWS).fill(Infinity);
  const to = new Array<number>(COLS * ROWS).fill(-Infinity);
  for (const [k, v] of Object.entries(s.fire)) {
    from[Number(k)] = 0;
    to[Number(k)] = v;
  }
  // Chains: a bomb in another's flame goes off with it.
  const fuse = new Map(s.bombs.map((b) => [b.at, b.fuse]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const b of s.bombs) {
      const f = fuse.get(b.at)!;
      for (const c of flameCells(s, b.at, b.flame)) {
        if (fuse.has(c) && fuse.get(c)! > f) {
          fuse.set(c, f);
          changed = true;
        }
      }
    }
  }
  for (const b of s.bombs) {
    const f = fuse.get(b.at)!;
    for (const c of flameCells(s, b.at, b.flame)) {
      from[c] = Math.min(from[c]!, f);
      to[c] = Math.max(to[c]!, f + FLAME);
    }
  }
  return { from, to };
}

type Danger = ReturnType<typeof dangerMap>;

/** Marks the cells the closing arena will fill in the next few seconds as burning from then on. */
function withClosing(s: Pick<Arena, 'time'>, d: Danger): Danger {
  if (s.time > CLOSING + 300) return d;
  const from = d.from.slice();
  const to = d.to.slice();
  const done = Math.max(0, Math.floor((CLOSING - s.time) / CLOSE_EVERY));
  for (let k = done; k < Math.min(SPIRAL.length, done + 24); k++) {
    const at = (CLOSING - s.time) % CLOSE_EVERY;
    const when = Math.max(0, (k - done) * CLOSE_EVERY - at);
    from[SPIRAL[k]!] = Math.min(from[SPIRAL[k]!]!, when);
    to[SPIRAL[k]!] = Infinity;
  }
  return { from, to };
}
const safeForever = (d: Danger, c: number) => d.from[c] === Infinity;

/** The first move towards the nearest cell meeting `goal`, through cells that are not burning while we pass. */
function route(
  s: Arena,
  i: number,
  goal: (c: number) => boolean,
  danger: Danger,
  strict = false,
): BlastAction | null {
  const me = s.blasters[i]!;
  // Other blasters block the way.
  const taken = new Set(
    s.blasters.flatMap((b, k) =>
      k !== i && b.alive ? [b.at, ...(b.to !== null ? [b.to] : [])] : [],
    ),
  );
  const start = me.at;
  const pace = me.pace;
  const prev = new Map<number, [number, BlastAction, number]>([[start, [-1, 'idle', 0]]]);
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q]!;
    const t = prev.get(c)![2];
    if (goal(c)) {
      if (c === start) return 'idle';
      let k = c;
      while (prev.get(k)![0] !== start) k = prev.get(k)![0];
      return prev.get(k)![1];
    }
    for (const [a, [dc, dr]] of Object.entries(D) as [BlastAction, [number, number]][]) {
      const n = c + dc + dr * COLS;
      if (prev.has(n) || s.grid[n] !== ' ' || s.bombs.some((b) => b.at === n) || taken.has(n))
        continue;
      // Unhurried travel keeps out of every cell that is going to burn.
      if (strict && !safeForever(danger, n)) continue;
      const arrive = t + pace;
      // In the cell from half-way through walking in until half-way through walking on.
      const enter = t + pace / 2 - 2;
      const leave = arrive + pace / 2 + 2;
      if (danger.from[n]! <= leave && danger.to[n]! >= enter) continue;
      prev.set(n, [c, a, arrive]);
      queue.push(n);
    }
  }
  return null;
}

/**
 * A tactician: flees any cell that will burn, by a route that is not itself burning; drops a bomb
 * next to a crate or with a rival in line within its flame when a safe cell is still reachable
 * afterwards; otherwise heads for the nearest power-up, crate or rival.
 */
export function tacticianFor(s: Arena, i: number): BlastAction {
  const me = s.blasters[i]!;
  if (!me.alive || me.to !== null || s.pause || s.over) return 'idle';
  const danger = withClosing(s, dangerMap(s));
  if (!safeForever(danger, me.at))
    return route(s, i, (c) => safeForever(danger, c), danger) ?? 'idle';
  const rivals = s.blasters.filter((b, k) => k !== i && b.alive).map((b) => b.at);
  const placed = s.bombs.filter((b) => b.owner === i).length;
  const reach = flameCells(s, me.at, me.flame);
  const worth = reach.some((c) => s.grid[c] === '+') || reach.some((c) => rivals.includes(c));
  if (worth && placed < me.bombs) {
    // Would there be a way out?
    const withBomb = withClosing(
      s,
      dangerMap({
        ...s,
        bombs: [...s.bombs, { at: me.at, owner: i, fuse: FUSE, flame: me.flame }],
      }),
    );
    if (route(s, i, (c) => safeForever(withBomb, c), withBomb) !== null) return 'bomb';
  }
  const goal = (c: number) => s.powers[c] !== undefined && s.grid[c] === ' ';
  const toPower = route(s, i, goal, danger, true);
  if (toPower && toPower !== 'idle') return toPower;
  // Next to a crate or a rival.
  const near = (c: number) =>
    [c - 1, c + 1, c - COLS, c + COLS].some((n) => s.grid[n] === '+' || rivals.includes(n));
  const toWork = route(s, i, (c) => c !== me.at && near(c) && safeForever(danger, c), danger, true);
  return toWork ?? 'idle';
}

/** A rookie: wanders at random and drops bombs at random, but still runs from flame. */
export function rookieFor(s: Arena, i: number): BlastAction {
  const me = s.blasters[i]!;
  if (!me.alive || me.to !== null || s.pause || s.over) return 'idle';
  const danger = withClosing(s, dangerMap(s));
  if (!safeForever(danger, me.at))
    return route(s, i, (c) => safeForever(danger, c), danger) ?? 'idle';
  // A cheap hash of the step for "randomness" (players must not touch the game's generator).
  const h = (s.steps * 2654435761 + i * 40503) >>> 0;
  if (h % 9 === 0) {
    const withBomb = withClosing(
      s,
      dangerMap({
        ...s,
        bombs: [...s.bombs, { at: me.at, owner: i, fuse: FUSE, flame: me.flame }],
      }),
    );
    if (route(s, i, (c) => safeForever(withBomb, c), withBomb) !== null) return 'bomb';
  }
  const moves: BlastAction[] = ['up', 'down', 'left', 'right'];
  return moves[h % 4]!;
}

/** The player's game: seat 0 acts, seats 1–3 are tacticians. */
export function stepWithComputers(s: Arena, action: BlastAction): Arena {
  return stepArena(s, [action, tacticianFor(s, 1), tacticianFor(s, 2), tacticianFor(s, 3)]);
}

export function isArena(d: unknown): d is Arena {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Arena;
  return (
    Array.isArray(s.rng) &&
    Array.isArray(s.grid) &&
    s.grid.length === COLS * ROWS &&
    Array.isArray(s.blasters) &&
    s.blasters.length === SEATS &&
    Number.isFinite(s.score)
  );
}
