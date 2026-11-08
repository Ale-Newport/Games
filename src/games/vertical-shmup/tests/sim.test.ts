import { describe, expect, it } from 'vitest';
import {
  H,
  POINTS,
  STAGE_TIME,
  acePolicy,
  newStrike,
  stepStrike,
  sweeperPolicy,
  type Enemy,
  type Strike,
  type StrikeAction,
} from '../sim';

/** No waves arriving. */
const calm = (s: Strike): Strike => ({ ...s, waveIn: 1e9, safe: 0 });
const run = (s: Strike, a: StrikeAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying && !t.over; i++) t = stepStrike(t, a);
  return t;
};
const enemyAt = (kind: Enemy['kind'], x: number, y: number, hp: number): Enemy => ({
  kind,
  x,
  y,
  hp,
  t: 1,
  phase: x,
  fireIn: 1e9,
});
function play(seed: number, policy: (s: Strike) => StrikeAction, cap: number) {
  let s = newStrike(seed);
  while (!s.over && s.steps < cap) s = stepStrike(s, policy(s));
  return s;
}

describe('Nebula Strike', () => {
  it('flies within the lower screen and fires on its own, wider with more power', () => {
    let s = run(calm(newStrike(1)), 'up', 300);
    expect(s.y).toBeCloseTo(H * 0.35);
    s = run(s, 'left', 300);
    expect(s.x).toBe(8);
    const one = stepStrike({ ...calm(newStrike(1)), fireIn: 0 }, 'idle');
    expect(one.shots).toHaveLength(1);
    const five = stepStrike({ ...calm(newStrike(1)), fireIn: 0, power: 5 }, 'idle');
    expect(five.shots).toHaveLength(5);
  });

  it('shots wear enemies down and score', () => {
    let s = calm(newStrike(1));
    // A darter flies its own path from the top; wait under it.
    s = { ...s, x: 120, enemies: [enemyAt('darter', 120, 0, 1)] };
    s = run(s, 'idle', 80);
    expect(s.kills).toBe(1);
    expect(s.score).toBe(POINTS.darter);
  });

  it('a bullet on the core costs a life; then a moment of safety', () => {
    let s = calm(newStrike(1));
    s = { ...s, bullets: [{ x: s.x, y: s.y - 6, vx: 0, vy: 2 }] };
    s = run(s, 'idle', 5);
    expect(s.events).toContain('hit');
    for (let i = 0; i < 90; i++) s = stepStrike(s, 'idle');
    expect(s.lives).toBe(2);
    expect(s.safe).toBeGreaterThan(100);
  });

  it('a bomb clears the bullets and hurts every enemy, once per press', () => {
    let s = calm(newStrike(1));
    s = {
      ...s,
      bullets: [{ x: 50, y: 50, vx: 0, vy: 1 }],
      enemies: [enemyAt('tank', 120, 60, 18)],
    };
    s = stepStrike(s, 'bomb');
    expect(s.bullets).toHaveLength(0);
    expect(s.bombs).toBe(2);
    expect(s.enemies[0]!.hp).toBeLessThanOrEqual(8);
    s = stepStrike(s, 'bomb');
    expect(s.bombs).toBe(2);
  });

  it('pickups raise the power', () => {
    let s = calm(newStrike(1));
    s = { ...s, pickups: [{ x: s.x, y: s.y - 4, kind: 'power' }] };
    s = stepStrike(s, 'idle');
    expect(s.power).toBe(2);
    expect(s.events).toContain('pickup');
  });

  it('after a minute of waves the boss comes; bringing it down starts the next stage', () => {
    let s = calm(newStrike(1));
    s = { ...s, clock: STAGE_TIME - 1 };
    s = stepStrike(s, 'idle');
    expect(s.events).toContain('boss');
    const boss = s.enemies.find((e) => e.kind === 'boss')!;
    s = { ...s, enemies: [{ ...boss, hp: 1, t: 200 }] };
    let down = false;
    for (let i = 0; i < 200 && !down; i++) {
      const b = s.enemies.find((e) => e.kind === 'boss');
      s = stepStrike({ ...s, x: b ? b.x : s.x, bullets: [] }, 'idle');
      down = s.events.includes('stage');
    }
    expect(down).toBe(true);
    expect(s.stage).toBe(2);
    expect(s.score).toBeGreaterThanOrEqual(POINTS.boss);
  });

  it('the ace survives far longer than the sweeper', () => {
    let ace = 0;
    let sweeper = 0;
    for (const seed of [1, 2]) {
      ace += play(seed, acePolicy, 60 * 60 * 2).steps;
      sweeper += play(seed, sweeperPolicy, 60 * 60 * 2).steps;
    }
    expect(ace).toBeGreaterThan(sweeper * 2);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(3, acePolicy, 2000)).toEqual(play(3, acePolicy, 2000));
  });
});
