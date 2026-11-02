import { describe, expect, it } from 'vitest';
import { TILE } from '../../shared/platform/physics';
import {
  COLS,
  ROOMS,
  ROWS,
  hopperPolicy,
  newHop,
  plannerPolicy,
  stepHop,
  type Hop,
  type HopAction,
} from '../sim';

const run = (s: Hop, a: HopAction | HopAction[], n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying && !t.cleared; i++)
    t = stepHop(t, Array.isArray(a) ? a[i % a.length]! : a);
  return t;
};
const inRoom = (room: number): Hop => {
  let s = newHop();
  s = { ...s, room, hero: { ...s.hero } };
  const rows = ROOMS[room]!.rows;
  const ty = rows.findIndex((r) => r.includes('P'));
  const tx = rows[ty]!.indexOf('P');
  return { ...s, hero: { ...s.hero, x: tx * TILE + 3, y: (ty + 1) * TILE - 14 } };
};

function play(policy: (s: Hop) => HopAction, cap: number) {
  let s = newHop();
  while (!s.over && s.steps < cap) s = stepHop(s, policy(s));
  return s;
}

describe('Spike Hop rooms', () => {
  it('eight closed rooms of 20 × 14, each with one start and one door', () => {
    expect(ROOMS).toHaveLength(8);
    for (const { rows } of ROOMS) {
      expect(rows).toHaveLength(ROWS);
      for (const r of rows) expect(r).toHaveLength(COLS);
      expect(rows.join('').split('P')).toHaveLength(2);
      expect(rows.join('').split('D')).toHaveLength(2);
    }
  });
});

describe('Spike Hop moves', () => {
  it('runs, and jumps higher while the button is held', () => {
    const s = run(newHop(), 'right', 20);
    expect(s.hero.vx).toBeCloseTo(2);
    const rise = (hold: number) => {
      let t = newHop();
      let top = t.hero.y;
      for (let i = 0; i < 50; i++) {
        t = stepHop(t, i < hold ? 'jump' : 'idle');
        top = Math.min(top, t.hero.y);
      }
      return newHop().hero.y - top;
    };
    expect(rise(40)).toBeGreaterThan(55);
    expect(rise(2)).toBeLessThan(35);
  });

  it('slides down a wall it presses against and kicks off it', () => {
    // The chimney: start in the shaft and jump at its right wall.
    let s = inRoom(2);
    s = run(s, 'right-jump', 30);
    s = run(s, 'right', 20);
    expect(s.hero.wall).toBe(1);
    expect(s.hero.vy).toBeLessThanOrEqual(1.2);
    s = stepHop({ ...s, prevJump: false }, 'jump');
    expect(s.events).toContain('wall-jump');
    expect(s.hero.vx).toBeLessThan(0);
  });

  it('dashes once in the air, recharging on the ground', () => {
    // The spring room has a solid floor.
    let s = inRoom(4);
    s = run(s, 'jump', 8);
    const x0 = s.hero.x;
    s = stepHop(s, 'right-dash');
    expect(s.events).toContain('dash');
    s = run(s, 'right-dash', 9);
    expect(s.hero.x - x0).toBeGreaterThan(38);
    expect(s.hero.canDash).toBe(false);
    s = stepHop(s, 'idle');
    s = stepHop(s, 'right-dash');
    expect(s.events).not.toContain('dash');
    s = run(s, 'idle', 60);
    expect(s.hero.ground).toBe(true);
    expect(s.hero.canDash).toBe(true);
  });

  it('springs throw the hero high', () => {
    let s = inRoom(4);
    const springX = ROOMS[4]!.rows[11]!.indexOf('S') * TILE;
    s = { ...s, hero: { ...s.hero, x: springX + 3 } };
    s = stepHop(s, 'idle');
    expect(s.events).toContain('spring');
    let top = s.hero.y;
    for (let i = 0; i < 40; i++) {
      s = stepHop(s, 'idle');
      top = Math.min(top, s.hero.y);
    }
    expect(11 * TILE - top).toBeGreaterThan(120);
  });

  it('spikes kill; the hero comes back at the room start and the death is counted', () => {
    let s = newHop();
    s = run(s, 'right', 200);
    expect(s.events).toContain('die');
    for (let i = 0; i < 30; i++) s = stepHop(s, 'idle');
    expect(s.deaths).toBe(1);
    expect(s.score).toBe(-25);
    expect(s.hero.x).toBe(newHop().hero.x);
  });

  it('a door clears the room; time running out ends the run', () => {
    const rows = ROOMS[0]!.rows;
    const doorX = rows[11]!.indexOf('D') * TILE;
    let s = newHop();
    s = { ...s, hero: { ...s.hero, x: doorX - 14 } };
    s = run(s, 'right', 30);
    expect(s.events).toContain('door');
    for (let i = 0; i < 60; i++) s = stepHop(s, 'idle');
    expect(s.room).toBe(1);
    expect(s.score).toBe(1000);
    const late = stepHop({ ...newHop(), time: 1 }, 'idle');
    expect(late.over).toBe(true);
  });
});

describe('Spike Hop players', () => {
  it('the planner clears all eight rooms; the hopper gets stuck', () => {
    const planner = play(plannerPolicy, 60 * 60 * 3);
    expect(planner.won).toBe(true);
    const hopper = play(hopperPolicy, 60 * 60);
    expect(hopper.won).toBe(false);
    expect(hopper.room).toBeLessThan(planner.room + 1);
  }, 120_000);

  it('replays exactly', () => {
    expect(play(plannerPolicy, 900)).toEqual(play(plannerPolicy, 900));
  }, 60_000);
});
