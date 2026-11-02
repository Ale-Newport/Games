import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  CITY_X,
  GROUND,
  LAUNCHER_X,
  cellCentre,
  defenderPolicy,
  multiplier,
  newShield,
  sniperPolicy,
  stepShield,
  waveSize,
  type Rocket,
  type Shield,
  type ShieldAction,
} from '../sim';

const run = (s: Shield, a: ShieldAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.over; i++) t = stepShield(t, a);
  return t;
};
/** No more rockets this wave (so only the ones a test places are in the sky). */
const quiet = (s: Shield): Shield => ({ ...s, toCome: 0, nextIn: 1e9 });
const rocket = (x: number, y: number, tx: number): Rocket => ({
  x,
  y,
  sx: x,
  sy: 0,
  tx,
  ty: GROUND,
  speed: 0.3,
  splits: 0,
  splitAt: 999,
});
function play(seed: number, policy: (s: Shield) => ShieldAction, cap: number) {
  let s = newShield(seed);
  while (!s.over && s.steps < cap) s = stepShield(s, policy(s));
  return s;
}

describe('City Shield', () => {
  it('has idle, fire, eight crosshair moves and an aim-and-fire action for each of 192 sky cells', () => {
    expect(new Set(ACTIONS).size).toBe(2 + 8 + 192);
    const s = run(newShield(1), 'up-left', 10);
    expect(s.cross[0]).toBeLessThan(128);
    expect(s.cross[1]).toBeLessThan(90);
  });

  it('fires from the nearest launcher; the interceptor bursts at its point and the blast fades', () => {
    let s = quiet(newShield(1));
    s = stepShield(s, 'at-1-5');
    expect(s.launchers[0]!.rounds).toBe(9);
    expect(s.interceptors).toHaveLength(1);
    // Holding the tap does not fire again.
    s = stepShield(s, 'at-1-5');
    expect(s.interceptors).toHaveLength(1);
    s = run(s, 'idle', 60);
    expect(s.interceptors).toHaveLength(0);
    s = run(s, 'idle', 60);
    expect(s.blasts).toHaveLength(0);
  });

  it('a blast destroys rockets inside it, scoring 25 × the wave multiplier', () => {
    const [x, y] = cellCentre(8, 5);
    let s = quiet(newShield(1));
    s = { ...s, blasts: [{ x, y, age: 18 }], rockets: [rocket(x + 3, y, CITY_X[0]!)] };
    s = stepShield(s, 'idle');
    expect(s.events).toContain('hit');
    expect(s.score).toBe(25 * multiplier(1));
    expect(s.rockets).toHaveLength(0);
  });

  it('rockets ruin cities and knock launchers out for the wave', () => {
    let s = quiet(newShield(1));
    s = {
      ...s,
      rockets: [
        rocket(CITY_X[2]!, GROUND - 2.1, CITY_X[2]!),
        rocket(LAUNCHER_X[1]!, GROUND - 2.1, LAUNCHER_X[1]!),
      ],
    };
    s = stepShield(s, 'idle');
    expect(s.cities[2]).toBe(false);
    expect(s.launchers[1]!.up).toBe(false);
    expect(s.events).toContain('city-lost');
    expect(s.events).toContain('launcher-lost');
  });

  it('a clear sky ends the wave with a bonus; the next wave is bigger and launchers are back', () => {
    let s = quiet(newShield(1));
    s = { ...s, launchers: s.launchers.map((l, i) => (i === 1 ? { up: false, rounds: 0 } : l)) };
    s = stepShield(s, 'idle');
    expect(s.events).toContain('cleared');
    expect(s.bonus).toBe((20 * 5 + 6 * 100) * multiplier(1));
    s = run(s, 'idle', 150);
    expect(s.wave).toBe(2);
    expect(s.toCome).toBe(waveSize(2));
    expect(s.launchers.every((l) => l.up && l.rounds === 10)).toBe(true);
  });

  it('a ruined city is rebuilt at 10 000 points; losing every city ends the game', () => {
    let s = quiet(newShield(1));
    s = { ...s, score: 9500, cities: [false, true, true, true, true, true] };
    s = stepShield(s, 'idle');
    expect(s.events).toContain('rebuilt');
    expect(s.cities.every(Boolean)).toBe(true);
    let last = quiet(newShield(1));
    last = {
      ...last,
      cities: [true, false, false, false, false, false],
      rockets: [rocket(CITY_X[0]!, GROUND - 2.1, CITY_X[0]!)],
    };
    last = stepShield(last, 'idle');
    expect(last.over).toBe(true);
  });

  it('rockets start splitting from wave 3', () => {
    let s = { ...newShield(4), wave: 5 };
    let split = false;
    for (let i = 0; i < 3000 && !split && !s.over; i++) {
      s = stepShield(s, 'idle');
      split = s.events.includes('split');
    }
    expect(split).toBe(true);
  });

  it('the defender lasts longer than the sniper', () => {
    let defender = 0;
    let sniper = 0;
    for (const seed of [1, 2, 3]) {
      defender += play(seed, defenderPolicy, 60 * 60 * 8).wave;
      sniper += play(seed, sniperPolicy, 60 * 60 * 8).wave;
    }
    expect(defender).toBeGreaterThan(sniper);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(6, defenderPolicy, 3000)).toEqual(play(6, defenderPolicy, 3000));
  });
});
