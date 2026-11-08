/**
 * Wanderer Rescue: a puzzle platformer in the style of the classic "lead the walkers home" games,
 * with an original name, look and levels. Little wanderers drop from a hatch and walk on their
 * own, turning at walls, climbing small steps and falling off edges (a long fall is fatal, as is
 * water). The player hands out a limited number of skills to individual wanderers — climber,
 * floater, blocker, digger, basher, builder — to get enough of them to the exit. The terrain is a
 * grid of 4 px cells: earth can be dug, bashed and built; steel cannot. Six levels.
 *
 * Time runs at 60 steps a second; the wanderers move on every fourth step (a "tick").
 */

export const COLS = 80;
export const ROWS = 45;
export const CELL = 4;
export const W = COLS * CELL;
export const BAR = 30;
export const H = ROWS * CELL + BAR;
export const TICK = 4;
/** Falling further than this many cells is fatal (unless floating). */
export const SPLAT = 16;
const BRICKS = 12;
/** Ticks a level may last (two minutes). */
export const LIMIT = 1800;

export const AIR = 0;
export const EARTH = 1;
export const STEEL = 2;
export const WATER = 3;

export const SKILLS = ['climb', 'float', 'block', 'dig', 'bash', 'build'] as const;
export type Skill = (typeof SKILLS)[number];

export type WalkerState = 'walk' | 'fall' | 'climb' | 'block' | 'dig' | 'bash' | 'build';

export interface Walker {
  x: number;
  /** The cell the feet are in; the walker fills it and the one above. */
  y: number;
  dir: 1 | -1;
  state: WalkerState;
  climber: boolean;
  floater: boolean;
  fall: number;
  /** Bricks left (builder) or ticks into the job. */
  work: number;
  status: 'out' | 'saved' | 'dead';
}

type Rect = [x: number, y: number, w: number, h: number, kind: number];

export interface LevelDef {
  name: { en: string; es: string };
  hatch: [number, number];
  exit: [number, number];
  walkers: number;
  need: number;
  /** Ticks between wanderers dropping from the hatch. */
  rate: number;
  skills: Partial<Record<Skill, number>>;
  terrain: Rect[];
}

const BORDER: Rect[] = [
  [0, 0, 2, ROWS, STEEL],
  [COLS - 2, 0, 2, ROWS, STEEL],
];

/** The six levels (original layouts). */
export const LEVELS: readonly LevelDef[] = [
  {
    name: { en: 'Mind the Gap', es: 'Cuidado con el hueco' },
    hatch: [8, 26],
    exit: [70, 35],
    walkers: 10,
    need: 7,
    rate: 30,
    skills: { build: 2 },
    terrain: [...BORDER, [2, 36, 32, 9, EARTH], [46, 36, 32, 9, EARTH], [34, 43, 12, 2, WATER]],
  },
  {
    name: { en: 'Dig Deep', es: 'Cava hondo' },
    hatch: [10, 14],
    exit: [60, 35],
    walkers: 10,
    need: 9,
    rate: 25,
    skills: { dig: 2 },
    terrain: [...BORDER, [2, 22, 76, 6, EARTH], [2, 36, 76, 9, EARTH]],
  },
  {
    name: { en: 'Brick Wall', es: 'Muro de ladrillo' },
    hatch: [8, 26],
    exit: [70, 35],
    walkers: 10,
    need: 9,
    rate: 25,
    skills: { bash: 2 },
    terrain: [...BORDER, [2, 36, 76, 9, EARTH], [40, 20, 5, 16, EARTH]],
  },
  {
    name: { en: 'Turn Back', es: 'Media vuelta' },
    hatch: [24, 26],
    exit: [6, 35],
    walkers: 10,
    need: 8,
    rate: 25,
    skills: { block: 1, bash: 1, build: 1 },
    terrain: [...BORDER, [2, 36, 54, 9, EARTH], [56, 43, 22, 2, WATER], [12, 28, 3, 8, EARTH]],
  },
  {
    name: { en: 'Long Way Down', es: 'Larga caída' },
    hatch: [8, 6],
    exit: [60, 39],
    walkers: 8,
    need: 6,
    rate: 30,
    skills: { float: 8 },
    terrain: [...BORDER, [2, 14, 28, 4, EARTH], [2, 40, 76, 5, EARTH]],
  },
  {
    name: { en: 'Final Exam', es: 'Examen final' },
    hatch: [8, 10],
    exit: [72, 35],
    walkers: 15,
    need: 10,
    rate: 25,
    skills: { climb: 2, float: 2, block: 1, dig: 1, bash: 1, build: 1 },
    terrain: [
      ...BORDER,
      [2, 20, 29, 4, EARTH],
      [31, 8, 2, 16, STEEL],
      [2, 36, 39, 9, EARTH],
      [51, 36, 27, 9, EARTH],
      [41, 43, 10, 2, WATER],
      [62, 24, 3, 12, EARTH],
    ],
  },
];

