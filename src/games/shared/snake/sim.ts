/**
 * Snake, shared by the classic game (#172) and the wraparound game (#173): a 20 × 20 grid. The
 * snake moves one cell every few steps of a 60 Hz clock, turning on command (never straight back);
 * eating an apple grows it by one and scores, and the snake quickens as it grows. Classic: the walls
 * and the snake's own body are deadly. Wraparound: the edges lead round to the other side, a block
 * appears on the board every five apples, and a golden fruit sometimes appears for a few seconds.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';

export const N = 20;
export type Dir = 'up' | 'down' | 'left' | 'right';
export type SnakeAction = Dir | 'idle';
export const ACTIONS: readonly SnakeAction[] = ['up', 'down', 'left', 'right', 'idle'];
const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export interface SnakeRules {
  id: string;
  wrap: boolean;
  obstacles: boolean;
  bonus: boolean;
}

export interface Snake {
  rules: string;
  rng: RngState;
  /** Cells, head first, as y × N + x. */
  body: number[];
  dir: Dir;
  /** The turn waiting for the next move. */
  next: Dir;
  apple: number;
  bonus: { cell: number; left: number } | null;
  blocks: number[];
  eaten: number;
  /** Golden fruit eaten. */
  goldens: number;
  score: number;
  /** Steps until the next move. */
  timer: number;
  /** Steps left in a timed sprint (null when endless). */
  clock: number | null;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** Steps of the 60 Hz clock per move: 9 at the start, down to 3. */
export const pace = (eaten: number) => Math.max(3, 9 - Math.floor(eaten / 4));

export function neighbour(cell: number, d: Dir, wrap: boolean): number | null {
  const x = cell % N;
  const y = Math.floor(cell / N);
  let nx = x + DELTA[d][0];
  let ny = y + DELTA[d][1];
  if (wrap) {
    nx = (nx + N) % N;
    ny = (ny + N) % N;
  } else if (nx < 0 || ny < 0 || nx >= N || ny >= N) return null;
  return ny * N + nx;
}

function freeCell(
  s: Pick<Snake, 'body' | 'blocks' | 'apple' | 'bonus'>,
  rng: RngState,
  avoid: number[] = [],
): [number, RngState] {
  const taken = new Set([
    ...s.body,
    ...s.blocks,
    s.apple,
    ...(s.bonus ? [s.bonus.cell] : []),
    ...avoid,
  ]);
  const free: number[] = [];
  for (let i = 0; i < N * N; i++) if (!taken.has(i)) free.push(i);
  const [r, next] = rand(rng);
  return [free[Math.floor(r * free.length)] ?? -1, next];
}

export function newSnake(
  rules: SnakeRules,
  seed: number,
  sprintSteps: number | null = null,
): Snake {
  const mid = (N / 2) * N + N / 2;
  const body = [mid, mid - 1, mid - 2];
  const [apple, rng] = freeCell({ body, blocks: [], apple: -1, bonus: null }, seedRng(seed >>> 0));
  return {
    rules: rules.id,
    rng,
    body,
    dir: 'right',
    next: 'right',
    apple,
    bonus: null,
    blocks: [],
    eaten: 0,
    goldens: 0,
    score: 0,
    timer: pace(0),
    clock: sprintSteps,
    over: false,
    events: [],
    steps: 0,
  };
}

export function stepSnake(rules: SnakeRules, s: Snake, action: SnakeAction): Snake {
  if (s.over) return s;
  if (s.clock !== null && s.clock <= 1)
    return { ...s, clock: 0, over: true, events: ['time'], steps: s.steps + 1 };
  const clock = s.clock === null ? null : s.clock - 1;
  let next = s.next;
  if (action !== 'idle' && action !== OPPOSITE[s.dir]) next = action;
  let timer = s.timer - 1;
  let bonus = s.bonus ? { ...s.bonus, left: s.bonus.left - 1 } : null;
  if (bonus && bonus.left <= 0) bonus = null;
  if (timer > 0) return { ...s, next, timer, clock, bonus, events: [], steps: s.steps + 1 };

  let rng = s.rng;
  const events: string[] = [];
  const dir = next;
  const head = neighbour(s.body[0]!, dir, rules.wrap);
  const ate = head === s.apple;
  const tailMoves = !ate;
  const bodyAfter = tailMoves ? s.body.slice(0, -1) : s.body;
  if (head === null || bodyAfter.includes(head) || s.blocks.includes(head)) {
    return {
      ...s,
      dir,
      next,
      timer: 0,
      clock,
      bonus,
      over: true,
      events: ['crash'],
      steps: s.steps + 1,
    };
  }
  const body = [head, ...bodyAfter];
  let { apple, eaten, score, blocks, goldens } = s;
  if (ate) {
    eaten++;
    score += 10 + Math.floor(eaten / 5) * 5;
    events.push('eat');
    if (rules.obstacles && eaten % 5 === 0) {
      // A new block, never right in front of the snake.
      const ahead = [1, 2, 3].map((k) => {
        let c: number | null = head;
        for (let i = 0; i < k && c !== null; i++) c = neighbour(c, dir, rules.wrap);
        return c ?? -1;
      });
      const [b, n] = freeCell({ body, blocks, apple: -1, bonus }, rng, ahead);
      rng = n;
      if (b >= 0) {
        blocks = [...blocks, b];
        events.push('block');
      }
    }
    const [a, n] = freeCell({ body, blocks, apple: -1, bonus }, rng);
    rng = n;
    apple = a;
    if (rules.bonus && !bonus) {
      const [r, n2] = rand(rng);
      rng = n2;
      if (r < 0.25) {
        const [c, n3] = freeCell({ body, blocks, apple, bonus: null }, rng);
        rng = n3;
        bonus = { cell: c, left: 360 };
        events.push('bonus-appears');
      }
    }
  }
  if (bonus && head === bonus.cell) {
    score += 50 + Math.ceil(bonus.left / 12);
    goldens++;
    bonus = null;
    events.push('bonus');
  }
  timer = pace(eaten);
  const full = apple < 0;
  return {
    ...s,
    rng,
    body,
    dir,
    next,
    apple,
    bonus,
    blocks,
    eaten,
    goldens,
    score,
    timer,
    clock,
    over: full,
    events: full ? [...events, 'full'] : events,
    steps: s.steps + 1,
  };
}

