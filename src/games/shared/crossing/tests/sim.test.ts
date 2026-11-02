import { describe, expect, it } from 'vitest';
import {
  BAYS,
  CLASSIC,
  ENDLESS,
  SUB,
  W,
  classicLanes,
  hazard,
  hopperPolicy,
  itemX,
  lookaheadPolicy,
  newCrossing,
  stepCrossing,
  type CrossAction,
  type Crossing,
  type CrossRules,
} from '../sim';

/** Hops once (a fresh press, then waits for the landing). */
function hop(rules: CrossRules, s: Crossing, a: CrossAction): Crossing {
  let t = stepCrossing(rules, { ...s, prev: 'idle' }, a);
  while (t.hop) t = stepCrossing(rules, t, 'idle');
  return t;
}

const centre = (col: number) => col * SUB + SUB / 2;

/** A state a little later, when some item of a lane is well inside the board. */
function withItemOnBoard(s: Crossing, row: number): [Crossing, number] {
  for (let k = 0; k < 2000; k++) {
    const t = { ...s, steps: s.steps + k };
    const lane = t.lanes[row]!;
    const i = lane.items.findIndex((it) => {
      const x = itemX(lane, it, t.steps);
      return x > 3 * SUB && x + it.len < W - 3 * SUB;
    });
    if (i >= 0) return [t, i];
  }
  throw new Error('nothing on the board');
}

function play(
  rules: CrossRules,
  seed: number,
  policy: (r: CrossRules, s: Crossing) => CrossAction,
  cap: number,
) {
  let s = newCrossing(rules, seed);
  while (!s.over && s.steps < cap) s = stepCrossing(rules, s, policy(rules, s));
  return s;
}

describe('Crossing lanes', () => {
  it('the classic board: start, five roads, a verge, five river lanes, the burrows', () => {
    const lanes = classicLanes(1);
    expect(lanes.map((l) => l.kind)).toEqual([
      'safe',
      ...new Array<string>(5).fill('road'),
      'safe',
      ...new Array<string>(5).fill('river'),
      'goal',
    ]);
    // Later levels are faster.
    expect(classicLanes(3)[1]!.speed).toBeGreaterThan(lanes[1]!.speed);
  });

  it('things move steadily along their lane and come round again', () => {
    const lane = classicLanes(1)[3]!;
    const it0 = lane.items[0]!;
    const a = itemX(lane, it0, 0);
    const b = itemX(lane, it0, 10);
    expect(b - a).toBeCloseTo(lane.dir * lane.speed * 10);
    const back = itemX(lane, it0, Math.round(lane.period / lane.speed));
    expect(Math.abs(back - a)).toBeLessThan(1);
  });
});

