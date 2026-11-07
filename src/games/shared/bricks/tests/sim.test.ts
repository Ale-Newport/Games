import { describe, expect, it } from 'vitest';
import { BREAKOUT, ENHANCED } from '../rules';
import {
  BALL,
  buildWall,
  followerPolicy,
  landingX,
  newBricks,
  PADDLE_Y,
  plannerPolicy,
  stepBricks,
  W,
  type Bricks,
} from '../sim';

describe('Brick breaking', () => {
  it('builds walls: the classic eight rows of ten; gold and multi-hit bricks', () => {
    expect(buildWall(BREAKOUT.walls[0]!)).toHaveLength(80);
    const w = buildWall(ENHANCED.walls[1]!);
    expect(w.some((b) => b.gold)).toBe(true);
    expect(w.some((b) => b.hits === 3)).toBe(true);
  });

  it('the waiting ball launches on fire, or by itself', () => {
    let s = newBricks(BREAKOUT, 1);
    expect(s.held).not.toBeNull();
    s = stepBricks(BREAKOUT, s, 'fire');
    expect(s.balls).toHaveLength(1);
    expect(s.balls[0]!.vy).toBeLessThan(0);
    let t = newBricks(BREAKOUT, 1);
    for (let i = 0; i < 130; i++) t = stepBricks(BREAKOUT, t, 'idle');
    expect(t.balls.length + (t.held === null ? 0 : 1)).toBeGreaterThan(0);
  });

  it('breaks a brick, scores by row, and bounces back', () => {
    const s0 = newBricks(BREAKOUT, 2);
    const target = s0.bricks.find((b) => b.row === 7)!;
    const s: Bricks = {
      ...s0,
      held: null,
      balls: [{ x: target.x + 10, y: target.y + 20, vx: 0, vy: -5 }],
    };
    let t = s;
    for (let i = 0; i < 6; i++) t = stepBricks(BREAKOUT, t, 'idle');
    expect(t.bricks).toHaveLength(79);
    expect(t.score).toBe(1);
    expect(t.balls[0]!.vy).toBeGreaterThan(0);
  });

  it('the paddle returns a ball at an angle; a missed ball costs a life', () => {
    const s0 = newBricks(BREAKOUT, 3);
    const s: Bricks = {
      ...s0,
      held: null,
      paddle: W / 2,
      balls: [{ x: W / 2 + 20, y: PADDLE_Y - BALL / 2 - 2, vx: 0, vy: 4 }],
    };
    const t = stepBricks(BREAKOUT, s, 'idle');
    expect(t.balls[0]!.vy).toBeLessThan(0);
    expect(t.balls[0]!.vx).toBeGreaterThan(0);
    let lost: Bricks = {
      ...s0,
      held: null,
      paddle: 20,
      balls: [{ x: W - 30, y: PADDLE_Y + 20, vx: 0, vy: 5 }],
    };
    for (let i = 0; i < 10; i++) lost = stepBricks(BREAKOUT, lost, 'idle');
    expect(lost.lives).toBe(2);
    expect(lost.held).not.toBeNull();
  });

  it('the classic paddle shrinks once a ball reaches the top', () => {
    const s0 = newBricks(BREAKOUT, 4);
    const s: Bricks = { ...s0, bricks: [], held: null, balls: [{ x: W / 2, y: 5, vx: 0, vy: -5 }] };
    const t = stepBricks(
      BREAKOUT,
      { ...s, bricks: buildWall(['..........', '1.........']) },
      'idle',
    );
    expect(t.small).toBe(true);
    expect(t.paddleW).toBe(64);
    expect(stepBricks(BREAKOUT, t, 'idle').paddleW).toBe(40);
  });

  it('capsules: three balls from Multi, a life from +', () => {
    const s0 = newBricks(ENHANCED, 5);
    const s: Bricks = {
      ...s0,
      held: null,
      balls: [{ x: 100, y: 200, vx: 1, vy: -4 }],
      capsules: [
        { x: s0.paddle, y: PADDLE_Y - 5, kind: 'multi' },
        { x: s0.paddle, y: PADDLE_Y - 5, kind: 'life' },
      ],
    };
    const t = stepBricks(ENHANCED, s, 'idle');
    expect(t.balls).toHaveLength(3);
    expect(t.lives).toBe(s0.lives + 1);
    expect(t.caught).toBe(2);
  });

  it('predicts where a falling ball meets the paddle line', () => {
    expect(landingX({ x: 100, y: 300, vx: 0, vy: 4 })).toBeCloseTo(100);
    expect(landingX({ x: 100, y: 300, vx: 0, vy: -4 })).toBeNull();
    const x = landingX({ x: 30, y: 100, vx: -6, vy: 3 })!;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(W);
  });

  it('the planner clears the classic game', () => {
    let s = newBricks(BREAKOUT, 1);
    while (!s.over && s.steps < 60 * 60 * 10) s = stepBricks(BREAKOUT, s, plannerPolicy(s));
    expect(s.over && s.lives > 0).toBe(true);
    expect(s.score).toBe(2 * (2 * (7 + 5 + 3 + 1) * 10));
    // The follower survives a while too.
    let f = newBricks(ENHANCED, 2);
    for (let i = 0; i < 3600; i++) f = stepBricks(ENHANCED, f, followerPolicy(f));
    expect(f.score).toBeGreaterThan(0);
  });
});