export interface Level {
  index: number;
  grid: number[];
  walkers: Walker[];
  skills: Record<Skill, number>;
  /** Wanderers still to drop from the hatch. */
  toCome: number;
  ticks: number;
  saved: number;
  dead: number;
  done: boolean;
}

export interface Rescue {
  level: Level;
  /** Lives: a failed level costs one. */
  lives: number;
  /** The skill handed out on a tap (or Space). */
  skill: Skill;
  /** The highlighted wanderer for keyboard play (an index into the walkers). */
  cursor: number;
  /** Steps until a held key may change the skill or the highlight again. */
  cool: number;
  totalSaved: number;
  cleared: number;
  score: number;
  /** Steps of the pause after a level ends (won or lost). */
  pause: number;
  won: boolean | null;
  over: boolean;
  victory: boolean;
  events: string[];
  steps: number;
}

export type RescueAction =
  | 'idle'
  | 'prev'
  | 'next'
  | 'up'
  | 'down'
  | 'assign'
  | 'end'
  | `pick-${Skill}`
  | `give-${Skill}-${number}`;
export const MAX_WALKERS = 15;
export const ACTIONS: readonly RescueAction[] = [
  'idle',
  'prev',
  'next',
  'up',
  'down',
  'assign',
  'end',
  ...SKILLS.map((k) => `pick-${k}` as const),
  ...SKILLS.flatMap((k) =>
    Array.from({ length: MAX_WALKERS }, (_, i) => `give-${k}-${i}` as const),
  ),
];

export function newLevel(index: number): Level {
  const def = LEVELS[index]!;
  const grid = Array<number>(COLS * ROWS).fill(AIR);
  for (const [x0, y0, w, h, kind] of def.terrain)
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++)
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) grid[y * COLS + x] = kind;
  const skills = Object.fromEntries(SKILLS.map((k) => [k, def.skills[k] ?? 0])) as Record<
    Skill,
    number
  >;
  return {
    index,
    grid,
    walkers: [],
    skills,
    toCome: def.walkers,
    ticks: 0,
    saved: 0,
    dead: 0,
    done: false,
  };
}

export function newRescue(_seed: number, start = 0): Rescue {
  return {
    level: newLevel(start),
    lives: 3,
    skill: 'build',
    cursor: 0,
    cool: 0,
    totalSaved: 0,
    cleared: start,
    score: 0,
    pause: 0,
    won: null,
    over: false,
    victory: false,
    events: [],
    steps: 0,
  };
}

export const cellAt = (lv: Pick<Level, 'grid'>, x: number, y: number) =>
  x < 0 || x >= COLS ? STEEL : y < 0 ? AIR : y >= ROWS ? AIR : lv.grid[y * COLS + x]!;
const solid = (lv: Level, x: number, y: number) => {
  const c = cellAt(lv, x, y);
  return c === EARTH || c === STEEL;
};
const free = (lv: Level, x: number, y: number) => !solid(lv, x, y);
const setCell = (lv: Level, x: number, y: number, v: number) => {
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) lv.grid[y * COLS + x] = v;
};
const earth = (lv: Level, x: number, y: number) => cellAt(lv, x, y) === EARTH;

/** Whether a blocker stands in the way of a wanderer moving into column `x` at feet `y`. */
const blockerAt = (lv: Level, self: Walker, x: number, y: number) =>
  lv.walkers.some(
    (o) =>
      o !== self &&
      o.status === 'out' &&
      o.state === 'block' &&
      o.x === x &&
      Math.abs(o.y - y) <= 1,
  );

