import { describe, expect, it } from 'vitest';
import {
  GRAVITY,
  THRUST,
  W,
  brakerPolicy,
  groundAt,
  newLander,
  pilotPolicy,
  stepLander,
  type Lander,
  type LanderAction,
} from '../sim';

function play(seed: number, policy: (s: Lander) => LanderAction, cap: number) {
  let s = newLander(seed);
  while (!s.over && s.steps < cap) s = stepLander(s, policy(s));
  return s;
}
/** Hovering just above a pad's middle, still and upright. */
const abovePad = (s: Lander, mult: number, vy: number, vx = 0, angle = 0): Lander => {
  const p = s.pads.find((k) => k.mult === mult)!;
  return { ...s, x: (p.x0 + p.x1) / 2, y: p.y - 7 - 0.1, vx, vy, angle };
};

describe('Moon Touchdown', () => {
  it('new ground has three flat pads marked ×5, ×3 and ×2, narrower paying more', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = newLander(seed);
      expect(s.pads.map((p) => p.mult).sort()).toEqual([2, 3, 5]);
      const width = (m: number) =>
        s.pads.find((p) => p.mult === m)!.x1 - s.pads.find((p) => p.mult === m)!.x0;
      expect(width(5)).toBeLessThan(width(3));
      expect(width(3)).toBeLessThan(width(2));
      for (const p of s.pads)
        for (let x = p.x0; x <= p.x1; x += 4) expect(groundAt(s, x)).toBeCloseTo(p.y);
    }
  });

  it('falls under gravity; the engine pushes along the lander’s axis and burns fuel', () => {
    let s = newLander(1);
    s = { ...s, vx: 0 };
    const fall = stepLander(s, 'idle');
    expect(fall.vy).toBeCloseTo(GRAVITY);
    const burn = stepLander(s, 'thrust');
    expect(burn.vy).toBeCloseTo(GRAVITY - THRUST);
    expect(burn.fuel).toBe(s.fuel - 1);
    let tilted = s;
    for (let i = 0; i < 10; i++) tilted = stepLander(tilted, 'right');
    expect(tilted.angle).toBeGreaterThan(0);
    tilted = stepLander(tilted, 'thrust');
    expect(tilted.vx).toBeGreaterThan(0);
    // The sky wraps round.
    const edge = stepLander({ ...s, x: W - 0.2, vx: 1 }, 'idle');
    expect(edge.x).toBeLessThan(5);
  });

  it('a gentle, upright touchdown on a pad scores 50 × its mark; anything else is a crash', () => {
    const s = newLander(2);
    const soft = stepLander(abovePad(s, 5, 0.2), 'idle');
    expect(soft.outcome).toBe('landed');
    expect(soft.score).toBe(300);
    const firm = stepLander(abovePad(s, 3, 0.5), 'idle');
    expect(firm.score).toBe(150);
    for (const bad of [
      abovePad(s, 2, 1.2),
      abovePad(s, 2, 0.3, 0.8),
      abovePad(s, 2, 0.3, 0, 0.4),
    ]) {
      const c = stepLander(bad, 'idle');
      expect(c.outcome).toBe('crashed');
      expect(c.fuel).toBe(s.fuel - 200);
    }
  });

  it('a new round brings new ground; the run ends when a round ends with no fuel', () => {
    let s = stepLander(abovePad(newLander(3), 2, 0.2), 'idle');
    const ground = s.ground.join();
    for (let i = 0; i < 120; i++) s = stepLander(s, 'idle');
    expect(s.round).toBe(2);
    expect(s.ground.join()).not.toBe(ground);
    let dry = stepLander(abovePad({ ...newLander(3), fuel: 100 }, 2, 2), 'idle');
    expect(dry.fuel).toBe(0);
    for (let i = 0; i < 120; i++) dry = stepLander(dry, 'idle');
    expect(dry.over).toBe(true);
  });

  it('the pilot lands far more often than the braker', () => {
    let pilot = 0;
    let braker = 0;
    for (const seed of [1, 2, 3]) {
      pilot += play(seed, pilotPolicy, 60 * 60 * 5).landings;
      braker += play(seed, brakerPolicy, 60 * 60 * 5).landings;
    }
    expect(pilot).toBeGreaterThan(10);
    expect(pilot).toBeGreaterThan(braker * 3);
  });

  it('replays exactly from a seed', () => {
    expect(play(5, pilotPolicy, 4000)).toEqual(play(5, pilotPolicy, 4000));
  });
});
