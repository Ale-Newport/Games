/**
 * Maze chase, shared by #176 and #177: eat every dot in a maze while four chasers hunt you, at 60
 * steps a second. Positions are in eighths of a tile; turns happen at tile centres (a turn you ask
 * for early waits there). Power pellets turn the chasers blue for a few seconds: they slow, wander,
 * and can be eaten for 200, 400, 800 and 1600; their eyes then race home to revive. The chasers
 * alternate between scattering to their corners and chasing, each in its own way: the Hunter heads
 * for your tile, the Cutter for four tiles ahead of you, the Flanker for the point that puts you
 * between it and the Hunter, the Wanderer chases from afar but wanders off when close. They leave
 * the house in turn as you eat. A bonus fruit appears twice a level. Three lives, one more at
 * 10 000; clearing the maze starts the next level, faster and with shorter blue time.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';
import { COLS, generateMaze, idx, ROWS, type Maze } from './layout';

export const SUB = 8;
const CENTRE = SUB / 2;
export type Dir = 'up' | 'down' | 'left' | 'right';
export type MazeAction = Dir | 'idle';
export const ACTIONS: readonly MazeAction[] = ['up', 'down', 'left', 'right', 'idle'];
const D: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const REVERSE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const ORDER: Dir[] = ['up', 'left', 'down', 'right'];

export interface MazeRules {
  id: string;
  /** Maze seeds, cycled every `mazeEvery` levels. */
  mazes: number[];
  mazeEvery: number;
  /** Chasers sometimes turn at random at junctions (advanced). */
  jitter: boolean;
  /** The bonus fruit wanders through the maze (advanced) instead of waiting. */
  wanderingFruit: boolean;
}

export const CLASSIC_RULES: MazeRules = {
  id: 'maze-chase',
  mazes: [7],
  mazeEvery: 99,
  jitter: false,
  wanderingFruit: false,
};
export const ADVANCED_RULES: MazeRules = {
  id: 'maze-chase-advanced',
  mazes: [11, 23, 37, 53],
  mazeEvery: 2,
  jitter: true,
  wanderingFruit: true,
};

export interface Mover {
  x: number;
  y: number;
  dir: Dir;
  budget: number;
}

export type ChaserMode = 'house' | 'leaving' | 'active' | 'frightened' | 'eyes';

export interface Chaser extends Mover {
  mode: ChaserMode;
  /** Dots to eat before this chaser leaves the house. */
  release: number;
}

export interface MazeGame {
  rules: string;
  rng: RngState;
  level: number;
  maze: Maze;
  dots: boolean[];
  left: number;
  eaten: number;
  player: Mover & { want: Dir };
  chasers: Chaser[];
  /** Index into the scatter/chase schedule and steps left in it. */
  phase: number;
  phaseLeft: number;
  fright: number;
  combo: number;
  fruit: (Mover & { value: number; left: number }) | null;
  fruitsShown: number;
  lives: number;
  extraGiven: boolean;
  score: number;
  /** Steps since the last dot (frees a chaser when nothing is eaten for a while). */
  idle: number;
  /** Death animation countdown, or the pause after clearing a level. */
  dying: number;
  clearing: number;
  over: boolean;
  events: string[];
  steps: number;
}

/** Scatter (even) and chase (odd) durations, in steps; the last chase lasts forever. */
const SCHEDULE = [7, 20, 7, 20, 5, 20, 5].map((s) => s * 60);
const FRUITS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export const tileOf = (m: Pick<Mover, 'x' | 'y'>) =>
  idx(Math.floor(m.x / SUB), Math.floor(m.y / SUB));
const atCentre = (m: Mover) =>
  ((m.x % SUB) + SUB) % SUB === CENTRE && ((m.y % SUB) + SUB) % SUB === CENTRE;
const place = (tile: number): Pick<Mover, 'x' | 'y'> => ({
  x: (tile % COLS) * SUB + CENTRE,
  y: Math.floor(tile / COLS) * SUB + CENTRE,
});

/** The tile next to `tile` in a direction (the tunnel row wraps). */
export function step(tile: number, d: Dir): number | null {
  let x = (tile % COLS) + D[d][0];
  const y = Math.floor(tile / COLS) + D[d][1];
  if (y < 0 || y >= ROWS) return null;
  if (x < 0) x = COLS - 1;
  if (x >= COLS) x = 0;
  return idx(x, y);
}

