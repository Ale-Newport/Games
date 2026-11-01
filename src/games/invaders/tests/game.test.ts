import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import {
  alienX,
  alienY,
  ALIEN_H,
  COLS,
  gunnerPolicy,
  newInvaders,
  PLAYER_Y,
  ROWS,
  stepInvaders,
  type InvAction,
  type Invaders,
} from '../sim';

describe('Invaders simulation', () => {
  it('one shot at a time; a hit scores by row', () => {
    let s = newInvaders(1);
    s = stepInvaders(s, 'fire');
    expect(s.shot).not.toBeNull();
    const first = s.shot;
    s = stepInvaders(s, 'fire');
    expect(s.shot!.y).toBeLessThan(first!.y);
    // A shot just under the bottom-left invader.
    const t: Invaders = {
      ...newInvaders(1),
      shot: { x: alienX(newInvaders(1), 0) + 8, y: alienY(newInvaders(1), ROWS - 1) + ALIEN_H + 4 },
    };
    const u = stepInvaders(t, 'idle');
    expect(u.alive[(ROWS - 1) * COLS]).toBe(false);
    expect(u.score).toBe(10);
  });

  it('the formation marches, steps down at an edge and speeds up as it thins', () => {
    let s = newInvaders(2);
    const x0 = s.fx;
    for (let i = 0; i < 3; i++) s = stepInvaders(s, 'idle');
    expect(s.fx).toBeGreaterThan(x0);
    const edge: Invaders = { ...newInvaders(2), fx: 360 - 6 - (COLS - 1) * 24 - 16 - 2, timer: 1 };
    const down = stepInvaders(edge, 'idle');
    expect(down.fy).toBeGreaterThan(edge.fy);
    expect(down.dir).toBe(-1);
    const few: Invaders = {
      ...newInvaders(2),
      alive: newInvaders(2).alive.map((_, i) => i === 0),
      timer: 1,
    };
    expect(stepInvaders(few, 'idle').timer).toBeLessThan(
      stepInvaders({ ...newInvaders(2), timer: 1 }, 'idle').timer,
    );
  });

  it('a bomb on the cannon costs a life; invaders at the cannon row end the game', () => {
    const s0 = newInvaders(3);
    const s: Invaders = { ...s0, bombs: [{ x: s0.player, y: PLAYER_Y - 6, kind: 0 }] };
    const t = stepInvaders(s, 'idle');
    expect(t.lives).toBe(2);
    expect(t.dying).toBeGreaterThan(0);
    const low: Invaders = { ...s0, fy: PLAYER_Y - (ROWS - 1) * 20, timer: 5 };
    expect(stepInvaders(low, 'idle').over).toBe(true);
  });

  it('a cleared wave brings a new, lower one', () => {
    const s0 = newInvaders(4);
    const last: Invaders = {
      ...s0,
      alive: s0.alive.map((_, i) => i === 0),
      shot: { x: alienX(s0, 0) + 8, y: alienY(s0, 0) + 12 },
    };
    const t = stepInvaders(last, 'idle');
    expect(t.wave).toBe(2);
    expect(t.alive.every(Boolean)).toBe(true);
    expect(t.fy).toBeGreaterThan(s0.fy);
  });

  it('the gunner outscores standing still', () => {
    let g = newInvaders(5);
    while (!g.over && g.steps < 60 * 120) g = stepInvaders(g, gunnerPolicy(g));
    let idle = newInvaders(5);
    while (!idle.over) idle = stepInvaders(idle, 'idle');
    expect(g.score).toBeGreaterThan(300);
    expect(idle.score).toBe(0);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'up'] as unknown as InvAction[],
});