function walk(lv: Level, w: Walker) {
  if (free(lv, w.x, w.y + 1)) {
    w.state = 'fall';
    w.fall = 0;
    return;
  }
  const nx = w.x + w.dir;
  if (blockerAt(lv, w, nx, w.y)) {
    w.dir = w.dir === 1 ? -1 : 1;
    return;
  }
  if (free(lv, nx, w.y) && free(lv, nx, w.y - 1)) {
    w.x = nx;
    return;
  }
  // Small steps up (one or two cells) are climbed on the way.
  for (let up = 1; up <= 2; up++)
    if (free(lv, nx, w.y - up) && free(lv, nx, w.y - up - 1) && free(lv, w.x, w.y - up - 1)) {
      w.x = nx;
      w.y -= up;
      return;
    }
  if (w.climber) {
    w.state = 'climb';
    return;
  }
  w.dir = w.dir === 1 ? -1 : 1;
}

function tickWalker(lv: Level, w: Walker) {
  if (w.y >= ROWS || cellAt(lv, w.x, w.y) === WATER) {
    w.status = 'dead';
    lv.dead++;
    return;
  }
  switch (w.state) {
    case 'fall':
      if (free(lv, w.x, w.y + 1)) {
        if (cellAt(lv, w.x, w.y + 1) === WATER || w.y + 1 >= ROWS) {
          w.y++;
          w.status = 'dead';
          lv.dead++;
          return;
        }
        // A floater drifts down one cell every other tick.
        if (!w.floater || lv.ticks % 2 === 0) {
          w.y++;
          w.fall++;
        }
      } else if (w.fall > SPLAT && !w.floater) {
        w.status = 'dead';
        lv.dead++;
      } else {
        w.state = 'walk';
        w.fall = 0;
      }
      break;
    case 'walk':
      walk(lv, w);
      break;
    case 'climb':
      if (free(lv, w.x + w.dir, w.y) && free(lv, w.x + w.dir, w.y - 1)) {
        w.x += w.dir;
        w.state = 'walk';
      } else if (free(lv, w.x, w.y - 2)) w.y--;
      else {
        // A ceiling: let go and fall back.
        w.dir = w.dir === 1 ? -1 : 1;
        w.state = 'fall';
        w.fall = 0;
      }
      break;
    case 'block':
      if (free(lv, w.x, w.y + 1)) {
        w.state = 'fall';
        w.fall = 0;
      }
      break;
    case 'dig':
      w.work++;
      if (w.work % 2) break;
      if (!earth(lv, w.x, w.y + 1)) {
        w.state = free(lv, w.x, w.y + 1) ? 'fall' : 'walk';
        w.fall = 0;
        break;
      }
      for (let dx = -1; dx <= 1; dx++)
        if (earth(lv, w.x + dx, w.y + 1)) setCell(lv, w.x + dx, w.y + 1, AIR);
      w.y++;
      break;
    case 'bash': {
      if (free(lv, w.x, w.y + 1)) {
        w.state = 'fall';
        w.fall = 0;
        break;
      }
      const ax = w.x + w.dir;
      const ahead = [0, 1, 2].map((d) => cellAt(lv, ax, w.y - d));
      if (ahead.includes(STEEL)) {
        w.state = 'walk';
        w.dir = w.dir === 1 ? -1 : 1;
        break;
      }
      if (
        !ahead.includes(EARTH) &&
        !earth(lv, ax + w.dir, w.y) &&
        !earth(lv, ax + w.dir, w.y - 1)
      ) {
        w.state = 'walk';
        break;
      }
      for (let d = 0; d <= 2; d++) if (earth(lv, ax, w.y - d)) setCell(lv, ax, w.y - d, AIR);
      w.x = ax;
      break;
    }
    case 'build': {
      w.work++;
      if (w.work % 2) break;
      const bx = w.x + w.dir;
      // Lay a brick ahead at foot level and step up onto it.
      if (solid(lv, bx, w.y - 1) || solid(lv, bx, w.y - 2) || solid(lv, w.x, w.y - 2)) {
        w.state = 'walk';
        w.dir = w.dir === 1 ? -1 : 1;
        break;
      }
      if (free(lv, bx, w.y)) setCell(lv, bx, w.y, EARTH);
      w.x = bx;
      w.y--;
      const left = BRICKS - w.work / 2;
      if (left <= 0) w.state = 'walk';
      break;
    }
  }
  const [ex, ey] = LEVELS[lv.index]!.exit;
  if (w.status === 'out' && Math.abs(w.x - ex) <= 1 && w.y >= ey - 2 && w.y <= ey) {
    w.status = 'saved';
    lv.saved++;
  }
}

