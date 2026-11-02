import { describe, expect, it } from 'vitest';
import {
  COLS,
  ROWS,
  TICK,
  grabberPolicy,
  idx,
  makeCave,
  minerPolicy,
  newDig,
  stepDig,
  type Dig,
  type DigAction,
  type Tile,
} from '../sim';
import { seedRng } from '../../../core/game-engine/random';

/** A cave of earth inside steel with the given tiles placed; the digger at (5, 5). */
function cave(place: [number, number, Tile][], fill: Tile = '.'): Dig {
  const s = newDig(1);
  const grid = s.grid.map((_, i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    return c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1 ? '#' : fill;
  }) as Tile[];
  for (const [c, r, t] of place) grid[idx(c, r)] = t;
  grid[idx(5, 5)] = '@';
  return {
    ...s,
    grid,
    digger: idx(5, 5),
    facing: {},
    falling: [],
    blast: {},
    need: 2,
    gems: 0,
    open: false,
  };
}
/** Plays whole ticks with one action. */
const ticks = (s: Dig, a: DigAction, n: number) => {
  let t = s;
  for (let k = 0; k < n * TICK && !t.dying && !t.exited; k++) t = stepDig(t, a);
  return t;
};
function play(seed: number, policy: (s: Dig) => DigAction, cap: number) {
  let s = newDig(seed);
  while (!s.over && s.steps < cap) s = stepDig(s, policy(s));
  return s;
}

describe('Gem Digger caves', () => {
  it('a steel-bound cave with the digger, the exit, enough gems and some enemies', () => {
    const made = makeCave(seedRng(7), 1);
    const g = made.grid;
    for (let c = 0; c < COLS; c++) expect([g[idx(c, 0)], g[idx(c, ROWS - 1)]]).toEqual(['#', '#']);
    expect(g.filter((t) => t === '@')).toHaveLength(1);
    expect(g.filter((t) => t === 'E')).toHaveLength(1);
    expect(g.filter((t) => t === '*').length).toBeGreaterThan(made.need);
    expect(g.filter((t) => t === 'x' || t === 'm').length).toBeGreaterThan(0);
    expect(makeCave(seedRng(7), 1).grid).toEqual(g);
  });
});

describe('Gem Digger physics', () => {
  it('the digger moves once a tick, leaving an empty tunnel', () => {
    let s = cave([]);
    s = stepDig(s, 'right');
    s = ticks(s, 'right', 1);
    expect(s.digger).toBe(idx(6, 5));
    expect(s.grid[idx(5, 5)]).toBe(' ');
  });

  it('boulders fall into empty space and roll off round things', () => {
    let s = cave([
      [10, 3, 'o'],
      [10, 4, ' '],
      [10, 5, ' '],
      [20, 5, 'o'],
      [20, 6, 'o'],
      [19, 5, ' '],
      [19, 6, ' '],
    ]);
    s = ticks(s, 'idle', 3);
    expect(s.grid[idx(10, 5)]).toBe('o');
    expect(s.grid[idx(19, 6)]).toBe('o');
  });

  it('a falling boulder crushes the digger; one resting on it does not', () => {
    let s = cave([
      [5, 2, 'o'],
      [5, 3, ' '],
      [5, 4, ' '],
    ]);
    s = ticks(s, 'idle', 3);
    expect(s.events).toContain('crushed');
    let rest = cave([[5, 4, 'o']]);
    rest = ticks(rest, 'idle', 4);
    expect(rest.dying).toBe(0);
    expect(rest.grid[idx(5, 4)]).toBe('o');
  });

  it('pushing a boulder into empty space takes two ticks of leaning', () => {
    let s = cave([
      [6, 5, 'o'],
      [7, 5, ' '],
      [7, 6, '#'],
    ]);
    s = ticks(s, 'right', 1);
    expect(s.grid[idx(6, 5)]).toBe('o');
    s = ticks(s, 'right', 1);
    expect(s.grid[idx(7, 5)]).toBe('o');
    expect(s.digger).toBe(idx(6, 5));
  });

  it('gems open the exit; the exit leads to the next cave with a time bonus', () => {
    let s = cave([
      [6, 5, '*'],
      [7, 5, '*'],
      [8, 5, 'E'],
    ]);
    s = ticks(s, 'right', 2);
    expect(s.gems).toBe(2);
    expect(s.open).toBe(true);
    s = ticks(s, 'right', 1);
    expect(s.exited).toBeGreaterThan(0);
    expect(s.score).toBeGreaterThan(20);
    for (let i = 0; i < 120; i++) s = stepDig(s, 'idle');
    expect(s.cave).toBe(2);
  });

  it('sparks next to the digger are fatal; a boulder crushing a moth leaves gems', () => {
    let s = cave([
      [6, 5, ' '],
      [7, 5, 'x'],
    ]);
    s = { ...s, facing: { [idx(7, 5)]: 3 } };
    s = ticks(s, 'idle', 2);
    expect(s.events).toContain('enemy');
    let m = cave([
      [20, 7, 'o'],
      [20, 8, 'm'],
      [20, 9, '#'],
      [19, 8, '#'],
      [21, 8, '#'],
    ]);
    m = { ...m, falling: [idx(20, 7)] };
    m = ticks(m, 'idle', 4);
    expect(m.grid.filter((t) => t === '*').length).toBeGreaterThan(3);
  });

  it('a lost life replays the same cave; running out of time costs a life', () => {
    let s = newDig(3);
    const first = s.grid.join('');
    s = { ...s, time: 1 };
    s = stepDig(s, 'idle');
    expect(s.events).toContain('time');
    for (let i = 0; i < 90; i++) s = stepDig(s, 'idle');
    expect(s.lives).toBe(2);
    expect(s.grid.join('')).toBe(first);
  });
});

describe('Gem Digger players', () => {
  it('the miner collects more gems than the grabber, which runs into trouble', () => {
    const miner = play(1, minerPolicy, 60 * 70);
    const grabber = play(1, grabberPolicy, 60 * 70);
    expect(miner.gems + (miner.cave - 1) * 100).toBeGreaterThan(
      grabber.gems + (grabber.cave - 1) * 100,
    );
  }, 120_000);

  it('replays exactly from a seed', () => {
    expect(play(2, minerPolicy, 800)).toEqual(play(2, minerPolicy, 800));
  }, 60_000);
});
