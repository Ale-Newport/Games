import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import { delta, newRocks, pilotPolicy, stepRocks, W, type RockAction, type Rocks } from '../sim';

describe('Space Rocks simulation', () => {
  it('turning, thrusting with momentum, and wrapping at the edges', () => {
    let s = newRocks(1);
    const a0 = s.ship.a;
    s = stepRocks(s, 'l');
    expect(s.ship.a).toBeLessThan(a0);
    for (let i = 0; i < 20; i++) s = stepRocks(s, 't');
    const v = Math.hypot(s.ship.vx, s.ship.vy);
    expect(v).toBeGreaterThan(1);
    for (let i = 0; i < 10; i++) s = stepRocks(s, 'idle');
    expect(Math.hypot(s.ship.vx, s.ship.vy)).toBeGreaterThan(v * 0.8);
    expect(delta(W - 2, 2, W)).toBe(4);
  });

  it('fire needs releasing between shots; at most four in the air', () => {
    let s = newRocks(2);
    s = stepRocks(s, 'f');
    s = stepRocks(s, 'f');
    expect(s.shots).toHaveLength(1);
    for (let i = 0; i < 10; i++) s = stepRocks(s, i % 2 ? 'f' : 'idle');
    expect(s.shots.length).toBeLessThanOrEqual(4);
  });

  it('a shot splits a large rock into two medium ones', () => {
    const s0 = newRocks(3);
    const r = s0.rocks[0]!;
    const s: Rocks = { ...s0, rocks: [r], shots: [{ x: r.x, y: r.y, vx: 0, vy: 0, life: 10 }] };
    const t = stepRocks(s, 'idle');
    expect(t.score).toBe(20);
    expect(t.rocks).toHaveLength(2);
    expect(t.rocks.every((x) => x.size === 1)).toBe(true);
  });

  it('a crash costs a ship; the ship waits for a clear centre', () => {
    const s0 = newRocks(4);
    const s: Rocks = {
      ...s0,
      shield: 0,
      rocks: [{ x: s0.ship.x + 5, y: s0.ship.y, vx: 0, vy: 0, size: 0, shape: 1 }],
    };
    const t = stepRocks(s, 'idle');
    expect(t.lives).toBe(2);
    expect(t.respawn).toBeGreaterThan(0);
  });

  it('the pilot clears fields', () => {
    let s = newRocks(5);
    while (!s.over && s.steps < 60 * 180) s = stepRocks(s, pilotPolicy(s));
    expect(s.score).toBeGreaterThan(2000);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'up'] as unknown as RockAction[],
});