/** One tick of a level (mutates `lv`). */
export function tickLevel(lv: Level) {
  const def = LEVELS[lv.index]!;
  lv.ticks++;
  if (lv.toCome > 0 && (lv.ticks - 1) % def.rate === 0) {
    lv.walkers.push({
      x: def.hatch[0],
      y: def.hatch[1],
      dir: 1,
      state: 'fall',
      climber: false,
      floater: false,
      fall: 0,
      work: 0,
      status: 'out',
    });
    lv.toCome--;
  }
  for (const w of lv.walkers) if (w.status === 'out') tickWalker(lv, w);
  const out = lv.walkers.filter((w) => w.status === 'out');
  // Over when nobody is left to move: all home, gone, or standing as blockers — or out of time.
  if (lv.toCome === 0 && out.every((w) => w.state === 'block')) lv.done = true;
  if (lv.ticks >= LIMIT) {
    // Time is up: whoever is still out is lost.
    for (const w of out) {
      w.status = 'dead';
      lv.dead++;
    }
    lv.done = true;
  }
}

/** Whether a skill can be given to a wanderer now. */
export function canGive(lv: Level, i: number, skill: Skill): boolean {
  const w = lv.walkers[i];
  if (!w || w.status !== 'out' || lv.skills[skill] <= 0) return false;
  if (skill === 'climb') return !w.climber;
  if (skill === 'float') return !w.floater;
  if (w.state !== 'walk' && !(w.state === 'bash' || w.state === 'build' || w.state === 'dig'))
    return false;
  if (w.state === skill || (skill === 'block' && w.state !== 'walk')) return false;
  if (skill === 'dig') return earth(lv, w.x, w.y + 1);
  return !free(lv, w.x, w.y + 1);
}

export function give(lv: Level, i: number, skill: Skill) {
  const w = lv.walkers[i]!;
  lv.skills[skill]--;
  if (skill === 'climb') w.climber = true;
  else if (skill === 'float') w.floater = true;
  else {
    w.state = skill;
    w.work = 0;
  }
}

const cloneLevel = (lv: Level): Level => ({
  ...lv,
  grid: [...lv.grid],
  walkers: lv.walkers.map((w) => ({ ...w })),
  skills: { ...lv.skills },
});