describe('Crossing simulation', () => {
  it('hops a row at a time, scoring each new row, and not off the board', () => {
    let s = newCrossing(CLASSIC, 1);
    const below = hop(CLASSIC, s, 'down');
    expect(below.y).toBe(0);
    expect(below.hop).toBeNull();
    s = { ...s, lanes: s.lanes.map((l) => (l.kind === 'road' ? { ...l, items: [] } : l)) };
    s = hop(CLASSIC, s, 'up');
    expect(s.y).toBe(1);
    expect(s.score).toBe(10);
    s = hop(CLASSIC, s, 'down');
    s = hop(CLASSIC, s, 'up');
    expect(s.score).toBe(10);
    let edge = { ...s, x: centre(0) };
    edge = hop(CLASSIC, edge, 'left');
    expect(edge.x).toBe(centre(0));
  });

  it('cars run the hedgehog over; it costs a life and starts again', () => {
    const [s0, i] = withItemOnBoard(newCrossing(CLASSIC, 1), 1);
    let s = s0;
    const lane = s.lanes[1]!;
    const car = lane.items[i]!;
    const x = itemX(lane, car, s.steps + 1) + car.len / 2;
    s = stepCrossing(CLASSIC, { ...s, y: 1, x }, 'idle');
    expect(s.events).toContain('road');
    for (let i = 0; i < 60; i++) s = stepCrossing(CLASSIC, s, 'idle');
    expect(s.lives).toBe(2);
    expect([s.y, s.x]).toEqual([0, centre(6)]);
  });

  it('the river: water drowns, a log carries', () => {
    const [s, i] = withItemOnBoard(newCrossing(CLASSIC, 1), 8);
    const lane = s.lanes[8]!;
    const log = lane.items[i]!;
    const on = itemX(lane, log, s.steps) + SUB;
    let t = stepCrossing(CLASSIC, { ...s, y: 8, x: on }, 'idle');
    expect(t.dying).toBe(0);
    expect(t.x).toBeCloseTo(on + lane.dir * lane.speed);
    for (let i = 0; i < 10; i++) t = stepCrossing(CLASSIC, t, 'idle');
    expect(t.x).toBeCloseTo(on + lane.dir * lane.speed * 11);
    // Off the end of the log, in the water.
    expect(hazard({ ...s, y: 8, x: itemX(lane, log, s.steps) - 2 * SUB })).toBe('water');
  });

  it('burrows: a free one scores, the hedge kills, five fill the level', () => {
    const s = newCrossing(CLASSIC, 1);
    const at = (col: number): Crossing => ({
      ...s,
      y: 11,
      x: centre(col),
      lanes: s.lanes.map((l, i) =>
        i === 11
          ? { ...l, speed: 0, items: [{ at: 0, len: 2 * W, kind: 'log' }], period: 4 * W }
          : l,
      ),
    });
    const home = hop(CLASSIC, at(BAYS[0]!), 'up');
    expect(home.events).toContain('home');
    expect(home.filled[0]).toBe(true);
    expect(home.score).toBeGreaterThanOrEqual(10 + 50);
    expect(home.y).toBe(0);
    const hedge = hop(CLASSIC, at(BAYS[0]! + 1), 'up');
    expect(hedge.events).toContain('hedge');
    let all = at(BAYS[4]!);
    all = { ...all, filled: [true, true, true, true, false] };
    all = hop(CLASSIC, all, 'up');
    expect(all.events).toContain('level');
    expect(all.level).toBe(2);
    expect(all.filled.every((f) => !f)).toBe(true);
    expect(all.score).toBeGreaterThan(1000);
  });

  it('thirty seconds per crossing', () => {
    let s = newCrossing(CLASSIC, 1);
    let timedOut = false;
    for (let i = 0; i < 30 * 60 + 5 && !timedOut; i++) {
      s = stepCrossing(CLASSIC, s, 'idle');
      timedOut = s.events.includes('time');
    }
    expect(timedOut).toBe(true);
  });

  it('endless: lanes appear ahead, and standing still lets the hawk in', () => {
    let s = newCrossing(ENDLESS, 1);
    expect(s.lanes.length).toBeGreaterThan(15);
    expect(s.lives).toBe(1);
    let caught = false;
    for (let i = 0; i < 60 * 30 && !caught; i++) {
      s = stepCrossing(ENDLESS, s, 'idle');
      caught = s.events.includes('hawk');
    }
    expect(caught).toBe(true);
    expect(s.steps).toBeGreaterThan(60 * 10);
  });

  it('the planner fills burrows and gets far in the endless game; the hopper does worse', () => {
    const classic = play(CLASSIC, 2, lookaheadPolicy, 60 * 60);
    expect(classic.filled.some(Boolean) || classic.level > 1).toBe(true);
    const endless = play(ENDLESS, 2, lookaheadPolicy, 60 * 60);
    expect(endless.score).toBeGreaterThan(40);
    const hopper = play(ENDLESS, 2, hopperPolicy, 60 * 60);
    expect(hopper.score).toBeLessThan(endless.score);
  }, 60_000);

  it('replays exactly from a seed', () => {
    const a = play(ENDLESS, 7, lookaheadPolicy, 600);
    const b = play(ENDLESS, 7, lookaheadPolicy, 600);
    expect(a).toEqual(b);
  });
});
