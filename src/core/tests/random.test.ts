import { describe, expect, it } from 'vitest';
import { Rng, seedRng } from '../game-engine/random';

describe('Rng', () => {
  it('is deterministic for a seed and resumable from its state', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    const seqA = Array.from({ length: 50 }, () => a.uint32());
    expect(Array.from({ length: 50 }, () => b.uint32())).toEqual(seqA);
    const c = new Rng(99);
    c.int(10);
    const resumed = Rng.from(JSON.parse(JSON.stringify(c.state)));
    expect(resumed.uint32()).toBe(c.uint32());
  });

  it('produces different streams for different seeds', () => {
    expect(new Rng(1).uint32()).not.toBe(new Rng(2).uint32());
    expect(seedRng(0).some((w) => w !== 0)).toBe(true);
  });

  it('int() is unbiased enough and in range', () => {
    const rng = new Rng(7);
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 60000; i++) counts[rng.int(6)]++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
    expect(() => rng.int(0)).toThrow();
  });

  it('shuffle returns a permutation without mutating input', () => {
    const rng = new Rng(5);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort()).toEqual(input);
  });

  it('float() stays in [0, 1)', () => {
    const rng = new Rng(11);
    for (let i = 0; i < 10000; i++) {
      const f = rng.float();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });
});