export function stepRescue(s0: Rescue, action: RescueAction): Rescue {
  if (s0.over) return s0;
  const s: Rescue = { ...s0, events: [], steps: s0.steps + 1, cool: Math.max(0, s0.cool - 1) };
  if (s.pause > 0) {
    s.pause--;
    if (s.pause === 0) {
      if (s.won && s.level.index === LEVELS.length - 1) {
        s.over = true;
        s.victory = true;
        s.events.push('victory');
      } else if (!s.won && s.lives <= 0) {
        s.over = true;
        s.events.push('over');
      } else {
        s.level = newLevel(s.won ? s.level.index + 1 : s.level.index);
        s.cursor = 0;
        s.won = null;
        s.events.push('level');
      }
    }
    return s;
  }
  const lv = cloneLevel(s.level);
  s.level = lv;
  const out = lv.walkers.map((w, i) => [w, i] as const).filter(([w]) => w.status === 'out');
  if (s.cool === 0 && (action === 'prev' || action === 'next')) {
    const k = SKILLS.indexOf(s.skill);
    s.skill = SKILLS[(k + (action === 'next' ? 1 : SKILLS.length - 1)) % SKILLS.length]!;
    s.cool = 10;
  }
  if (s.cool === 0 && (action === 'up' || action === 'down') && out.length) {
    const pos = Math.max(
      0,
      out.findIndex(([, i]) => i === s.cursor),
    );
    s.cursor = out[(pos + (action === 'down' ? 1 : out.length - 1)) % out.length]![1];
    s.cool = 10;
  }
  if (action.startsWith('pick-')) s.skill = action.slice(5) as Skill;
  if (out.length && !out.some(([, i]) => i === s.cursor)) s.cursor = out[0]![1];
  let target: [number, Skill] | null = null;
  if (action === 'assign') target = [s.cursor, s.skill];
  else if (action.startsWith('give-')) {
    const [, k, i] = action.split('-');
    target = [Number(i), k as Skill];
  }
  if (target && canGive(lv, target[0], target[1])) {
    give(lv, target[0], target[1]);
    s.events.push(`skill`);
  }
  if (action === 'end') lv.done = true;
  if (s.steps % TICK === 0 && !lv.done) {
    const before = [lv.saved, lv.dead];
    tickLevel(lv);
    if (lv.saved > before[0]!) s.events.push('saved');
    if (lv.dead > before[1]!) s.events.push('lost');
    if (lv.ticks % 1 === 0 && lv.walkers.length > (s0.level.walkers.length ?? 0))
      s.events.push('drop');
  }
  if (lv.done) {
    const def = LEVELS[lv.index]!;
    s.won = lv.saved >= def.need;
    s.totalSaved += lv.saved;
    s.score += lv.saved * 100 + (s.won ? 500 * (lv.index + 1) + Math.max(0, LIMIT - lv.ticks) : 0);
    if (s.won) s.cleared = Math.max(s.cleared, lv.index + 1);
    else s.lives--;
    s.pause = 120;
    s.events.push(s.won ? 'win' : 'fail');
  }
  return s;
}

// ————————————————————————————— the planner —————————————————————————————

interface Order {
  tick: number;
  walker: number;
  skill: Skill;
}

/** Plays a level forward from `lv` with a list of orders, returning how it went. */
function trial(
  lv0: Level,
  orders: readonly Order[],
  limit: number,
): { saved: number; value: number; lv: Level; given: number } {
  const lv = cloneLevel(lv0);
  const [ex, ey] = LEVELS[lv.index]!.exit;
  const best = new Map<number, number>();
  let given = 0;
  let k = 0;
  const sorted = [...orders].sort((a, b) => a.tick - b.tick);
  while (!lv.done && lv.ticks < limit) {
    while (k < sorted.length && sorted[k]!.tick <= lv.ticks) {
      const o = sorted[k++]!;
      if (canGive(lv, o.walker, o.skill)) {
        give(lv, o.walker, o.skill);
        given++;
      }
    }
    tickLevel(lv);
    lv.walkers.forEach((w, i) => {
      if (w.status !== 'out') return;
      const d = Math.abs(w.x - ex) + Math.abs(w.y - ey);
      best.set(i, Math.min(best.get(i) ?? 999, d));
    });
  }
  let progress = 0;
  lv.walkers.forEach((w, i) => (progress += w.status === 'saved' ? 0 : (best.get(i) ?? 120)));
  // Saving counts most; then getting close and not losing anyone (still out at the end counts as lost); finishing sooner and using fewer
  // skills break ties.
  const lost = lv.walkers.length + lv.toCome - lv.saved;
  const value =
    lv.saved * 10000 -
    progress * 25 -
    lost * 300 -
    lv.ticks * 0.2 -
    (orders.length - given) * 50 -
    given * 5;
  return { saved: lv.saved, value, lv, given };
}

/** A moment worth trying a skill: at an edge, facing a wall, or just dropped (floaters, climbers). */
function moment(lv: Level, w: Walker): boolean {
  const ax = w.x + w.dir;
  if (w.state === 'fall') return w.fall === 1;
  if (w.state !== 'walk') return false;
  return (
    free(lv, ax, w.y + 1) ||
    solid(lv, ax, w.y) ||
    solid(lv, ax, w.y - 1) ||
    solid(lv, ax + w.dir, w.y - 1)
  );
}

