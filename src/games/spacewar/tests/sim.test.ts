import { describe, expect, it } from 'vitest';
import {
  CX,
  CY,
  KILLS_TO_WIN,
  W,
  duellistFor,
  gunnerFor,
  newDuel,
  pull,
  stepDuel,
  stepWithRival,
  type Duel,
  type DuelAction,
} from '../sim';

const both = (s: Duel, a: DuelAction, b: DuelAction = 'idle', n = 1) => {
  let t = s;
  for (let i = 0; i < n && !t.pause && !t.over; i++) t = stepDuel(t, [a, b]);
  return t;
};
/** Ships parked far apart, still. */
const parked = (s: Duel): Duel => ({
  ...s,
  ships: [
    { ...s.ships[0]!, x: 40, y: 40, vx: 0, vy: 0, a: 0 },
    { ...s.ships[1]!, x: 280, y: 200, vx: 0, vy: 0, a: Math.PI },
  ],
});
function play(seed: number, policy: (s: Duel) => DuelAction, cap: number) {
  let s = newDuel(seed);
  while (!s.over && s.steps < cap) s = stepWithRival(s, policy(s));
  return s;
}

describe('Star Duel', () => {
  it('the star pulls ships in, harder close by; the screen wraps', () => {
    const [fx] = pull(CX - 100, CY);
    const [nx] = pull(CX - 40, CY);
    expect(fx).toBeGreaterThan(0);
    expect(nx).toBeGreaterThan(fx);
    let s = parked(newDuel(1));
    s = both(s, 'idle', 'idle', 30);
    expect(s.ships[0]!.vx).toBeGreaterThan(0);
    expect(s.ships[0]!.vy).toBeGreaterThan(0);
    let w: Duel = { ...parked(newDuel(1)) };
    w = { ...w, ships: [{ ...w.ships[0]!, x: W - 0.5, vx: 1 }, w.ships[1]!] };
    w = both(w, 'idle');
    expect(w.ships[0]!.x).toBeLessThan(5);
  });

  it('turning and thrusting along the nose', () => {
    let s = parked(newDuel(1));
    s = both(s, 'right', 'idle', 10);
    expect(s.ships[0]!.a).toBeGreaterThan(0.5);
    const t = both(parked(newDuel(1)), 'thrust', 'idle', 10);
    expect(t.ships[0]!.vx).toBeGreaterThan(0.3);
  });

  it('torpedoes: one per press, four at most, and a hit destroys the other ship', () => {
    let s = parked(newDuel(1));
    s = both(s, 'fire');
    expect(s.torpedoes).toHaveLength(1);
    s = both(s, 'fire', 'idle', 30);
    expect(s.torpedoes).toHaveLength(1);
    for (let k = 0; k < 6; k++) s = both(both(s, 'idle', 'idle', 20), 'fire');
    expect(s.torpedoes.filter((t) => t.owner === 0).length).toBeLessThanOrEqual(4);
    let hit: Duel = parked(newDuel(1));
    hit = { ...hit, torpedoes: [{ x: 270, y: 200, vx: 3, vy: 0, life: 60, owner: 0 }] };
    hit = both(hit, 'idle', 'idle', 6);
    expect(hit.ships[1]!.alive).toBe(false);
    expect(hit.lastKill).toBe(0);
    expect(hit.ships[0]!.kills).toBe(1);
  });

  it('flying into the star is fatal', () => {
    let s = parked(newDuel(1));
    s = { ...s, ships: [{ ...s.ships[0]!, x: CX - 20, y: CY, vx: 1.5 }, s.ships[1]!] };
    s = both(s, 'idle', 'idle', 30);
    expect(s.events).toContain('burnt');
    expect(s.ships[1]!.kills).toBe(1);
  });

  it('hyperspace hides the ship, then brings it back somewhere — or loses it; three jumps at most', () => {
    let outcomes = { back: 0, lost: 0 };
    for (let seed = 1; seed <= 40; seed++) {
      let s = both(parked(newDuel(seed)), 'hyper');
      expect(s.ships[0]!.hyper).toBeGreaterThan(0);
      s = both(s, 'idle', 'idle', 50);
      if (s.ships[0]!.alive) outcomes = { ...outcomes, back: outcomes.back + 1 };
      else outcomes = { ...outcomes, lost: outcomes.lost + 1 };
    }
    expect(outcomes.back).toBeGreaterThan(outcomes.lost);
    expect(outcomes.lost).toBeGreaterThan(0);
    let s = parked(newDuel(1));
    s = { ...s, ships: [{ ...s.ships[0]!, jumps: 3 }, s.ships[1]!] };
    s = both(s, 'hyper');
    expect(s.ships[0]!.hyper).toBe(0);
  });

  it('a kill restarts the duel; five win the match', () => {
    let s = parked(newDuel(1));
    s = {
      ...s,
      ships: [{ ...s.ships[0]!, kills: 4 }, s.ships[1]!],
      torpedoes: [{ x: 270, y: 200, vx: 3, vy: 0, life: 60, owner: 0 }],
    };
    s = both(s, 'idle', 'idle', 6);
    for (let i = 0; i < 120; i++) s = stepDuel(s, ['idle', 'idle']);
    expect(s.over).toBe(true);
    expect(s.ships[0]!.kills).toBe(KILLS_TO_WIN);
  });

  it('the duellist beats the gunner, and an idle ship loses', () => {
    let duellist = 0;
    let gunner = 0;
    for (let seed = 1; seed <= 6; seed++) {
      duellist += play(seed, (s) => duellistFor(s, 0), 60 * 60 * 3).ships[0]!.kills;
      gunner += play(seed, (s) => gunnerFor(s, 0), 60 * 60 * 3).ships[0]!.kills;
    }
    expect(duellist).toBeGreaterThan(gunner);
    expect(play(1, () => 'idle', 60 * 60 * 3).ships[1]!.kills).toBe(KILLS_TO_WIN);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(2, (s) => duellistFor(s, 0), 3000)).toEqual(
      play(2, (s) => duellistFor(s, 0), 3000),
    );
  });
});
