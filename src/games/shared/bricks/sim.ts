/**
 * Brick breaking, shared by Breakout (#167) and the enhanced brick breaker (#168): a 360 × 480
 * field at 60 steps a second, a paddle along the bottom, balls, and a wall of bricks. A ball
 * bounces off the side and top walls, off bricks (breaking them) and off the paddle at an angle set
 * by where it struck (up to 60° from vertical). A ball that falls past the paddle is gone; with no
 * balls left a life is lost and the next ball waits on the paddle until launched (or launches
 * itself after two seconds). Clearing every breakable brick moves on to the next wall; the run ends
 * when the lives or the walls run out.
 *
 * The enhanced rules add bricks that need two or three hits, unbreakable gold bricks, and capsules
 * that fall from broken bricks: a wider paddle, three balls, slower balls, a laser, an extra life.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';

export const W = 360;
export const H = 480;
export const PADDLE_Y = 448;
export const PADDLE_H = 10;
export const BALL = 7;
export const BRICK_W = 32;
export const BRICK_H = 14;
export const COLS = 10;
const GAP = 3;
const LEFT = (W - COLS * BRICK_W - (COLS - 1) * GAP) / 2;
export const TOP = 64;
const PADDLE_SPEED = 6;
const LAUNCH_AFTER = 120;

export type BrickAction = 'left' | 'right' | 'idle' | 'fire' | 'left-fire' | 'right-fire';
export const ACTIONS: readonly BrickAction[] = [
  'left',
  'right',
  'idle',
  'fire',
  'left-fire',
  'right-fire',
];

/** A wall: one string per row, one character per column: '.' empty, 1–3 hits, 'G' gold. */
export type Wall = string[];

export interface BrickRules {
  id: string;
  walls: Wall[];
  lives: number;
  capsules: boolean;
  /** Points per brick by row (top first), or per hit-strength. */
  rowPoints: number[];
  startSpeed: number;
  maxSpeed: number;
  /** The classic rule: the paddle shrinks to half once a ball first reaches the top wall. */
  shrink: boolean;
}

export interface Brick {
  x: number;
  y: number;
  hits: number;
  gold: boolean;
  row: number;
}

export type CapsuleKind = 'wide' | 'multi' | 'slow' | 'laser' | 'life';
export const CAPSULES: CapsuleKind[] = ['wide', 'multi', 'slow', 'laser', 'life'];

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Bricks {
  rules: string;
  rng: RngState;
  wall: number;
  bricks: Brick[];
  balls: Ball[];
  /** A ball waiting on the paddle (steps until it launches itself), or null. */
  held: number | null;
  paddle: number;
  paddleW: number;
  lives: number;
  score: number;
  speed: number;
  capsules: { x: number; y: number; kind: CapsuleKind }[];
  shots: { x: number; y: number }[];
  /** Steps left for each timed power. */
  timers: { wide: number; slow: number; laser: number };
  cooldown: number;
  /** Capsules caught so far. */
  caught: number;
  /** The paddle has shrunk (classic rule). */
  small: boolean;
  /** Steps since a brick last broke (a stalled ball gets a nudge off the paddle). */
  idle: number;
  over: boolean;
  cleared: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export function buildWall(wall: Wall): Brick[] {
  const out: Brick[] = [];
  wall.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      out.push({
        x: LEFT + c * (BRICK_W + GAP),
        y: TOP + r * (BRICK_H + GAP),
        hits: ch === 'G' ? 99 : Number(ch),
        gold: ch === 'G',
        row: r,
      });
    }),
  );
  return out;
}

export function newBricks(rules: BrickRules, seed: number): Bricks {
  return {
    rules: rules.id,
    rng: seedRng(seed >>> 0),
    wall: 0,
    bricks: buildWall(rules.walls[0]!),
    balls: [],
    held: LAUNCH_AFTER,
    paddle: W / 2,
    paddleW: 64,
    lives: rules.lives,
    score: 0,
    speed: rules.startSpeed,
    capsules: [],
    shots: [],
    timers: { wide: 0, slow: 0, laser: 0 },
    cooldown: 0,
    caught: 0,
    small: false,
    idle: 0,
    over: false,
    cleared: false,
    events: [],
    steps: 0,
  };
}

