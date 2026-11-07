import { describe, expect, it } from 'vitest';
import {
  CUBES,
  HOP,
  ROWS,
  cubeIndex,
  discFor,
  eagerPolicy,
  newCubes,
  plannerPolicy,
  stepCubes,
  type CubeAction,
  type Cubes,
} from '../sim';

/** A quiet game: no balls arriving. */
const quiet = (s: Cubes): Cubes => ({ ...s, spawnIn: 1e9 });
const hop = (s: Cubes, a: CubeAction) => {
  let t = stepCubes(s, a);
  for (let i = 0; i < HOP; i++) t = stepCubes(t, 'idle');
  return t;
};
function play(seed: number, policy: (s: Cubes) => CubeAction, cap: number) {
  let s = newCubes(seed);
  while (!s.over && s.steps < cap) s = stepCubes(s, policy(s));
  return s;
}

describe('Cube Hopper', () => {
  it('a pyramid of 28 cubes; landing changes a cube; hopping off is a fall', () => {
    expect(CUBES).toBe(28);
    let s = quiet(newCubes(1));
    s = hop(s, 'down-right');
    expect(s.hero.at).toEqual([1, 1]);
    expect(s.tops[cubeIndex([1, 1])]).toBe(1);
    expect(s.score).toBe(25);
    // Landing again on a finished cube changes nothing on level 1.
    s = hop(hop(s, 'up-left'), 'down-right');
    expect(s.score).toBe(50);
    let off: Cubes = {
      ...quiet(newCubes(1)),
      hero: { at: [ROWS - 1, 0] as [number, number], to: null, left: 0 },
    };
    off = hop(off, 'down-left');
    expect(off.events).toContain('fall');
  });

  it('level 2 takes two landings per cube; level 3 toggles', () => {
    let two = { ...quiet(newCubes(1)), level: 2 };
    two = hop(two, 'down-right');
    expect(two.tops[cubeIndex([1, 1])]).toBe(1);
    two = hop(hop(two, 'up-left'), 'down-right');
    expect(two.tops[cubeIndex([1, 1])]).toBe(2);
    let three = { ...quiet(newCubes(1)), level: 3 };
    three = hop(three, 'down-right');
    expect(three.tops[cubeIndex([1, 1])]).toBe(1);
    three = hop(hop(three, 'up-left'), 'down-right');
    expect(three.tops[cubeIndex([1, 1])]).toBe(0);
  });

  it('a disc carries the hopper to the top and lures a spring close behind into the void', () => {
    let s = quiet(newCubes(1));
    const disc = s.discs.find((d) => d.side < 0)!;
    s = {
      ...s,
      hero: { at: [disc.row, 0], to: null, left: 0 },
      spring: { at: [disc.row - 1, 0], to: null, left: 0, wait: 99 },
    };
    expect(discFor(s, s.hero.at, 'up-left')).toBeGreaterThanOrEqual(0);
    s = stepCubes(s, 'up-left');
    expect(s.events).toContain('disc');
    expect(s.events).toContain('lured');
    expect(s.spring).toBeNull();
    expect(s.score).toBe(500);
    for (let i = 0; i < 90; i++) s = stepCubes(s, 'idle');
    expect(s.hero.at).toEqual([0, 0]);
    expect(s.discs).toHaveLength(1);
  });

  it('a red ball landing on the hopper costs a life; a green one freezes everything', () => {
    let s = quiet(newCubes(1));
    s = {
      ...s,
      hero: { at: [2, 1], to: null, left: 0 },
      balls: [{ at: [1, 1], to: [2, 1], left: 1, kind: 'red', wait: 30 }],
    };
    s = stepCubes(s, 'idle');
    expect(s.events).toContain('caught');
    for (let i = 0; i < 90; i++) s = stepCubes(s, 'idle');
    expect(s.lives).toBe(2);
    let g = quiet(newCubes(1));
    g = {
      ...g,
      hero: { at: [2, 1], to: null, left: 0 },
      balls: [{ at: [1, 1], to: [2, 1], left: 1, kind: 'green', wait: 30 }],
    };
    g = stepCubes(g, 'idle');
    expect(g.events).toContain('freeze');
    expect(g.frozen).toBeGreaterThan(0);
  });

  it('a purple ball hatches at the bottom into a spring that hops after the hopper', () => {
    let s = quiet(newCubes(1));
    s = {
      ...s,
      hero: { at: [3, 1], to: null, left: 0 },
      balls: [{ at: [ROWS - 2, 3], to: [ROWS - 1, 3], left: 1, kind: 'purple', wait: 30 }],
    };
    s = stepCubes(s, 'idle');
    expect(s.events).toContain('hatch');
    const d0 = Math.abs(s.spring!.at[0] - 3) + Math.abs(s.spring!.at[1] - 1);
    for (let i = 0; i < 80 && !s.dying; i++) s = stepCubes(s, 'idle');
    const sp = s.spring!;
    expect(Math.abs(sp.at[0] - 3) + Math.abs(sp.at[1] - 1)).toBeLessThan(d0);
  });

  it('finishing every cube clears the round; four rounds lead to level 2', () => {
    let s = quiet(newCubes(1));
    s = { ...s, tops: s.tops.map((_, i) => (i === cubeIndex([1, 1]) ? 0 : 1)) };
    s = hop(s, 'down-right');
    expect(s.cleared).toBeGreaterThan(0);
    expect(s.score).toBeGreaterThanOrEqual(25 + 1000);
    for (let i = 0; i < 150; i++) s = stepCubes(s, 'idle');
    expect(s.round).toBe(2);
    let last = { ...quiet(newCubes(1)), round: 4 };
    last = { ...last, tops: last.tops.map((_, i) => (i === cubeIndex([1, 1]) ? 0 : 1)) };
    last = hop(last, 'down-right');
    for (let i = 0; i < 150; i++) last = stepCubes(last, 'idle');
    expect([last.level, last.round]).toEqual([2, 1]);
  });

  it('the planner scores more than the eager hopper', () => {
    let planner = 0;
    let eager = 0;
    for (const seed of [1, 2, 3]) {
      planner += play(seed, plannerPolicy, 60 * 60 * 6).score;
      eager += play(seed, eagerPolicy, 60 * 60 * 6).score;
    }
    expect(planner).toBeGreaterThan(eager);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(4, plannerPolicy, 3000)).toEqual(play(4, plannerPolicy, 3000));
  });
});
