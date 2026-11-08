import { describe, expect, it } from 'vitest';
import {
  RUN_X,
  hopperPolicy,
  metres,
  move,
  newRun,
  runnerPolicy,
  scoreOf,
  speedAt,
  stepRun,
  type Run,
  type RunAction,
  type Thing,
} from '../sim';

const play = (s0: Run, policy: (s: Run) => RunAction, max: number) => {
  let s = s0;
  while (!s.over && s.steps < max) s = stepRun(s, policy(s));
  return s;
};

/** A flat world: one long roof at y 150 and the given things. */
const flat = (things: Thing[] = []): Run => ({
  ...newRun(1),
  roofs: [{ x0: -200, x1: 100000, y: 150 }],
  things,
});

describe('Rooftop Dash rules', () => {
  it('runs right on its own, faster with the distance', () => {
    const s = newRun(1);
    expect(s.body.y).toBe(150);
    const t = stepRun(s, 'idle');
    expect(t.x).toBeCloseTo(3);
    expect(speedAt(0)).toBe(3);
    expect(speedAt(20000)).toBeCloseTo(4.5);
    expect(speedAt(90000)).toBe(6);
    expect(metres(2000)).toBe(100);
  });

  it('holding the jump goes higher than tapping it', () => {
    const peak = (hold: number) => {
      let s = flat();
      let top = 150;
      for (let k = 0; k < 80; k++) {
        s = stepRun(s, k < hold ? 'jump' : 'idle');
        top = Math.min(top, s.body.y);
      }
      expect(s.body.air).toBe(0);
      return 150 - top;
    };
    expect(peak(1)).toBeLessThan(35);
    expect(peak(40)).toBeGreaterThan(55);
  });

  it('standing still on the jump button keeps hopping; a jump still works just off an edge', () => {
    let s = flat();
    let jumps = 0;
    for (let k = 0; k < 120; k++) {
      s = stepRun(s, 'jump');
      if (s.events.includes('jump')) jumps++;
    }
    expect(jumps).toBeGreaterThan(2);
    // Run off the end of a roof, then jump 3 steps later.
    let e: Run = {
      ...newRun(1),
      roofs: [
        { x0: -200, x1: 2, y: 150 },
        { x0: 60, x1: 2000, y: 150 },
      ],
      things: [],
    };
    let k = 0;
    while (e.body.air < 3) {
      e = stepRun(e, 'idle');
      k++;
    }
    e = stepRun(e, 'jump');
    expect(e.events).toContain('jump');
    expect(k).toBeLessThan(10);
  });

  it('a gap is fatal unless jumped', () => {
    const world = (s: Run): Run => ({
      ...s,
      roofs: [
        { x0: -200, x1: 60, y: 150 },
        { x0: 110, x1: 100000, y: 150 },
      ],
      things: [],
    });
    const fell = play(world(newRun(1)), () => 'idle', 400);
    expect(fell.over).toBe(true);
    expect(fell.cause).toBe('fall');
    const jumped = play(world(newRun(1)), (s) => (s.x > 30 && s.x < 70 ? 'jump' : 'idle'), 120);
    expect(jumped.over).toBe(false);
    expect(jumped.body.air).toBe(0);
    expect(jumped.x).toBeGreaterThan(110);
  });

  it('a higher roof stops a runner who does not jump up onto it', () => {
    const s: Run = {
      ...newRun(1),
      roofs: [
        { x0: -200, x1: 60, y: 150 },
        { x0: 60, x1: 100000, y: 130 },
      ],
      things: [],
    };
    expect(play(s, () => 'idle', 200).cause).toBe('wall');
    const up = play(s, (r) => (r.x > 20 && r.x < 50 ? 'jump' : 'idle'), 200);
    expect(up.over).toBe(false);
    expect(up.body.y).toBe(130);
  });

  it('chimneys must be jumped and drones slid under (or jumped)', () => {
    const chimney: Thing = { kind: 'chimney', x: 100, y: 134, w: 12, h: 16 };
    const drone: Thing = { kind: 'drone', x: 100, y: 120, w: 16, h: 14 };
    expect(play(flat([chimney]), () => 'idle', 100).cause).toBe('chimney');
    expect(play(flat([chimney]), () => 'duck', 100).cause).toBe('chimney');
    expect(play(flat([chimney]), (s) => (s.x > 60 && s.x < 90 ? 'jump' : 'idle'), 100).over).toBe(
      false,
    );
    expect(play(flat([drone]), () => 'idle', 100).cause).toBe('drone');
    expect(play(flat([drone]), () => 'duck', 100).over).toBe(false);
    expect(play(flat([drone]), (s) => (s.x > 50 && s.x < 110 ? 'jump' : 'idle'), 100).over).toBe(
      false,
    );
  });

  it('sliding in the air drops faster', () => {
    const fall = (a: RunAction) => {
      let [b] = move({ y: 100, vy: 0, air: 5, ducking: false, held: 0 }, 0, a, [], []);
      for (let k = 0; k < 10; k++) [b] = move(b, 0, a, [], []);
      return b.y;
    };
    expect(fall('duck')).toBeGreaterThan(fall('idle') + 20);
  });

  it('coins are collected and score ten points each', () => {
    const coins: Thing[] = [20, 40, 60].map((x) => ({ kind: 'coin', x, y: 138, w: 5, h: 5 }));
    const s = play(flat(coins), () => 'idle', 30);
    expect(s.coins).toBe(3);
    expect(scoreOf(s)).toBe(metres(s.x) + 30);
    // A coin high above is missed by a runner who does not jump.
    expect(play(flat([{ kind: 'coin', x: 40, y: 80, w: 5, h: 5 }]), () => 'idle', 30).coins).toBe(
      0,
    );
  });

  it('the world keeps being built ahead and forgotten behind', () => {
    let s = newRun(3);
    for (let k = 0; k < 2000; k++) s = stepRun(s, runnerPolicy(s));
    expect(s.roofs[s.roofs.length - 1]!.x1).toBeGreaterThan(s.x + 360);
    expect(s.roofs[0]!.x1).toBeGreaterThan(s.x - RUN_X - 40);
    expect(s.roofs.length).toBeLessThan(12);
  });

  it('the planner runs three minutes on any seed; the hopper and an idle runner do not', () => {
    for (const seed of [1, 2, 3]) {
      const s = play(newRun(seed), runnerPolicy, 60 * 60 * 3);
      expect(s.over).toBe(false);
      expect(s.dying).toBe(0);
      expect(s.coins).toBeGreaterThan(100);
      expect(play(newRun(seed), hopperPolicy, 60 * 60 * 3).over).toBe(true);
      expect(metres(play(newRun(seed), () => 'idle', 60 * 60).x)).toBeLessThan(60);
    }
  }, 60_000);

  it('replays exactly from the same seed and actions', () => {
    const a = play(newRun(9), runnerPolicy, 1500);
    const b = play(newRun(9), runnerPolicy, 1500);
    expect(b).toEqual(a);
  });
});