const left = (a: BrickAction) => a === 'left' || a === 'left-fire';
const right = (a: BrickAction) => a === 'right' || a === 'right-fire';
const fire = (a: BrickAction) => a === 'fire' || a === 'left-fire' || a === 'right-fire';

function launch(s: Bricks, rng: RngState): [Ball, RngState] {
  const [r, next] = rand(rng);
  const angle = (r - 0.5) * (Math.PI / 3);
  return [
    {
      x: s.paddle,
      y: PADDLE_Y - BALL,
      vx: s.speed * Math.sin(angle),
      vy: -s.speed * Math.cos(angle),
    },
    next,
  ];
}

export function stepBricks(rules: BrickRules, s: Bricks, action: BrickAction): Bricks {
  if (s.over) return s;
  let rng = s.rng;
  const events: string[] = [];
  const timers = {
    wide: Math.max(0, s.timers.wide - 1),
    slow: Math.max(0, s.timers.slow - 1),
    laser: Math.max(0, s.timers.laser - 1),
  };
  let small = s.small;
  const paddleW = timers.wide > 0 ? 96 : small ? 40 : 64;
  let paddle = s.paddle + (left(action) ? -PADDLE_SPEED : right(action) ? PADDLE_SPEED : 0);
  paddle = Math.max(paddleW / 2, Math.min(W - paddleW / 2, paddle));
  let balls = s.balls.map((b) => ({ ...b }));
  let held = s.held;
  let bricks = s.bricks;
  let score = s.score;
  let speed = s.speed;
  let lives = s.lives;
  let capsules = s.capsules.map((c) => ({ ...c }));
  let shots = s.shots.map((x) => ({ ...x }));
  let cooldown = Math.max(0, s.cooldown - 1);
  let idle = s.idle + 1;

  // Launching the waiting ball.
  if (held !== null) {
    held = fire(action) ? 0 : held - 1;
    if (held <= 0) {
      const [b, n] = launch({ ...s, paddle, speed }, rng);
      rng = n;
      balls = [b];
      held = null;
      events.push('launch');
    }
  }

  // Laser shots.
  if (timers.laser > 0 && fire(action) && cooldown === 0 && s.held === null) {
    shots.push(
      { x: paddle - paddleW / 2 + 6, y: PADDLE_Y },
      { x: paddle + paddleW / 2 - 6, y: PADDLE_Y },
    );
    cooldown = 18;
    events.push('laser');
  }

  const hitBrick = (i: number): void => {
    const b = bricks[i]!;
    if (b.gold) {
      events.push('gold');
      return;
    }
    const left2 = b.hits - 1;
    if (left2 > 0) {
      bricks = bricks.map((x, k) => (k === i ? { ...x, hits: left2 } : x));
      events.push('dent');
      return;
    }
    bricks = bricks.filter((_, k) => k !== i);
    idle = 0;
    score += rules.rowPoints[Math.min(b.row, rules.rowPoints.length - 1)]!;
    events.push('brick');
    // Classic speed-ups: hitting the upper rows makes the ball faster.
    if (b.row <= 3) speed = Math.min(rules.maxSpeed, speed + 0.08);
    if (rules.capsules) {
      const [r, n] = rand(rng);
      rng = n;
      if (r < 0.14) {
        const [k, n2] = rand(rng);
        rng = n2;
        capsules.push({
          x: b.x + BRICK_W / 2,
          y: b.y + BRICK_H,
          kind: CAPSULES[Math.floor(k * CAPSULES.length)]!,
        });
      }
    }
  };
  const brickAt = (x: number, y: number, r: number) =>
    bricks.findIndex(
      (b) => x + r > b.x && x - r < b.x + BRICK_W && y + r > b.y && y - r < b.y + BRICK_H,
    );

  // Shots climb and break what they meet.
  shots = shots
    .map((p) => ({ ...p, y: p.y - 8 }))
    .filter((p) => {
      if (p.y < 0) return false;
      const i = brickAt(p.x, p.y, 1);
      if (i >= 0) {
        hitBrick(i);
        return false;
      }
      return true;
    });

  // Balls: move along x then y, bouncing off whatever they meet.
  const scale = timers.slow > 0 ? 0.65 : 1;
  const r = BALL / 2;
  balls = balls.filter((b) => {
    const norm = Math.hypot(b.vx, b.vy) || 1;
    b.vx = (b.vx / norm) * speed;
    b.vy = (b.vy / norm) * speed;
    b.x += b.vx * scale;
    if (b.x < r || b.x > W - r) {
      b.x = b.x < r ? 2 * r - b.x : 2 * (W - r) - b.x;
      b.vx = -b.vx;
      events.push('wall');
    }
    let i = brickAt(b.x, b.y, r);
    if (i >= 0) {
      b.x -= b.vx * scale;
      b.vx = -b.vx;
      hitBrick(i);
    }
    b.y += b.vy * scale;
    if (b.y < r) {
      b.y = 2 * r - b.y;
      b.vy = -b.vy;
      events.push('wall');
      if (rules.shrink && !small) {
        small = true;
        events.push('shrink');
      }
    }
    i = brickAt(b.x, b.y, r);
    if (i >= 0) {
      b.y -= b.vy * scale;
      b.vy = -b.vy;
      hitBrick(i);
    }
    // The paddle.
    if (
      b.vy > 0 &&
      b.y + r >= PADDLE_Y &&
      b.y + r <= PADDLE_Y + PADDLE_H + speed &&
      Math.abs(b.x - paddle) <= paddleW / 2 + r
    ) {
      const offset = Math.max(-1, Math.min(1, (b.x - paddle) / (paddleW / 2)));
      let angle = offset * (Math.PI / 3);
      // A ball that has broken nothing for ten seconds is nudged off its loop.
      if (idle > 600) {
        const [r2, n] = rand(rng);
        rng = n;
        // At least 15° and up to 40° off its course, towards the side with more room.
        const turn = (0.26 + r2 * 0.44) * (angle > 0 ? -1 : 1);
        angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, angle + turn));
        idle = 0;
      }
      b.vx = speed * Math.sin(angle);
      b.vy = -speed * Math.cos(angle);
      b.y = PADDLE_Y - r;
      events.push('paddle');
    }
    return b.y < H + BALL;
  });

  // Capsules fall; the paddle catches them.
  const caught: CapsuleKind[] = [];
  capsules = capsules
    .map((c) => ({ ...c, y: c.y + 2.2 }))
    .filter((c) => {
      if (
        c.y >= PADDLE_Y - 6 &&
        c.y <= PADDLE_Y + PADDLE_H &&
        Math.abs(c.x - paddle) <= paddleW / 2 + 8
      ) {
        caught.push(c.kind);
        return false;
      }
      return c.y < H;
    });
  const caughtTotal = s.caught + caught.length;
  for (const k of caught) {
    events.push(`capsule-${k}`);
    if (k === 'wide') timers.wide = 900;
    else if (k === 'slow') timers.slow = 600;
    else if (k === 'laser') timers.laser = 600;
    else if (k === 'life') lives++;
    else if (k === 'multi' && balls.length) {
      const b = balls[0]!;
      const a = Math.atan2(b.vx, -b.vy);
      for (const d of [-0.4, 0.4])
        balls.push({ x: b.x, y: b.y, vx: speed * Math.sin(a + d), vy: -speed * Math.cos(a + d) });
    }
  }

  // Lost every ball.
  if (held === null && balls.length === 0) {
    lives--;
    events.push('lost');
    capsules = [];
    shots = [];
    if (lives <= 0)
      return {
        ...s,
        rng,
        bricks,
        balls,
        held: null,
        paddle,
        paddleW,
        lives: 0,
        score,
        speed,
        capsules,
        shots,
        timers,
        cooldown,
        caught: caughtTotal,
        small,
        idle,
        over: true,
        events,
        steps: s.steps + 1,
      };
    held = LAUNCH_AFTER;
    speed = rules.startSpeed;
    timers.wide = 0;
    timers.slow = 0;
    timers.laser = 0;
  }

  // A cleared wall: the next one, or the end.
  let wall = s.wall;
  let cleared = s.cleared;
  if (bricks.every((b) => b.gold)) {
    events.push('wall-cleared');
    if (wall + 1 >= rules.walls.length) {
      return {
        ...s,
        rng,
        bricks,
        balls: [],
        held: null,
        paddle,
        paddleW,
        lives,
        score,
        speed,
        capsules: [],
        shots: [],
        timers,
        cooldown,
        caught: caughtTotal,
        small,
        idle,
        over: true,
        cleared: true,
        events,
        steps: s.steps + 1,
      };
    }
    wall++;
    cleared = true;
    bricks = buildWall(rules.walls[wall]!);
    small = false;
    balls = [];
    held = LAUNCH_AFTER;
    capsules = [];
    shots = [];
    speed = rules.startSpeed;
  }
  return {
    ...s,
    rng,
    wall,
    bricks,
    balls,
    held,
    paddle,
    paddleW,
    lives,
    score,
    speed,
    capsules,
    shots,
    timers,
    cooldown,
    caught: caughtTotal,
    small,
    idle,
    over: false,
    cleared,
    events,
    steps: s.steps + 1,
  };
}