const playerOpen = (m: Maze, t: number | null) =>
  t !== null && (m.tiles[t] === 'path' || m.tiles[t] === 'tunnel');
const chaserOpen = (m: Maze, t: number | null, mode: ChaserMode) =>
  t !== null &&
  (m.tiles[t] === 'path' ||
    m.tiles[t] === 'tunnel' ||
    ((mode === 'eyes' || mode === 'leaving' || mode === 'house') &&
      (m.tiles[t] === 'door' || m.tiles[t] === 'house')));

function mazeFor(rules: MazeRules, level: number): Maze {
  return generateMaze(rules.mazes[Math.floor((level - 1) / rules.mazeEvery) % rules.mazes.length]!);
}

function startPositions(g: Pick<MazeGame, 'maze' | 'level'>): Pick<MazeGame, 'player' | 'chasers'> {
  const m = g.maze;
  const p = place(m.playerStart);
  const hc = m.houseCentre;
  const early = g.level > 1;
  return {
    player: { ...p, dir: 'left', want: 'left', budget: 0 },
    chasers: [
      { ...place(m.exit), dir: 'left', budget: 0, mode: 'active', release: 0 },
      { ...place(hc), dir: 'up', budget: 0, mode: 'house', release: 0 },
      { ...place(hc - 1), dir: 'up', budget: 0, mode: 'house', release: early ? 10 : 30 },
      { ...place(hc + 1), dir: 'up', budget: 0, mode: 'house', release: early ? 30 : 60 },
    ],
  };
}

function freshLevel(
  rules: MazeRules,
  level: number,
  carry: Pick<MazeGame, 'rng' | 'lives' | 'score' | 'extraGiven'>,
): Omit<MazeGame, 'rules' | 'events' | 'steps' | 'over'> {
  const maze = mazeFor(rules, level);
  const dots = maze.tiles.map((t, i) => t === 'path' && i !== maze.playerStart && i !== maze.exit);
  return {
    ...carry,
    level,
    maze,
    dots,
    left: dots.filter(Boolean).length,
    eaten: 0,
    ...startPositions({ maze, level }),
    phase: 0,
    phaseLeft: SCHEDULE[0]!,
    fright: 0,
    combo: 0,
    fruit: null,
    fruitsShown: 0,
    idle: 0,
    dying: 0,
    clearing: 0,
  };
}

export function newMazeGame(rules: MazeRules, seed: number): MazeGame {
  return {
    rules: rules.id,
    ...freshLevel(rules, 1, { rng: seedRng(seed >>> 0), lives: 3, score: 0, extraGiven: false }),
    over: false,
    events: [],
    steps: 0,
  };
}

/** Steps of blue time by level. */
const frightSteps = (level: number) => Math.max(60, 360 - (level - 1) * 45);
/** Speeds in eighths of a tile per step. */
const speed = (
  level: number,
  kind: 'player' | 'chaser' | 'fright' | 'eyes' | 'tunnel' | 'house',
) => {
  const lv = Math.min(level - 1, 6) * 0.03;
  return {
    player: 0.95 + lv,
    chaser: 0.88 + lv * 1.2,
    fright: 0.55,
    eyes: 2,
    tunnel: 0.45,
    house: 0.5,
  }[kind];
};

/** Where each chaser is heading now. */
export function targetOf(g: MazeGame, i: number): number {
  const c = g.chasers[i]!;
  const m = g.maze;
  if (c.mode === 'eyes') return m.exit;
  const scatter = g.phase % 2 === 0 && g.phase < SCHEDULE.length;
  if (scatter) return m.corners[i]!;
  const pt = tileOf(g.player);
  const px = pt % COLS;
  const py = Math.floor(pt / COLS);
  const clampT = (x: number, y: number) =>
    idx(Math.max(0, Math.min(COLS - 1, x)), Math.max(0, Math.min(ROWS - 1, y)));
  const [dx, dy] = D[g.player.dir];
  if (i === 0) return pt;
  if (i === 1) return clampT(px + dx * 4, py + dy * 4);
  if (i === 2) {
    const h = tileOf(g.chasers[0]!);
    const ax = px + dx * 2;
    const ay = py + dy * 2;
    return clampT(2 * ax - (h % COLS), 2 * ay - Math.floor(h / COLS));
  }
  const ct = tileOf(c);
  const far = Math.hypot((ct % COLS) - px, Math.floor(ct / COLS) - py) > 8;
  return far ? pt : m.corners[3]!;
}

