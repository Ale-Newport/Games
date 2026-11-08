import { describe, expect, it } from 'vitest';
import {
  AIR,
  COLS,
  EARTH,
  LEVELS,
  ROWS,
  SPLAT,
  STEEL,
  WATER,
  canGive,
  cellAt,
  give,
  idlePolicy,
  newLevel,
  newRescue,
  plannerPolicy,
  stepRescue,
  tickLevel,
  type Level,
  type Rescue,
  type RescueAction,
  type Walker,
} from '../sim';

/** Level 3's frame (exit at 70,35) with only a floor at row 36 and steel sides, plus extra cells. */
function flat(extra: [number, number, number][] = []): Level {
  const lv = newLevel(2);
  lv.grid = lv.grid.map(() => AIR);
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (x < 2 || x >= COLS - 2) lv.grid[y * COLS + x] = STEEL;
      else if (y >= 36) lv.grid[y * COLS + x] = EARTH;
    }
  for (const [x, y, v] of extra) lv.grid[y * COLS + x] = v;
  lv.toCome = 0;
  return lv;
}
const walker = (x: number, y: number, more: Partial<Walker> = {}): Walker => ({
  x,
  y,
  dir: 1,
  state: 'walk',
  climber: false,
  floater: false,
  fall: 0,
  work: 0,
  status: 'out',
  ...more,
});
const run = (lv: Level, ticks: number) => {
  for (let k = 0; k < ticks && !lv.done; k++) tickLevel(lv);
  return lv;
};
const play = (s0: Rescue, policy: (s: Rescue) => RescueAction, max: number) => {
  let s = s0;
  while (!s.over && s.steps < max) s = stepRescue(s, policy(s));
  return s;
};

