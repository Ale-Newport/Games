import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import {
  H,
  interceptY,
  type PongAction,
  LEFT_X,
  newPong,
  PADDLE_H,
  PADDLE_W,
  pongOver,
  stepPong,
  trackerPolicy,
  followerPolicy,
  W,
  type Pong,
} from '../sim';

const run = (s: Pong, policy: (s: Pong) => 'up' | 'down' | 'idle', limit = 200_000) => {
  let g = s;
  while (!pongOver(g) && g.steps < limit) g = stepPong(g, policy(g));
  return g;
};

describe('Pong simulation', () => {
  it('serves after a pause, bounces off walls, and moves the paddle', () => {
    let g = newPong(1, 'medium', 5);
    expect(g.ball.vx).toBe(0);
    for (let i = 0; i < 50; i++) g = stepPong(g, 'idle');
    expect(Math.abs(g.ball.vx)).toBeGreaterThan(3);
    const top = g.left;
    g = stepPong(g, 'up');
    expect(g.left).toBeLessThan(top);
    // A ball heading into the top wall comes back down.
    const near: Pong = { ...g, ball: { x: W / 2, y: 4, vx: 2, vy: -3 } };
    const after = stepPong(near, 'idle');
    expect(after.ball.vy).toBeGreaterThan(0);
    expect(after.events).toContain('wall');
  });

  it('a paddle returns the ball at an angle set by where it struck', () => {
    const base = newPong(2, 'medium', 5);
    const g: Pong = {
      ...base,
      serve: 0,
      left: H / 2 - PADDLE_H / 2,
      ball: { x: LEFT_X + PADDLE_W + 5, y: H / 2 + PADDLE_H / 2 - 2, vx: -6, vy: 0 },
    };
    const after = stepPong(g, 'idle');
    expect(after.ball.vx).toBeGreaterThan(0);
    expect(after.ball.vy).toBeGreaterThan(0);
    expect(after.rally).toBe(1);
  });

  it('predicts crossings through wall bounces', () => {
    expect(interceptY({ x: 200, y: 150, vx: -5, vy: 0 }, 26)).toBeCloseTo(150);
    const y = interceptY({ x: 200, y: 20, vx: -5, vy: -5 }, 26);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(H);
  });

  it('points, serves towards the side that conceded, and the target ends the game', () => {
    let g = run(newPong(3, 'easy', 3), () => 'idle');
    expect(pongOver(g)).toBe(true);
    expect(g.scores[1]).toBe(3);
    g = run(newPong(3, 'easy', 3), trackerPolicy);
    expect(g.scores[0]).toBe(3);
  });

  it('skill levels separate a simple player', () => {
    let easy = 0;
    let hard = 0;
    for (let s = 1; s <= 10; s++) {
      if (run(newPong(s, 'easy', 3), followerPolicy).scores[0] === 3) easy++;
      if (run(newPong(s, 'hard', 3), followerPolicy).scores[0] === 3) hard++;
    }
    expect(easy).toBeGreaterThan(hard);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { options: { level: 'easy', length: 'short' } }],
  playouts: 2,
  maxSteps: 20000,
  illegalActions: () => ['jump', 'left'] as unknown as PongAction[],
});
