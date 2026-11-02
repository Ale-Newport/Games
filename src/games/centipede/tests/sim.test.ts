import { describe, expect, it } from 'vitest';
import {
  CELL,
  COLS,
  H,
  PATCH,
  ROWS,
  gunnerPolicy,
  newGuard,
  sprinklerPolicy,
  stepGuard,
  type Guard,
  type GuardAction,
  type Segment,
} from '../sim';

const run = (s: Guard, a: GuardAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.over && !t.dying; i++) t = stepGuard(t, a);
  return t;
};
const empty = (s: Guard): Guard => ({ ...s, stones: s.stones.map(() => 0), beetleIn: 1e9 });
const seg = (c: number, r: number, dx: 1 | -1, head = false): Segment => ({
  c,
  r,
  dx,
  dy: 1,
  head,
});
function play(seed: number, policy: (s: Guard) => GuardAction, cap: number) {
  let s = newGuard(seed);
  while (!s.over && s.steps < cap) s = stepGuard(s, policy(s));
  return s;
}

describe('Garden Guard', () => {
  it('starts with a twelve-segment caterpillar, stones above the patch and the gardener in it', () => {
    const s = newGuard(1);
    expect(s.segments).toHaveLength(12);
    expect(s.segments.filter((g) => g.head)).toHaveLength(1);
    const placed = s.stones.map((h, i) => (h ? Math.floor(i / COLS) : -1)).filter((r) => r >= 0);
    expect(placed.length).toBeGreaterThan(30);
    expect(Math.max(...placed)).toBeLessThan(PATCH);
    expect(s.y).toBeGreaterThan(PATCH * CELL);
  });

  it('crawls sideways and turns down a row at edges and stones', () => {
    let s = { ...empty(newGuard(1)), segments: [seg(COLS - 1, 2, 1, true)], tick: 1 };
    s = stepGuard(s, 'idle');
    expect([s.segments[0]!.c, s.segments[0]!.r, s.segments[0]!.dx]).toEqual([COLS - 1, 3, -1]);
    const stones = s.stones.slice();
    stones[3 * COLS + 25] = 3;
    let t: Guard = { ...s, stones, segments: [seg(26, 3, -1, true)], tick: 1 };
    t = stepGuard(t, 'idle');
    expect([t.segments[0]!.c, t.segments[0]!.r]).toEqual([26, 4]);
  });

  it('a shot segment becomes a stone and splits the caterpillar; heads score more', () => {
    let s = empty(newGuard(1));
    const c = Math.floor(s.x / CELL);
    s = {
      ...s,
      segments: [seg(c + 1, 20, -1, true), seg(c, 20, -1), seg(c - 1, 20, -1)],
      tick: 1e9,
    };
    s = stepGuard(s, 'fire');
    expect(s.shot).not.toBeNull();
    // Only one drop at a time.
    const again = stepGuard(s, 'fire');
    expect(again.shot!.y).toBeLessThan(s.shot!.y);
    s = run(s, 'idle', 40);
    expect(s.score).toBe(10);
    expect(s.segments).toHaveLength(2);
    expect(s.segments.filter((g) => g.head)).toHaveLength(2);
    expect(s.stones[20 * COLS + c]).toBe(3);
  });

  it('stones take three hits', () => {
    let s = empty(newGuard(1));
    const c = Math.floor(s.x / CELL);
    const stones = s.stones.slice();
    stones[10 * COLS + c] = 3;
    s = { ...s, stones, segments: [seg(0, 0, 1, true)], tick: 1e9 };
    for (let k = 0; k < 3; k++) s = run(stepGuard(s, 'fire'), 'idle', 60);
    expect(s.stones[10 * COLS + c]).toBe(0);
    expect(s.score).toBe(1);
  });

  it('the gardener stays in the patch and out of stones', () => {
    let s = run(empty(newGuard(1)), 'up', 200);
    expect(s.y).toBeGreaterThanOrEqual(PATCH * CELL + 4);
    s = run(s, 'down-left', 400);
    expect(s.x).toBeGreaterThanOrEqual(4);
    expect(s.y).toBeLessThanOrEqual(H - 4);
  });

  it('in the patch the caterpillar bounces between its top and the bottom row', () => {
    let s = { ...empty(newGuard(1)), segments: [seg(0, ROWS - 1, -1, true)], tick: 1, x: 200 };
    for (let i = 0; i < 300; i++) {
      s = stepGuard({ ...s, tick: 1, x: 200, y: H - 6 }, 'idle');
      expect(s.segments[0]!.r).toBeLessThanOrEqual(ROWS - 1);
      expect(s.segments[0]!.r).toBeGreaterThanOrEqual(PATCH);
      if (s.dying) break;
    }
  });

  it('touching a segment costs a life; worn stones grow back', () => {
    let s = empty(newGuard(1));
    const stones = s.stones.slice();
    stones[5 * COLS + 5] = 1;
    s = {
      ...s,
      stones,
      segments: [seg(Math.floor(s.x / CELL), Math.floor(s.y / CELL), 1, true)],
      tick: 1e9,
    };
    s = stepGuard(s, 'idle');
    expect(s.events).toContain('hurt');
    for (let i = 0; i < 90; i++) s = stepGuard(s, 'idle');
    expect(s.lives).toBe(2);
    expect(s.stones[5 * COLS + 5]).toBe(3);
    expect(s.segments).toHaveLength(12);
  });

  it('clearing a caterpillar brings a faster one with loose heads', () => {
    let s = empty(newGuard(1));
    const c = Math.floor(s.x / CELL);
    s = { ...s, segments: [seg(c, 20, 1, true)], tick: 1e9 };
    s = run(stepGuard(s, 'fire'), 'idle', 40);
    expect(s.wave).toBe(2);
    expect(s.segments.filter((g) => g.head).length).toBeGreaterThan(1);
  });

  it('the gunner outlasts the sprinkler', () => {
    let gunner = 0;
    let sprinkler = 0;
    for (const seed of [1, 2, 3]) {
      gunner += play(seed, gunnerPolicy, 60 * 60 * 5).score;
      sprinkler += play(seed, sprinklerPolicy, 60 * 60 * 5).score;
    }
    expect(gunner).toBeGreaterThan(sprinkler * 2);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(7, gunnerPolicy, 3000)).toEqual(play(7, gunnerPolicy, 3000));
  });
});
