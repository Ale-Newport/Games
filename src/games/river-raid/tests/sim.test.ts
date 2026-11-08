import { describe, expect, it } from 'vitest';
import {
  JET_Y,
  ROW,
  SECTION,
  W,
  cruisePolicy,
  newRaid,
  pilotPolicy,
  riverAt,
  stepRaid,
  type Raid,
  type RaidAction,
} from '../sim';

const run = (s: Raid, a: RaidAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying && !t.over; i++) t = stepRaid(t, a);
  return t;
};
function play(seed: number, policy: (s: Raid) => RaidAction, cap: number) {
  let s = newRaid(seed);
  while (!s.over && s.steps < cap) s = stepRaid(s, policy(s));
  return s;
}
/** The jet's row and the river there. */
const jetRow = (s: Raid) => Math.floor((s.d + JET_Y) / ROW);

describe('Canyon Run river', () => {
  it('is the same for a seed, stays on screen, and narrows to a bridged channel at each stretch’s end', () => {
    for (let row = 0; row < SECTION * 4; row++) {
      const r = riverAt(5, row);
      expect(r).toEqual(riverAt(5, row));
      expect(r.x0).toBeGreaterThanOrEqual(0);
      expect(r.x1).toBeLessThanOrEqual(W);
      expect(r.x1 - r.x0).toBeGreaterThan(40);
      if (r.i1 > r.i0) expect(row % SECTION).toBeGreaterThanOrEqual(8);
      expect(r.bridge).toBe(row % SECTION === 60);
    }
    expect(riverAt(5, 100)).not.toEqual(riverAt(6, 100));
  });
});

describe('Canyon Run flight', () => {
  it('steers, changes speed, and burns more fuel flying fast', () => {
    const s = newRaid(1);
    expect(stepRaid(s, 'left').x).toBe(s.x - 2);
    const fast = run(s, 'up', 60);
    const slow = run(s, 'down', 60);
    expect(fast.d).toBeGreaterThan(slow.d * 2);
    expect(fast.fuel).toBeLessThan(slow.fuel);
  });

  it('a shot destroys a boat; flying over a depot refuels', () => {
    let s = newRaid(1);
    const wy = s.d + JET_Y + 60;
    s = { ...s, things: [{ id: 999, kind: 'boat', x: s.x, wy, vx: 0, awake: true }] };
    s = run(stepRaid(s, 'fire'), 'idle', 10);
    expect(s.score).toBe(30);
    expect(s.gone).toContain(999);
    let f = { ...newRaid(1), fuel: 50 };
    f = {
      ...f,
      things: [{ id: 998, kind: 'depot', x: f.x, wy: f.d + JET_Y + 2, vx: 0, awake: false }],
    };
    f = stepRaid(f, 'down');
    expect(f.fuel).toBeGreaterThan(50);
  });

  it('a standing bridge blocks the way; shot down it scores and becomes the next start', () => {
    // The first bridge is on row 60.
    const bridgeD = 60 * ROW - JET_Y;
    let s: Raid = {
      ...newRaid(1),
      d: bridgeD - 30,
      x: (riverAt(1, 60).x0 + riverAt(1, 60).x1) / 2,
    };
    s = run(s, 'idle', 40);
    expect(s.cause).toBe('bridge');
    let t: Raid = { ...newRaid(1), d: bridgeD - 30, x: s.x };
    t = stepRaid(t, 'fire');
    t = run(t, 'idle', 60);
    expect(t.bridgesDown).toContain(0);
    expect(t.score).toBeGreaterThanOrEqual(500);
    expect(t.checkpoint).toBeGreaterThan(0);
  });

  it('banks are fatal and the next jet starts at the last bridge passed; fuel running out is fatal too', () => {
    let s = newRaid(1);
    s = run(s, 'left', 200);
    expect(s.cause).toBe('bank');
    s = { ...s, checkpoint: 400 };
    for (let i = 0; i < 90; i++) s = stepRaid(s, 'idle');
    expect(s.lives).toBe(3);
    expect(s.d).toBe(400);
    const dry = run({ ...newRaid(1), fuel: 0.02 }, 'idle', 3);
    expect(dry.cause).toBe('fuel');
    expect(jetRow(newRaid(1))).toBeGreaterThan(0);
  });

  it('the pilot gets far further up the river than the cruiser', () => {
    let pilot = 0;
    let cruiser = 0;
    for (const seed of [1, 2, 3]) {
      pilot += play(seed, pilotPolicy, 60 * 60 * 3).bridgesDown.length;
      cruiser += play(seed, cruisePolicy, 60 * 60 * 3).bridgesDown.length;
    }
    expect(pilot).toBeGreaterThan(3);
    expect(cruiser).toBe(0);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(4, pilotPolicy, 3000)).toEqual(play(4, pilotPolicy, 3000));
  });
});