function moveOne(m: Mover, d: Dir) {
  m.x += D[d][0];
  m.y += D[d][1];
  const w = COLS * SUB;
  if (m.x < 0) m.x += w;
  if (m.x >= w) m.x -= w;
}

export function stepMaze(rules: MazeRules, g0: MazeGame, action: MazeAction): MazeGame {
  if (g0.over) return g0;
  const g: MazeGame = {
    ...g0,
    dots: g0.dots,
    player: { ...g0.player },
    chasers: g0.chasers.map((c) => ({ ...c })),
    fruit: g0.fruit ? { ...g0.fruit } : null,
    events: [],
    steps: g0.steps + 1,
  };
  let rng = g.rng;
  const m = g.maze;

  if (g.clearing > 0) {
    g.clearing--;
    if (g.clearing === 0) return { ...g, ...freshLevel(rules, g.level + 1, g), events: ['level'] };
    return g;
  }
  if (g.dying > 0) {
    g.dying--;
    if (g.dying === 0) {
      if (g.lives <= 0) return { ...g, over: true, events: ['over'] };
      return { ...g, ...startPositions(g), phase: 0, phaseLeft: SCHEDULE[0]!, fright: 0 };
    }
    return g;
  }

  // The player: turn at centres (an early request waits), stop at walls.
  if (action !== 'idle') g.player.want = action;
  const pl = g.player;
  pl.budget +=
    m.tiles[tileOf(pl)] === 'tunnel' ? speed(g.level, 'tunnel') : speed(g.level, 'player');
  // Reversing is allowed at once.
  if (pl.want === REVERSE[pl.dir]) pl.dir = pl.want;
  while (pl.budget >= 1) {
    pl.budget -= 1;
    if (atCentre(pl)) {
      const t = tileOf(pl);
      if (playerOpen(m, step(t, pl.want))) pl.dir = pl.want;
      if (!playerOpen(m, step(t, pl.dir))) {
        pl.budget = 0;
        break;
      }
    }
    moveOne(pl, pl.dir);
  }

  // Eating.
  const pt = tileOf(pl);
  if (g.dots[pt]) {
    g.dots = g.dots.map((v, i) => (i === pt ? false : v));
    g.left--;
    g.eaten++;
    g.idle = 0;
    const pellet = m.pellets.includes(pt);
    g.score += pellet ? 50 : 10;
    g.events.push(pellet ? 'pellet' : 'dot');
    if (pellet) {
      g.fright = frightSteps(g.level);
      g.combo = 0;
      for (const c of g.chasers)
        if (c.mode === 'active' || c.mode === 'frightened') {
          if (c.mode === 'active') c.dir = REVERSE[c.dir];
          c.mode = 'frightened';
        }
    }
  } else g.idle++;

  // The bonus fruit, twice a level.
  if ((g.eaten === 70 || g.eaten === 170) && g.fruitsShown < (g.eaten === 70 ? 1 : 2) && !g.fruit) {
    g.fruit = {
      ...place(rules.wanderingFruit ? m.tunnelRow * COLS : m.playerStart - 2 * COLS),
      dir: 'right',
      budget: 0,
      value: FRUITS[Math.min(g.level - 1, FRUITS.length - 1)]!,
      left: 570,
    };
    g.fruitsShown++;
    g.events.push('fruit');
  }
  if (g.fruit) {
    g.fruit.left--;
    if (rules.wanderingFruit) {
      g.fruit.budget += 0.5;
      while (g.fruit.budget >= 1) {
        g.fruit.budget -= 1;
        if (atCentre(g.fruit)) {
          const t = tileOf(g.fruit);
          const opts = ORDER.filter(
            (d) => d !== REVERSE[g.fruit!.dir] && playerOpen(m, step(t, d)),
          );
          const [r, n] = rand(rng);
          rng = n;
          if (opts.length) g.fruit.dir = opts[Math.floor(r * opts.length)]!;
        }
        moveOne(g.fruit, g.fruit.dir);
      }
    }
    if (tileOf(g.fruit) === pt) {
      g.score += g.fruit.value;
      g.events.push('fruit-eaten');
      g.fruit = null;
    } else if (g.fruit.left <= 0) g.fruit = null;
  }

  // Modes: blue time, then the scatter/chase schedule.
  if (g.fright > 0) {
    g.fright--;
    if (g.fright === 0) for (const c of g.chasers) if (c.mode === 'frightened') c.mode = 'active';
  } else if (g.phase < SCHEDULE.length) {
    g.phaseLeft--;
    if (g.phaseLeft <= 0) {
      g.phase++;
      g.phaseLeft = SCHEDULE[g.phase] ?? Infinity;
      for (const c of g.chasers) if (c.mode === 'active') c.dir = REVERSE[c.dir];
    }
  }

  // Releasing chasers from the house: by dots eaten, or when no dot has been eaten for four seconds.
  for (const c of g.chasers) {
    if (c.mode !== 'house') continue;
    if (g.eaten >= c.release || g.idle > 240) {
      c.mode = 'leaving';
      g.idle = 0;
      break;
    }
  }

  // Chasers.
  g.chasers.forEach((c, i) => {
    const t0 = tileOf(c);
    const kind =
      c.mode === 'eyes'
        ? 'eyes'
        : c.mode === 'frightened'
          ? 'fright'
          : c.mode === 'house' || c.mode === 'leaving'
            ? 'house'
            : m.tiles[t0] === 'tunnel'
              ? 'tunnel'
              : 'chaser';
    c.budget += speed(g.level, kind);
    if (c.mode === 'house') {
      // Bobbing in place.
      c.budget = 0;
      return;
    }
    while (c.budget >= 1) {
      c.budget -= 1;
      if (atCentre(c)) {
        const t = tileOf(c);
        if (c.mode === 'leaving') {
          if (t === m.exit) {
            c.mode = g.fright > 0 ? 'frightened' : 'active';
            c.dir = 'left';
          } else c.dir = t % COLS < 9 ? 'right' : t % COLS > 9 ? 'left' : 'up';
        } else if (c.mode === 'eyes' && t === m.houseCentre) {
          c.mode = 'leaving';
          continue;
        } else if (
          c.mode === 'eyes' &&
          (t === m.exit || m.tiles[t] === 'door' || m.tiles[t] === 'house')
        ) {
          // Straight down through the door to the middle of the house.
          c.dir = 'down';
        } else {
          let opts = ORDER.filter(
            (d) =>
              d !== REVERSE[c.dir] &&
              chaserOpen(m, step(t, d), c.mode) &&
              (c.mode === 'eyes' || m.tiles[step(t, d)!] !== 'door'),
          );
          if (!opts.length) opts = [REVERSE[c.dir]];
          if (c.mode === 'frightened') {
            const [r, n] = rand(rng);
            rng = n;
            c.dir = opts[Math.floor(r * opts.length)]!;
          } else {
            let jitter = false;
            if (rules.jitter && opts.length > 1) {
              const [r, n] = rand(rng);
              rng = n;
              jitter = r < 0.12;
            }
            if (jitter) {
              const [r, n] = rand(rng);
              rng = n;
              c.dir = opts[Math.floor(r * opts.length)]!;
            } else {
              // The way that is shortest through the corridors to the target (straight-line
              // distance can leave a chaser circling a block for ever).
              const tg = targetOf(g, i);
              const tx = tg % COLS;
              const ty = Math.floor(tg / COLS);
              const reach = distances(
                nearestOpen(m, tg),
                (k) => chaserOpen(m, k, c.mode) && (c.mode === 'eyes' || m.tiles[k] !== 'door'),
              );
              let best = opts[0]!;
              let bd = Infinity;
              for (const d of opts) {
                const n = step(t, d)!;
                const r = reach[n]!;
                const dist =
                  (r >= 0 ? r : 999) * 1000 +
                  ((n % COLS) - tx) ** 2 +
                  (Math.floor(n / COLS) - ty) ** 2;
                if (dist < bd) {
                  bd = dist;
                  best = d;
                }
              }
              c.dir = best;
            }
          }
        }
      }
      moveOne(c, c.dir);
    }
  });

  // Meeting the chasers.
  for (const c of g.chasers) {
    if (Math.abs(c.x - pl.x) + Math.abs(c.y - pl.y) > 5) continue;
    if (c.mode === 'frightened') {
      g.combo++;
      g.score += 200 * 2 ** (g.combo - 1);
      c.mode = 'eyes';
      g.events.push('chaser-eaten');
    } else if (c.mode === 'active') {
      g.lives--;
      g.dying = 100;
      g.events.push('caught');
      break;
    }
  }

  if (!g.extraGiven && g.score >= 10000) {
    g.lives++;
    g.extraGiven = true;
    g.events.push('extra');
  }
  if (g.left === 0 && g.dying === 0) {
    g.clearing = 120;
    g.events.push('cleared');
  }
  return { ...g, rng };
}

