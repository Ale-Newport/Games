import { describe, expect, it } from 'vitest';
import {
  CALM,
  MAX_ANGLE,
  balancerPolicy,
  halfLength,
  leanerPolicy,
  newCart,
  physics,
  scoreOf,
  stepCart,
  type Cart,
  type CartAction,
} from '../sim';

const play = (s0: Cart, policy: (s: Cart) => CartAction, max: number) => {
  let s = s0;
  while (!s.over && s.steps < max) s = stepCart(s, policy(s));
  return s;
};

describe('Balancing Cart rules', () => {
  it('starts on the middle of the rail with a slight lean', () => {
    const s = newCart(1);
    expect(s.x).toBe(0);
    expect(Math.abs(s.a)).toBeGreaterThan(0.015);
    expect(Math.abs(s.a)).toBeLessThan(0.05);
    expect(newCart(1, 'short').pole).toBe('short');
  });

  it('left alone, the pole falls; the short one sooner', () => {
    const long = play(newCart(1, 'long'), () => 'idle', 1000);
    const short = play(newCart(1, 'short'), () => 'idle', 1000);
    expect(long.cause).toBe('fell');
    expect(short.cause).toBe('fell');
    expect(short.steps).toBeLessThan(long.steps);
    expect(Math.abs(long.a)).toBeGreaterThan(MAX_ANGLE);
  });

  it('pushing the cart right swings an upright pole to the left, and moves the cart', () => {
    const [x, v, a, w] = physics(0, 0, 0, 0, 4, 0, halfLength('long'));
    expect(v).toBeGreaterThan(0);
    expect(w).toBeLessThan(0);
    expect(x).toBe(0);
    expect(a).toBe(0);
  });

  it('gravity pulls a leaning pole further over', () => {
    const [, , , w] = physics(0, 0, 0.1, 0, 0, 0, 2);
    expect(w).toBeGreaterThan(0);
    const [, , , w2] = physics(0, 0, -0.1, 0, 0, 0, 2);
    expect(w2).toBeCloseTo(-w);
  });

  it('running off the end of the rail ends the run', () => {
    // Hold the pole up while drifting: push right whenever it leans right, else nothing, from a moving start.
    const s = play({ ...newCart(2), v: 3, a: 0 }, (r) => (r.a > 0 ? 'right' : 'idle'), 2000);
    expect(s.over).toBe(true);
    expect(s.cause).toBe('rail');
  });

  it('the first 20 seconds are calm; gusts follow, getting stronger', () => {
    let s = newCart(3);
    const gusts: number[] = [];
    while (s.steps < CALM + 60 * 120) {
      s = stepCart(s, balancerPolicy(s));
      if (s.events.includes('gust')) gusts.push(Math.abs(s.gust));
      if (s.steps === CALM - 1) expect(gusts).toHaveLength(0);
    }
    expect(s.over).toBe(false);
    expect(gusts.length).toBeGreaterThan(18);
    expect(gusts.length).toBeLessThan(42);
    expect(Math.max(...gusts.slice(-5))).toBeGreaterThan(Math.max(...gusts.slice(0, 3)));
    expect(Math.max(...gusts)).toBeLessThanOrEqual(3);
  });

  it('the score is tenths of a second', () => {
    const s = play(newCart(1), balancerPolicy, 125);
    expect(scoreOf(s)).toBe(20);
  });

  it('the balancer holds both poles for five minutes; the leaner runs off the rail', () => {
    for (const pole of ['long', 'short'] as const)
      for (const seed of [1, 2]) {
        const s = play(newCart(seed, pole), balancerPolicy, 60 * 60 * 5);
        expect(s.over).toBe(false);
        expect(Math.abs(s.x)).toBeLessThan(2);
        const l = play(newCart(seed, pole), leanerPolicy, 60 * 60 * 5);
        expect(l.cause).toBe('rail');
        expect(l.steps).toBeGreaterThan(60 * 5);
      }
  });

  it('replays exactly from the same seed and actions', () => {
    const a = play(newCart(9), balancerPolicy, 3000);
    const b = play(newCart(9), balancerPolicy, 3000);
    expect(b).toEqual(a);
  });
});
