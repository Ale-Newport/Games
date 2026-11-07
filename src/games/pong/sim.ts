/**
 * Pong: two paddles and a ball on a 400 × 300 field at 60 steps a second. You play the left paddle
 * against the computer on the right. The ball bounces off the top and bottom walls; off a paddle
 * it leaves at an angle set by where it struck (up to 60° from the edge of the paddle) and a little
 * faster each hit. A ball past a paddle is a point to the other side; the next serve goes towards
 * the side that conceded. First to the target wins.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const W = 400;
export const H = 300;
export const PADDLE_H = 56;
export const PADDLE_W = 8;
export const LEFT_X = 18;
export const RIGHT_X = W - 18 - PADDLE_W;
export const BALL = 7;
export const PLAYER_SPEED = 5.4;
const START_SPEED = 4.2;
const MAX_SPEED = 10;
const SERVE_DELAY = 50;

export type PongAction = 'up' | 'down' | 'idle';
export const ACTIONS: readonly PongAction[] = ['up', 'down', 'idle'];

/** The computer opponent's skill: paddle speed, aiming error and how late it reacts. */
export const LEVELS: Record<string, { speed: number; error: number; reaction: number }> = {
  easy: { speed: 3, error: 34, reaction: 0.45 },
  medium: { speed: 4, error: 24, reaction: 0.5 },
  hard: { speed: 5, error: 16, reaction: 0.55 },
};