describe('Wanderer Rescue rules', () => {
  it('wanderers walk on their own, step up one or two cells, and turn at anything higher', () => {
    const lv = flat([
      [20, 35, EARTH],
      [26, 35, EARTH],
      [26, 34, EARTH],
      [32, 35, EARTH],
      [32, 34, EARTH],
      [32, 33, EARTH],
    ]);
    lv.walkers.push(walker(10, 35));
    run(lv, 30);
    const w = lv.walkers[0]!;
    expect(w.dir).toBe(-1);
    expect(w.x).toBeLessThan(32);
    expect(w.x).toBeGreaterThan(20);
  });

  it(`a fall of more than ${SPLAT} cells is fatal unless floating; water always is`, () => {
    const lv = flat();
    lv.walkers.push(
      walker(10, 18, { state: 'fall' }),
      walker(20, 18, { state: 'fall', floater: true }),
      walker(30, 25, { state: 'fall', dir: -1 }),
    );
    run(lv, 60);
    expect(lv.walkers.map((w) => w.status)).toEqual(['dead', 'out', 'out']);
    const wet = flat([[40, 36, WATER]]);
    wet.walkers.push(walker(38, 35));
    run(wet, 10);
    expect(wet.walkers[0]!.status).toBe('dead');
  });

  it('a blocker turns the others round', () => {
    const lv = flat();
    lv.walkers.push(walker(30, 35, { state: 'block' }), walker(20, 35));
    run(lv, 20);
    expect(lv.walkers[1]!.dir).toBe(-1);
    expect(lv.walkers[1]!.x).toBeLessThan(30);
  });

  it('a digger digs down through earth (three cells wide) and stops at steel', () => {
    const lv = flat([
      [20, 40, STEEL],
      [21, 40, STEEL],
      [19, 40, STEEL],
    ]);
    lv.walkers.push(walker(20, 35));
    lv.skills.dig = 1;
    expect(canGive(lv, 0, 'dig')).toBe(true);
    give(lv, 0, 'dig');
    run(lv, 30);
    expect(cellAt(lv, 19, 37)).toBe(AIR);
    expect(cellAt(lv, 21, 38)).toBe(AIR);
    expect(cellAt(lv, 20, 40)).toBe(STEEL);
    expect(lv.walkers[0]!.y).toBe(39);
    expect(lv.walkers[0]!.state).toBe('walk');
    expect(lv.skills.dig).toBe(0);
  });

  it('a basher tunnels through an earth wall and walks on; steel turns it back', () => {
    const wall: [number, number, number][] = [];
    for (let y = 20; y < 36; y++) for (let x = 30; x < 34; x++) wall.push([x, y, EARTH]);
    const lv = flat(wall);
    lv.walkers.push(walker(29, 35));
    lv.skills.bash = 1;
    give(lv, 0, 'bash');
    run(lv, 12);
    expect(lv.walkers[0]!.x).toBeGreaterThan(34);
    expect(cellAt(lv, 31, 34)).toBe(AIR);
    expect(cellAt(lv, 31, 30)).toBe(EARTH);
    const steel = flat([
      [30, 35, STEEL],
      [30, 34, STEEL],
    ]);
    steel.walkers.push(walker(29, 35));
    steel.skills.bash = 1;
    give(steel, 0, 'bash');
    run(steel, 3);
    expect(steel.walkers[0]!.dir).toBe(-1);
  });

  it('a builder lays twelve bricks rising one cell each', () => {
    const lv = flat();
    lv.walkers.push(walker(10, 35));
    lv.skills.build = 1;
    give(lv, 0, 'build');
    run(lv, 24);
    const w = lv.walkers[0]!;
    expect(w.state).toBe('walk');
    expect(w.y).toBe(23);
    expect(w.x).toBe(22);
    for (let k = 1; k <= 12; k++) expect(cellAt(lv, 10 + k, 36 - k)).toBe(EARTH);
  });

  it('a climber goes up a wall and over the top', () => {
    const wall: [number, number, number][] = [];
    for (let y = 28; y < 36; y++) wall.push([30, y, STEEL]);
    const lv = flat(wall);
    lv.walkers.push(walker(29, 35, { climber: true }));
    run(lv, 40);
    expect(lv.walkers[0]!.x).toBeGreaterThan(30);
  });

  it('skills run out, and some need the right moment', () => {
    const lv = flat();
    lv.walkers.push(walker(10, 35), walker(20, 30, { state: 'fall' }));
    lv.skills.block = 1;
    lv.skills.float = 1;
    expect(canGive(lv, 0, 'block')).toBe(true);
    expect(canGive(lv, 1, 'block')).toBe(false);
    expect(canGive(lv, 1, 'float')).toBe(true);
    expect(canGive(lv, 0, 'dig')).toBe(false);
    give(lv, 0, 'block');
    expect(canGive(lv, 0, 'block')).toBe(false);
    lv.walkers.push(walker(5, 35));
    expect(canGive(lv, 2, 'block')).toBe(false);
  });

  it('wanderers reach the exit; the level ends when only blockers are left', () => {
    const lv = flat();
    lv.walkers.push(walker(60, 35), walker(40, 35, { state: 'block' }));
    run(lv, 30);
    expect(lv.saved).toBe(1);
    expect(lv.done).toBe(true);
  });

  it('wanderers drop from the hatch at the level rate', () => {
    const lv = newLevel(0);
    run(lv, LEVELS[0]!.rate * 3);
    expect(lv.walkers).toHaveLength(3);
  });

  it('keys pick a skill, move the highlight and hand the skill out', () => {
    let s = newRescue(1, 2);
    for (let k = 0; k < 6 * 60; k++) s = stepRescue(s, 'idle');
    expect(s.level.walkers.length).toBeGreaterThan(1);
    s = stepRescue(s, 'next');
    expect(s.skill).toBe('climb');
    s = stepRescue(s, 'next');
    expect(s.skill).toBe('climb');
    for (let k = 0; k < 10; k++) s = stepRescue(s, 'idle');
    s = stepRescue(s, 'pick-bash');
    s = stepRescue(s, 'down');
    expect(s.cursor).toBe(1);
    s = stepRescue(s, 'assign');
    expect(s.level.walkers[1]!.state).toBe('bash');
    expect(s.level.skills.bash).toBe(1);
  });

  it('a failed level costs a try; three failures end the game', () => {
    const s = play(newRescue(1), idlePolicy, 60 * 60 * 30);
    expect(s.over).toBe(true);
    expect(s.victory).toBe(false);
    expect(s.lives).toBe(0);
    expect(s.cleared).toBe(0);
  });

  it('the planner brings enough wanderers home on all six levels', () => {
    const s = play(newRescue(1), plannerPolicy, 60 * 60 * 30);
    expect(s.over).toBe(true);
    expect(s.victory).toBe(true);
    expect(s.lives).toBe(3);
    expect(s.totalSaved).toBeGreaterThanOrEqual(LEVELS.reduce((n, l) => n + l.need, 0));
  }, 60_000);

  it('replays exactly from the same actions', () => {
    const a = play(newRescue(1, 3), plannerPolicy, 3000);
    const b = play(newRescue(1, 3), plannerPolicy, 3000);
    expect(b).toEqual(a);
  });
});