/** Where a ball will reach the paddle's height (unfolding side-wall bounces), or null if rising. */
export function landingX(b: Ball): number | null {
  if (b.vy <= 0) return null;
  const t = (PADDLE_Y - BALL / 2 - b.y) / b.vy;
  const r = BALL / 2;
  const span = W - 2 * r;
  let x = b.x - r + b.vx * t;
  x = ((x % (2 * span)) + 2 * span) % (2 * span);
  return r + (x > span ? 2 * span - x : x);
}

/**
 * A player: meet the most urgent falling ball, striking it off-centre so that it heads for the
 * remaining bricks; launch at once; fire the laser under bricks; otherwise catch capsules or wait
 * in the middle.
 */
export function plannerPolicy(s: Bricks): BrickAction {
  let target: number | null = null;
  let soonest = Infinity;
  for (const b of s.balls) {
    const x = landingX(b);
    if (x === null) continue;
    const t = (PADDLE_Y - b.y) / b.vy;
    if (t < soonest) {
      soonest = t;
      // Steer towards the bricks' centre: hit with the paddle side away from it.
      const live = s.bricks.filter((k) => !k.gold);
      const cx = live.length
        ? live.reduce((a, k) => a + k.x + BRICK_W / 2, 0) / live.length
        : W / 2;
      const lean = Math.max(-0.6, Math.min(0.6, (cx - x) / 160));
      target = x - lean * (s.paddleW / 2);
    }
  }
  if (target === null) {
    const cap = s.capsules.filter((c) => c.kind !== 'slow').sort((a, b) => b.y - a.y)[0];
    target = cap ? cap.x : W / 2;
  }
  const wantFire =
    s.held !== null ||
    (s.timers.laser > 0 &&
      s.bricks.some((k) => !k.gold && Math.abs(k.x + BRICK_W / 2 - s.paddle) < s.paddleW / 2));
  const d = target - s.paddle;
  if (d < -3) return wantFire ? 'left-fire' : 'left';
  if (d > 3) return wantFire ? 'right-fire' : 'right';
  return wantFire ? 'fire' : 'idle';
}

/** A simpler player that follows the lowest ball's x. */
export function followerPolicy(s: Bricks): BrickAction {
  const b = [...s.balls].sort((a, c) => c.y - a.y)[0];
  const x = b ? b.x : W / 2;
  if (s.held !== null) return 'fire';
  if (x < s.paddle - 8) return 'left';
  if (x > s.paddle + 8) return 'right';
  return 'idle';
}

export function isBricks(d: unknown, rules: BrickRules): d is Bricks {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Bricks;
  return (
    s.rules === rules.id &&
    Array.isArray(s.rng) &&
    Array.isArray(s.bricks) &&
    Array.isArray(s.balls) &&
    Number.isInteger(s.lives) &&
    Number.isFinite(s.score) &&
    s.wall >= 0 &&
    s.wall < rules.walls.length
  );
}