const plans = new Map<string, Order[]>();
const keyOf = (lv: Level) => `${lv.index}:${lv.ticks}:${lv.walkers.length}:${lv.saved}:${lv.dead}`;

/**
 * Searches for the orders that rescue the most wanderers from `lv`: a beam search (3 wide) that
 * adds one order at a time — one skill, to one of the first three wanderers still about, at a
 * moment worth trying (at an edge, facing a wall, just dropped, or every tenth tick) — and keeps the plans that do best when the level is played out with
 * the real rules. Only the first eight wanderers are played while searching (the rest follow the
 * same ground).
 */
export function plan(lv0: Level): Order[] {
  const quick: Level = {
    ...cloneLevel(lv0),
    toCome: Math.min(lv0.toCome, Math.max(0, 8 - lv0.walkers.length)),
  };
  type Cand = { orders: Order[]; value: number };
  // Each trial plays at most 900 ticks (1.5 minutes) ahead; whoever is still out then counts as lost.
  const horizon = Math.min(LIMIT, quick.ticks + 900);
  let beam: Cand[] = [{ orders: [], value: trial(quick, [], horizon).value }];
  let best = beam[0]!;
  for (let depth = 0; depth < 12; depth++) {
    const next: Cand[] = [];
    for (const c of beam) {
      // Replay to find, at each tick, who is walking and what skills are left.
      const lv = cloneLevel(quick);
      const sorted = [...c.orders].sort((a, b) => a.tick - b.tick);
      let k = 0;
      const lastTick = sorted.length ? sorted[sorted.length - 1]!.tick : -1;
      while (!lv.done && lv.ticks < horizon - 300) {
        while (k < sorted.length && sorted[k]!.tick <= lv.ticks) {
          const o = sorted[k++]!;
          if (canGive(lv, o.walker, o.skill)) give(lv, o.walker, o.skill);
        }
        if (lv.ticks >= lastTick) {
          const cands = lv.walkers
            .map((w, i) => [w, i] as const)
            .filter(([w]) => w.status === 'out' && w.state !== 'block')
            .slice(0, 3);
          for (const [w, i] of cands)
            for (const skill of SKILLS)
              if ((lv.ticks % 10 === 0 || moment(lv, w)) && canGive(lv, i, skill)) {
                const orders = [...c.orders, { tick: lv.ticks, walker: i, skill }];
                next.push({ orders, value: trial(quick, orders, horizon).value });
              }
        }
        tickLevel(lv);
      }
    }
    if (!next.length) break;
    next.sort((a, b) => b.value - a.value);
    const top = next[0]!;
    if (top.value <= best.value + 1) break;
    best = top;
    beam = next.slice(0, 3);
  }
  return best.orders;
}

/**
 * A planner: when a level starts (or when it first looks at one), it searches for its orders
 * (see `plan`) and then hands out each skill at its tick. Plans are remembered per position.
 */
export function plannerPolicy(s: Rescue): RescueAction {
  if (s.over || s.pause) return 'idle';
  const lv = s.level;
  let found: Order[] | undefined;
  let from = -1;
  for (const [k, v] of plans)
    if (k.startsWith(`${lv.index}:`)) {
      const t = Number(k.split(':')[1]);
      if (t <= lv.ticks && t > from) {
        from = t;
        found = v;
      }
    }
  if (!found) {
    found = plan(lv);
    plans.set(keyOf(lv), found);
  }
  for (const o of found)
    if (o.tick === lv.ticks && canGive(lv, o.walker, o.skill)) return `give-${o.skill}-${o.walker}`;
  return 'idle';
}

/** A hand-out-nothing player: lets the wanderers walk (to see what each level does on its own). */
export function idlePolicy(): RescueAction {
  return 'idle';
}

/** Clears the planner's memory (for tests that time it). */
export const forgetPlans = () => plans.clear();

export function isRescue(d: unknown): d is Rescue {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Rescue;
  return (
    typeof s.level === 'object' &&
    s.level !== null &&
    Array.isArray(s.level.grid) &&
    s.level.grid.length === COLS * ROWS &&
    Array.isArray(s.level.walkers) &&
    (SKILLS as readonly string[]).includes(s.skill) &&
    Number.isFinite(s.score)
  );
}