export interface Pong {
  rng: RngState;
  level: string;
  target: number;
  ball: { x: number; y: number; vx: number; vy: number };
  /** Paddle tops. */
  left: number;
  right: number;
  scores: [number, number];
  /** Steps until the next serve (0 while the ball is in play). */
  serve: number;
  /** Which way the next serve goes (−1 left, 1 right). */
  towards: -1 | 1;
  rally: number;
  bestRally: number;
  /** Where the computer is aiming its paddle's centre, re-chosen each time the ball heads its way. */
  aim: number | null;
  /** Events of the last step, for sounds. */
  events: ('paddle' | 'wall' | 'point-left' | 'point-right')[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

export function newPong(seed: number, level: string, target: number): Pong {
  let rng = seedRng(seed >>> 0);
  const [r, next] = rand(rng);
  rng = next;
  return {
    rng,
    level: LEVELS[level] ? level : 'medium',
    target,
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
    left: (H - PADDLE_H) / 2,
    right: (H - PADDLE_H) / 2,
    scores: [0, 0],
    serve: SERVE_DELAY,
    towards: r < 0.5 ? -1 : 1,
    rally: 0,
    bestRally: 0,
    aim: null,
    events: [],
    steps: 0,
  };
}

export const pongOver = (s: Pong) => s.scores[0] >= s.target || s.scores[1] >= s.target;

/** Where the ball will cross x = `atX`, following its bounces off the walls. */
export function interceptY(ball: Pong['ball'], atX: number): number {
  if (ball.vx === 0) return ball.y;
  const t = (atX - ball.x) / ball.vx;
  if (t < 0) return ball.y;
  let y = ball.y + ball.vy * t;
  const lo = BALL / 2;
  const hi = H - BALL / 2;
  const span = hi - lo;
  // Unfold the reflections.
  y = (((y - lo) % (2 * span)) + 2 * span) % (2 * span);
  return lo + (y > span ? 2 * span - y : y);
}

const clampPaddle = (y: number) => Math.max(0, Math.min(H - PADDLE_H, y));

export function stepPong(s: Pong, action: PongAction): Pong {
  if (pongOver(s)) return s;
  let rng = s.rng;
  const events: Pong['events'] = [];
  let left = clampPaddle(
    s.left + (action === 'up' ? -PLAYER_SPEED : action === 'down' ? PLAYER_SPEED : 0),
  );
  let { right, aim, rally, bestRally, serve, towards } = s;
  let ball = { ...s.ball };
  const scores: [number, number] = [s.scores[0], s.scores[1]];

  if (serve > 0) {
    serve--;
    if (serve === 0) {
      const [r, n] = rand(rng);
      rng = n;
      const angle = (r - 0.5) * (Math.PI / 3);
      ball = {
        x: W / 2,
        y: H / 2,
        vx: towards * START_SPEED * Math.cos(angle),
        vy: START_SPEED * Math.sin(angle),
      };
    }
  } else {
    ball.x += ball.vx;
    ball.y += ball.vy;
    if (ball.y < BALL / 2 || ball.y > H - BALL / 2) {
      ball.y = ball.y < BALL / 2 ? BALL - ball.y : 2 * (H - BALL / 2) - ball.y;
      ball.vy = -ball.vy;
      events.push('wall');
    }
    const hit = (top: number, faceX: number, dir: 1 | -1) => {
      const offset = (ball.y - (top + PADDLE_H / 2)) / (PADDLE_H / 2 + BALL / 2);
      if (Math.abs(offset) > 1) return false;
      const speed = Math.min(MAX_SPEED, Math.hypot(ball.vx, ball.vy) * 1.04);
      const angle = offset * (Math.PI / 3);
      ball = {
        x: faceX + (dir * BALL) / 2,
        y: ball.y,
        vx: dir * speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
      };
      rally++;
      bestRally = Math.max(bestRally, rally);
      events.push('paddle');
      return true;
    };
    if (
      ball.vx < 0 &&
      ball.x - BALL / 2 <= LEFT_X + PADDLE_W &&
      s.ball.x - BALL / 2 > LEFT_X + PADDLE_W - Math.abs(ball.vx) - 1
    )
      hit(left, LEFT_X + PADDLE_W, 1);
    if (
      ball.vx > 0 &&
      ball.x + BALL / 2 >= RIGHT_X &&
      s.ball.x + BALL / 2 < RIGHT_X + Math.abs(ball.vx) + 1
    )
      hit(right, RIGHT_X, -1);
    if (ball.x < -BALL || ball.x > W + BALL) {
      const leftScored = ball.x > W;
      scores[leftScored ? 0 : 1]++;
      events.push(leftScored ? 'point-left' : 'point-right');
      towards = leftScored ? 1 : -1;
      serve = SERVE_DELAY;
      rally = 0;
      aim = null;
      ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    }
  }

  // The computer: when the ball heads its way, it picks a spot near the predicted crossing (with
  // an error that shrinks with skill) once the ball is past a reaction line, and moves there.
  const lv = LEVELS[s.level]!;
  if (ball.vx > 0 && serve === 0) {
    if (aim === null && ball.x > W * (1 - lv.reaction)) {
      const [r, n] = rand(rng);
      rng = n;
      aim = interceptY(ball, RIGHT_X) + (r - 0.5) * 2 * lv.error;
    }
  } else if (ball.vx < 0) aim = null;
  const goal = aim ?? H / 2;
  const centre = right + PADDLE_H / 2;
  if (Math.abs(goal - centre) > 2)
    right = clampPaddle(
      right + Math.sign(goal - centre) * Math.min(lv.speed, Math.abs(goal - centre)),
    );
  left = clampPaddle(left);
  return {
    ...s,
    rng,
    ball,
    left,
    right,
    scores,
    serve,
    towards,
    rally,
    bestRally,
    aim,
    events,
    steps: s.steps + 1,
  };
}

/**
 * A player policy for the left paddle: meet the ball where it will cross, striking it off-centre
 * (on the side away from the computer's paddle) to send it back at a steep angle.
 */
export function trackerPolicy(s: Pong): PongAction {
  let goal = H / 2;
  if (s.ball.vx < 0 && s.serve === 0) {
    const y = interceptY(s.ball, LEFT_X + PADDLE_W);
    // Hitting below centre sends the ball down, above centre up: aim away from the opponent.
    const away = s.right + PADDLE_H / 2 < H / 2 ? 1 : -1;
    goal = y - away * PADDLE_H * 0.3;
  }
  const centre = s.left + PADDLE_H / 2;
  if (goal < centre - 4) return 'up';
  if (goal > centre + 4) return 'down';
  return 'idle';
}

/** A slower policy that follows the ball's current height only. */
export function followerPolicy(s: Pong): PongAction {
  const centre = s.left + PADDLE_H / 2;
  if (s.ball.y < centre - 10) return 'up';
  if (s.ball.y > centre + 10) return 'down';
  return 'idle';
}

export function isPong(d: unknown): d is Pong {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Pong;
  return (
    Array.isArray(s.rng) &&
    typeof LEVELS[s.level] === 'object' &&
    [3, 5, 11].includes(s.target) &&
    Array.isArray(s.scores) &&
    s.scores.length === 2 &&
    typeof s.ball === 'object' &&
    Number.isFinite(s.left) &&
    Number.isFinite(s.right)
  );
}