/** Shortest path (first move) from the head to `goal`, avoiding the body (whose tail clears as it moves). */
function bfs(
  rules: SnakeRules,
  from: number,
  goal: (c: number) => boolean,
  blocked: Set<number>,
): Dir | null {
  const prev = new Map<number, Dir>();
  const queue: number[] = [from];
  const seen = new Set([from]);
  while (queue.length) {
    const c = queue.shift()!;
    if (c !== from && goal(c)) return prev.get(c)!;
    for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
      const n = neighbour(c, d, rules.wrap);
      if (n === null || seen.has(n) || blocked.has(n)) continue;
      seen.add(n);
      prev.set(n, c === from ? d : prev.get(c)!);
      queue.push(n);
    }
  }
  return null;
}

/** Cells reachable from `from` (a flood fill), for judging a move's room. */
function room(rules: SnakeRules, from: number, blocked: Set<number>): number {
  const seen = new Set([from]);
  const stack = [from];
  while (stack.length) {
    const c = stack.pop()!;
    for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
      const n = neighbour(c, d, rules.wrap);
      if (n !== null && !seen.has(n) && !blocked.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size;
}

/**
 * A player: take the shortest path to the fruit when the snake could still reach its own tail
 * from there; otherwise follow its tail; failing both, move to where there is the most room.
 */
export function pathfinderPolicy(rules: SnakeRules, s: Snake): SnakeAction {
  if (s.timer > 1) return 'idle';
  const head = s.body[0]!;
  const blocked = new Set([...s.body.slice(0, -1), ...s.blocks]);
  const target = s.bonus && s.bonus.left > 60 ? s.bonus.cell : s.apple;
  const toFood = bfs(rules, head, (c) => c === target, blocked);
  if (toFood) {
    // Simulate the move greedily along the path and check the tail is still reachable.
    const after = neighbour(head, toFood, rules.wrap)!;
    const grow = after === s.apple;
    const bodyAfter = [after, ...(grow ? s.body : s.body.slice(0, -1))];
    const block2 = new Set([...bodyAfter.slice(0, -1), ...s.blocks]);
    const tail = bodyAfter[bodyAfter.length - 1]!;
    if (
      bfs(rules, after, (c) => c === tail, block2) !== null ||
      room(rules, after, block2) > bodyAfter.length
    )
      return toFood;
  }
  const tail = s.body[s.body.length - 1]!;
  const toTail = bfs(
    rules,
    head,
    (c) => c === tail,
    new Set([...s.body.slice(0, -1), ...s.blocks]),
  );
  if (toTail && s.body.length > 3) return toTail;
  let best: Dir | null = null;
  let most = -1;
  for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
    if (d === OPPOSITE[s.dir]) continue;
    const n = neighbour(head, d, rules.wrap);
    if (n === null || blocked.has(n)) continue;
    const r = room(rules, n, blocked);
    if (r > most) {
      most = r;
      best = d;
    }
  }
  return best ?? 'idle';
}

/** A greedy player: heads straight for the apple, avoiding only immediate collisions. */
export function greedyPolicy(rules: SnakeRules, s: Snake): SnakeAction {
  if (s.timer > 1) return 'idle';
  const head = s.body[0]!;
  const blocked = new Set([...s.body.slice(0, -1), ...s.blocks]);
  const hx = head % N;
  const hy = Math.floor(head / N);
  const ax = s.apple % N;
  const ay = Math.floor(s.apple / N);
  const prefs: Dir[] = [];
  if (ax < hx) prefs.push('left');
  if (ax > hx) prefs.push('right');
  if (ay < hy) prefs.push('up');
  if (ay > hy) prefs.push('down');
  prefs.push('up', 'down', 'left', 'right');
  for (const d of prefs) {
    if (d === OPPOSITE[s.dir]) continue;
    const n = neighbour(head, d, rules.wrap);
    if (n !== null && !blocked.has(n)) return d;
  }
  return 'idle';
}

export function isSnake(d: unknown, rules: SnakeRules): d is Snake {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Snake;
  return (
    s.rules === rules.id &&
    Array.isArray(s.rng) &&
    Array.isArray(s.body) &&
    s.body.length >= 3 &&
    Number.isFinite(s.score) &&
    Array.isArray(s.blocks)
  );
}

export const CLASSIC: SnakeRules = { id: 'snake', wrap: false, obstacles: false, bonus: false };
export const WRAPAROUND: SnakeRules = {
  id: 'wraparound-snake',
  wrap: true,
  obstacles: true,
  bonus: true,
};
