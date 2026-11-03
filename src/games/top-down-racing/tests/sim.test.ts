import { describe, expect, it } from 'vitest';
import {
  LAPS,
  TRACKS,
  W,
  H,
  centreLine,
  driverFor,
  newRace,
  placeOf,
  stepRace,
  stepWithField,
  type Race,
  type RaceAction,
} from '../sim';

const all = (a: RaceAction): RaceAction[] => [a, 'idle', 'idle', 'idle'];
const run = (s: Race, a: RaceAction, n: number) => {
  let t = s;
  for (let i = 0; i < n; i++) t = stepRace(t, all(a));
  return t;
};
function play(seed: number, track: string, policy: (s: Race) => RaceAction, cap: number) {
  let s = newRace(seed, track);
  while (!s.over && s.steps < cap) s = stepWithField(s, policy(s));
  return s;
}

describe('Circuit Sprint circuits', () => {
  it.each(TRACKS)('%s is a smooth closed loop on screen, never close to itself', (track) => {
    const l = centreLine(track);
    const n = l.length;
    for (const [x, y] of l) {
      expect(x).toBeGreaterThan(15);
      expect(x).toBeLessThan(W - 15);
      expect(y).toBeGreaterThan(15);
      expect(y).toBeLessThan(H - 15);
    }
    for (let i = 0; i < n; i += 3)
      for (let j = 0; j < n; j += 3) {
        const gap = Math.min(Math.abs(i - j), n - Math.abs(i - j));
        if (gap >= 30)
          expect(Math.hypot(l[i]![0] - l[j]![0], l[i]![1] - l[j]![1])).toBeGreaterThan(30);
      }
  });
});

describe('Circuit Sprint driving', () => {
  it('waits for the lights, then accelerates to a top speed; steering needs speed', () => {
    let s = newRace(1, 'oval');
    const x0 = s.cars[0]!.x;
    s = run(s, 'gas', 119);
    expect(s.cars[0]!.x).toBe(x0);
    expect(s.countdown).toBe(1);
    s = run(s, 'gas', 1);
    expect(s.events).toContain('go');
    const turned = run(
      { ...s, cars: s.cars.map((c, i) => (i === 0 ? { ...c, v: 0 } : c)) },
      'left',
      10,
    );
    expect(turned.cars[0]!.a).toBeCloseTo(s.cars[0]!.a);
    // On the middle of the first straight, pointing along it.
    const l = centreLine('oval');
    const [ax, ay] = l[15]!;
    const [bx, by] = l[16]!;
    s = {
      ...s,
      cars: s.cars.map((c, i) =>
        i === 0 ? { ...c, x: ax, y: ay, a: Math.atan2(by - ay, bx - ax), at: 15, v: 0 } : c,
      ),
    };
    s = run(s, 'gas', 55);
    expect(s.cars[0]!.v).toBeCloseTo(2.6, 1);
    const braked = run(s, 'brake', 5);
    expect(braked.cars[0]!.v).toBeLessThan(s.cars[0]!.v);
  });

  it('the grass holds a car back', () => {
    let s = run(newRace(1, 'oval'), 'gas', 120);
    s = { ...s, cars: s.cars.map((c, i) => (i === 0 ? { ...c, x: 160, y: 120, v: 2.5 } : c)) };
    s = run(s, 'gas', 3);
    expect(s.cars[0]!.v).toBeLessThanOrEqual(1.1);
  });

  it('cars that touch bump apart', () => {
    let s = run(newRace(1, 'oval'), 'idle', 120);
    s = { ...s, cars: s.cars.map((c, i) => (i < 2 ? { ...c, x: 100 + i * 3, y: 60, v: 1 } : c)) };
    s = run(s, 'idle', 1);
    expect(
      Math.hypot(s.cars[0]!.x - s.cars[1]!.x, s.cars[0]!.y - s.cars[1]!.y),
    ).toBeGreaterThanOrEqual(7.9);
  });

  it('laps count going round; the race ends when the player is home', () => {
    let s = newRace(2, 'oval');
    let laps = 0;
    while (!s.over && s.steps < 60 * 120) {
      s = stepRace(s, [driverFor(s, 0), 'idle', 'idle', 'idle']);
      if (s.events.includes('lap')) laps++;
    }
    expect(laps).toBe(LAPS);
    expect(s.over).toBe(true);
    expect(placeOf(s)).toBe(1);
    expect(s.cars[0]!.done).not.toBeNull();
  });

  it('backing over the start line does not count a lap', () => {
    let s = run(newRace(3, 'oval'), 'idle', 120);
    s = run(s, 'brake', 120);
    s = run(s, 'gas', 60);
    expect(s.cars[0]!.laps).toBe(0);
  });

  it('the driver finishes every circuit, and the idle car comes last', () => {
    for (const track of TRACKS) {
      const s = play(1, track, (r) => driverFor(r, 0, 0.8), 60 * 60 * 3);
      expect(s.cars[0]!.done).not.toBeNull();
      expect(placeOf(s)).toBeLessThanOrEqual(3);
    }
    const idle = play(1, 'oval', () => 'idle', 60 * 60 * 4);
    expect(placeOf(idle)).toBe(4);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(4, 'kidney', (r) => driverFor(r, 0), 2000)).toEqual(
      play(4, 'kidney', (r) => driverFor(r, 0), 2000),
    );
  });
});
