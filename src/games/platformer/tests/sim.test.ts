import { describe, expect, it } from 'vitest';
import { TILE, move, type TileMap } from '../../shared/platform/physics';
import { LEVELS, ROWS } from '../levels';
import {
  mapOf,
  newTrail,
  plannerPolicy,
  runnerPolicy,
  stepTrail,
  type PlatAction,
  type Trail,
} from '../sim';

const run = (s: Trail, a: PlatAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying && !t.cleared; i++) t = stepTrail(t, a);
  return t;
};
const placed = (s: Trail, tx: number, ty = ROWS - 2): Trail => ({
  ...s,
  hero: { ...s.hero, x: tx * TILE + 2, y: ty * TILE - s.hero.h, vx: 0, vy: 0 },
  beetles: [],
});
const ground = (ROWS - 2) * TILE;

function play(policy: (s: Trail) => PlatAction, cap: number) {
  let s = newTrail();
  while (!s.over && s.steps < cap) s = stepTrail(s, policy(s));
  return s;
}

describe('Sunny Trail levels', () => {
  it('three levels of 14 even rows, each with a checkpoint and a flag', () => {
    expect(LEVELS).toHaveLength(3);
    for (const rows of LEVELS) {
      expect(rows).toHaveLength(ROWS);
      expect(new Set(rows.map((r) => r.length)).size).toBe(1);
      expect(rows[ROWS - 3]).toContain('C');
      expect(rows[2]).toContain('F');
    }
  });

  it('platform physics: ledges hold from above and let you through from below', () => {
    const m: TileMap = { rows: ['....', '.==.', '....', '####'], solid: '#' };
    const [fall, c1] = move(m, { x: 20, y: 4, w: 8, h: 8, vx: 0, vy: 6 });
    expect(c1.ground).toBe(true);
    expect(fall.y).toBe(TILE - 8);
    const [rise] = move(m, { x: 20, y: 40, w: 8, h: 8, vx: 0, vy: -12 });
    expect(rise.y).toBe(28);
    const [wall, c2] = move(m, { x: 2, y: 48 - 8, w: 8, h: 8, vx: -10, vy: 0 });
    expect(c2.wall).toBe(-1);
    expect(wall.x).toBe(0);
  });
});

describe('Sunny Trail simulation', () => {
  it('runs, accelerating to a top speed, and jumps higher while the button is held', () => {
    let s = run(newTrail(), 'right', 40);
    expect(s.hero.vx).toBeCloseTo(1.8);
    expect(s.hero.y).toBe(ground - s.hero.h);
    const top = (a: PlatAction, hold: number) => {
      let t = placed(newTrail(), 3);
      let min = t.hero.y;
      for (let i = 0; i < 60; i++) {
        t = stepTrail(t, i < hold ? a : 'idle');
        min = Math.min(min, t.hero.y);
      }
      return t.hero.y - min;
    };
    expect(top('jump', 40)).toBeGreaterThan(64);
    expect(top('jump', 2)).toBeLessThan(40);
    s = stepTrail(s, 'jump');
    expect(s.events).toContain('jump');
  });

  it('a head-butt opens a prize box: a coin, or a berry that gives a shield', () => {
    // Level 1: a coin box at column 12, a berry box at column 17, both in row 8.
    let s = placed(newTrail(), 12);
    s = run(s, 'jump', 30);
    expect(s.coins).toBe(1);
    expect(mapOf(s).rows[8]![12]).toBe('U');
    let b = placed(newTrail(), 17);
    b = run(b, 'jump', 30);
    expect(b.berries).toHaveLength(1);
    b = run(placed({ ...b, berries: [{ x: 17 * TILE + 3, y: ground - 10 }] }, 16), 'right', 30);
    expect(b.hero.shield).toBe(true);
  });

  it('stomping a beetle scores and bounces; walking into one costs a life (or the shield)', () => {
    const beetle = (x: number, y: number) => ({
      x,
      y,
      w: 14,
      h: 12,
      vx: 0,
      vy: 0,
      dir: -1 as const,
      spiky: false,
      alive: true,
      squash: 0,
      awake: false,
    });
    let s = placed(newTrail(), 5);
    s = {
      ...s,
      hero: { ...s.hero, y: ground - 40, vy: 2 },
      beetles: [beetle(5 * TILE + 1, ground - 12)],
    };
    s = run(s, 'idle', 20);
    expect(s.score).toBe(100);
    expect(s.beetles[0]!.alive).toBe(false);
    let hit = placed(newTrail(), 5);
    hit = { ...hit, beetles: [beetle(5 * TILE + 20, ground - 12)] };
    hit = run(hit, 'right', 30);
    expect(hit.events).toContain('beetle');
    for (let i = 0; i < 90; i++) hit = stepTrail(hit, 'idle');
    expect(hit.lives).toBe(2);
    expect(hit.hero.x).toBe(2 * TILE);
    let shielded = placed(newTrail(), 5);
    shielded = {
      ...shielded,
      hero: { ...shielded.hero, shield: true },
      beetles: [beetle(5 * TILE + 20, ground - 12)],
    };
    shielded = run(shielded, 'right', 30);
    expect(shielded.dying).toBe(0);
    expect(shielded.hero.shield).toBe(false);
  });

  it('pits are fatal; the checkpoint is where the next life starts', () => {
    let s = placed(newTrail(), 37);
    s = { ...s, checkpoint: true };
    s = run(s, 'right', 120);
    expect(s.events).toContain('pit');
    for (let i = 0; i < 90; i++) s = stepTrail(s, 'idle');
    expect(Math.round(s.hero.x / TILE)).toBe(LEVELS[0]![ROWS - 3]!.indexOf('C'));
  });

  it('the flag ends the level; the third flag wins', () => {
    const flag = LEVELS[0]![2]!.indexOf('F');
    let s = placed(newTrail(), flag - 2);
    s = run(s, 'right', 60);
    expect(s.events).toContain('flag');
    expect(s.score).toBeGreaterThanOrEqual(1000);
    for (let i = 0; i < 150; i++) s = stepTrail(s, 'idle');
    expect(s.level).toBe(1);
    let last = placed({ ...newTrail(), level: 2, beetles: [] }, LEVELS[2]![2]!.indexOf('F') - 2);
    last = run(last, 'right', 60);
    for (let i = 0; i < 151; i++) last = stepTrail(last, 'idle');
    expect(last.won).toBe(true);
    expect(last.over).toBe(true);
  });

  it('the planner clears every level; the runner does not', () => {
    const planner = play(plannerPolicy, 60 * 60 * 4);
    expect(planner.won).toBe(true);
    const runner = play(runnerPolicy, 60 * 60 * 4);
    expect(runner.won).toBe(false);
    expect(planner.score).toBeGreaterThan(runner.score);
  }, 120_000);

  it('replays exactly', () => {
    expect(play(plannerPolicy, 1500)).toEqual(play(plannerPolicy, 1500));
  }, 60_000);
});
