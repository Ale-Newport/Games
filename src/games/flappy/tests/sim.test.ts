import { describe, expect, it } from 'vitest';
import {
  BIRD_X,
  H,
  SEA,
  gapSize,
  newFlight,
  plannerPolicy,
  speed,
  stepFlight,
  trackerPolicy,
  type FlapAction,
  type Flight,
} from '../sim';

const run = (s: Flight, a: FlapAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.over; i++) t = stepFlight(t, a);
  return t;
};
function play(seed: number, policy: (s: Flight) => FlapAction, cap: number) {
  let s = newFlight(seed);
  while (!s.over && s.steps < cap) s = stepFlight(s, policy(s));
  return s;
}

describe('Puffin Flap', () => {
  it('hovers until the first flap, which kicks it up; then it falls into the sea', () => {
    let s = run(newFlight(1), 'idle', 100);
    expect(s.started).toBe(false);
    expect(Math.abs(s.y - (H / 2 - 20))).toBeLessThanOrEqual(4);
    const y0 = s.y;
    s = stepFlight(s, 'flap');
    expect(s.started).toBe(true);
    expect(s.y).toBeLessThan(y0);
    expect(s.events).toContain('flap');
    // Holding the button is one flap, not many.
    const held = run(s, 'flap', 10);
    expect(held.flaps).toBe(1);
    s = run(s, 'idle', 200);
    expect(s.over).toBe(true);
    expect(s.y).toBeGreaterThan(SEA - 20);
  });

  it('scores for every stack passed and crashes into rock', () => {
    let s = stepFlight(newFlight(1), 'flap');
    // Hold the puffin in the middle of each gap as it arrives.
    for (let i = 0; i < 400; i++) {
      const st = s.stacks.find((k) => k.x + 40 >= BIRD_X - 9)!;
      s = { ...s, y: st.gap + st.size / 2, vy: 0 };
      s = stepFlight(s, 'idle');
    }
    expect(s.score).toBeGreaterThanOrEqual(3);
    expect(s.crashed).toBe(0);
    const st = s.stacks.find((k) => k.x > BIRD_X)!;
    let crash: Flight = {
      ...s,
      stacks: s.stacks.map((k) => (k === st ? { ...k, x: BIRD_X - 5 } : k)),
      y: st.gap - 20,
      vy: 0,
    };
    crash = stepFlight(crash, 'idle');
    expect(crash.events).toContain('crash');
  });

  it('keeps consecutive gaps within reach, then narrows them and speeds up', () => {
    let s = newFlight(3);
    for (let i = 0; i < 3000; i++) {
      const st = s.stacks.find((k) => k.x + 40 >= BIRD_X - 9)!;
      s = stepFlight({ ...s, y: st.gap + st.size / 2, vy: 0, started: true }, 'idle');
      for (let k = 1; k < s.stacks.length; k++)
        expect(Math.abs(s.stacks[k]!.gap - s.stacks[k - 1]!.gap)).toBeLessThanOrEqual(120.001);
    }
    expect(gapSize(0)).toBe(100);
    expect(gapSize(60)).toBeLessThan(90);
    expect(speed(70)).toBeGreaterThan(speed(10));
  });

  it('the planner flies further than the tracker; doing nothing scores nothing', () => {
    let planner = 0;
    let tracker = 0;
    for (const seed of [1, 2, 3]) {
      planner += play(seed, plannerPolicy, 60 * 60 * 2).score;
      tracker += play(seed, trackerPolicy, 60 * 60 * 2).score;
    }
    expect(tracker).toBeGreaterThan(30);
    expect(planner).toBeGreaterThan(tracker);
    expect(play(1, () => 'idle', 2000).score).toBe(0);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(4, trackerPolicy, 3000)).toEqual(play(4, trackerPolicy, 3000));
  });
});