/** The open tile nearest to a target that may be a wall (targets ahead of the player can be). */
function nearestOpen(m: Maze, t: number): number {
  if (m.tiles[t] === 'path' || m.tiles[t] === 'tunnel') return t;
  const tx = t % COLS;
  const ty = Math.floor(t / COLS);
  let best = m.exit;
  let bd = Infinity;
  for (let k = 0; k < m.tiles.length; k++) {
    if (m.tiles[k] !== 'path') continue;
    const d = ((k % COLS) - tx) ** 2 + (Math.floor(k / COLS) - ty) ** 2;
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

/** Breadth-first distances over tiles a mover may use, from a start tile. */
export function distances(from: number, open: (t: number) => boolean): Int16Array {
  const dist = new Int16Array(COLS * ROWS).fill(-1);
  dist[from] = 0;
  const queue = [from];
  for (let qi = 0; qi < queue.length; qi++) {
    const t = queue[qi]!;
    for (const d of ORDER) {
      const n = step(t, d);
      if (n !== null && dist[n] === -1 && open(n)) {
        dist[n] = dist[t]! + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

/**
 * A player: at each junction it weighs every way it can go by how much sooner it reaches the
 * nearest dot (pellets count more when chasers are close, blue chasers are worth chasing) against
 * how much sooner than it a chaser could reach the next tile.
 */
export function runnerPolicy(g: MazeGame): MazeAction {
  if (g.dying || g.clearing) return 'idle';
  const m = g.maze;
  const here = tileOf(g.player);
  const playerCan = (t: number) => playerOpen(m, t);
  const threats = g.chasers.filter(
    (c) => c.mode === 'active' || (c.mode === 'leaving' && tileOf(c) === m.exit),
  );
  const threatDist = threats.map((c) => distances(tileOf(c), playerCan));
  const blue = g.chasers.filter((c) => c.mode === 'frightened');
  let best: Dir = g.player.dir;
  let bestScore = -Infinity;
  for (const d of ORDER) {
    const n = step(here, d);
    if (n === null || !playerCan(n)) continue;
    const from = distances(n, playerCan);
    // Safety: how many steps ahead of the nearest chaser we would be at the next tile.
    let margin = 20;
    for (const td of threatDist) if (td[n]! >= 0) margin = Math.min(margin, td[n]! - 1);
    let food = 99;
    for (let t = 0; t < g.dots.length; t++)
      if (g.dots[t] && from[t]! >= 0)
        food = Math.min(
          food,
          from[t]! -
            (m.pellets.includes(t) && threats.some((c, k) => threatDist[k]![here]! < 6 && c)
              ? 4
              : 0),
        );
    let hunt = 0;
    for (const c of blue) {
      const dd = from[tileOf(c)]!;
      if (dd >= 0 && dd < g.fright / 8) hunt = Math.max(hunt, 30 - dd);
    }
    const fruit = g.fruit ? Math.max(0, 15 - (from[tileOf(g.fruit)] ?? 99)) : 0;
    const score =
      -food * 2 +
      hunt * 3 +
      fruit +
      (margin < 2 ? -400 : margin < 4 ? -60 : Math.min(margin, 8) * 2) +
      (d === g.player.dir ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** A simple player: goes for the nearest dot and ignores the chasers. */
export function grazerPolicy(g: MazeGame): MazeAction {
  if (g.dying || g.clearing) return 'idle';
  const m = g.maze;
  const here = tileOf(g.player);
  let best: Dir = g.player.dir;
  let bd = Infinity;
  for (const d of ORDER) {
    const n = step(here, d);
    if (n === null || !playerOpen(m, n)) continue;
    const from = distances(n, (t) => playerOpen(m, t));
    let food = 999;
    for (let t = 0; t < g.dots.length; t++)
      if (g.dots[t] && from[t]! >= 0) food = Math.min(food, from[t]!);
    if (food < bd) {
      bd = food;
      best = d;
    }
  }
  return best;
}

export function isMazeGame(d: unknown, rules: MazeRules): d is MazeGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as MazeGame;
  return (
    s.rules === rules.id &&
    Array.isArray(s.rng) &&
    Array.isArray(s.dots) &&
    Array.isArray(s.chasers) &&
    s.chasers.length === 4 &&
    Number.isFinite(s.score)
  );
}
