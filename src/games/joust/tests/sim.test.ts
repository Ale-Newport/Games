import { describe, expect, it } from 'vitest';
import {
  LAVA,
  LEDGES,
  RANK_POINTS,
  W,
  glidePolicy,
  lancerPolicy,
  newLances,
  stepLances,
  type LanceAction,
  type Lances,
  type Rider,
} from '../sim';

/** No rivals arriving. */
const calm = (s: Lances): Lances => ({ ...s, toCome: [], spawnIn: 1e9, rivals: [] });
const run = (s: Lances, a: LanceAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying && !t.over; i++) t = stepLances(t, a);
  return t;
};
const rival = (x: number, y: number): Rider => ({
  x,
  y,
  vx: 0,
  vy: 0,
  facing: -1,
  ground: false,
  rank: 'bounder',
  cool: 999,
});
function play(seed: number, policy: (s: Lances) => LanceAction, cap: number) {
  let s = newLances(seed);
  while (!s.over && s.steps < cap) s = stepLances(s, policy(s));
  return s;
}

describe('Sky Lances', () => {
  it('a flap lifts the rider, gravity brings it down, and the sides wrap round', () => {
    let s = calm(newLances(1));
    s = { ...s, toCome: ['bounder'] };
    const y0 = s.player.y;
    s = stepLances(s, 'flap');
    expect(s.player.y).toBeLessThan(y0);
    // Holding is one flap.
    const held = run(s, 'flap', 20);
    const tapped = run(s, 'idle', 20);
    expect(held.player.y).toBeCloseTo(tapped.player.y);
    let w: Lances = {
      ...calm(newLances(1)),
      toCome: ['bounder'],
      player: { ...s.player, x: W - 1, y: 30, vx: 2, ground: false },
    };
    w = stepLances(w, 'idle');
    expect(w.player.x).toBeLessThan(5);
  });

  it('riders land on ledges', () => {
    let s: Lances = { ...calm(newLances(1)), toCome: ['bounder'] };
    const l = LEDGES[2]!;
    s = { ...s, player: { ...s.player, x: (l.x0 + l.x1) / 2, y: l.y - 40, vy: 0, ground: false } };
    s = run(s, 'idle', 120);
    expect(s.player.ground).toBe(true);
    expect(s.player.y).toBeCloseTo(l.y - 14);
  });

  it('the higher lance wins: a rival below is unhorsed and leaves an egg; one above unhorses you', () => {
    let s: Lances = { ...calm(newLances(1)), toCome: ['bounder'] };
    s = { ...s, player: { ...s.player, x: 100, y: 50, ground: false }, rivals: [rival(104, 58)] };
    s = stepLances(s, 'idle');
    expect(s.events).toContain('unhorse');
    expect(s.score).toBe(RANK_POINTS.bounder);
    expect(s.eggs).toHaveLength(1);
    let lose: Lances = { ...calm(newLances(1)), toCome: ['bounder'] };
    lose = {
      ...lose,
      player: { ...lose.player, x: 100, y: 60, ground: false },
      rivals: [rival(104, 50)],
    };
    lose = stepLances(lose, 'idle');
    expect(lose.events).toContain('unhorsed');
    let level: Lances = { ...calm(newLances(1)), toCome: ['bounder'] };
    level = {
      ...level,
      player: { ...level.player, x: 100, y: 50, ground: false },
      rivals: [rival(106, 51)],
    };
    level = stepLances(level, 'idle');
    expect(level.events).toContain('clash');
  });

  it('eggs can be picked up for points, or hatch into a fiercer rider', () => {
    const base: Lances = { ...calm(newLances(1)), toCome: ['bounder'] };
    const l = LEDGES[6]!;
    let s: Lances = {
      ...base,
      eggs: [{ x: base.player.x + 4, y: l.y - 6, vy: 0, rank: 'bounder', hatch: 600 }],
    };
    s = stepLances(s, 'idle');
    expect(s.events).toContain('egg');
    expect(s.score).toBe(250);
    let h: Lances = {
      ...base,
      eggs: [{ x: 30, y: LEDGES[3]!.y - 6, vy: 0, rank: 'bounder', hatch: 2 }],
    };
    h = run(h, 'idle', 3);
    expect(h.rivals.some((r) => r.rank === 'hunter')).toBe(true);
  });

  it('lava is fatal; three falls end the game', () => {
    let s: Lances = { ...calm(newLances(1)), toCome: ['bounder'] };
    s = { ...s, player: { ...s.player, x: 20, y: LAVA - 20, ground: false } };
    s = run(s, 'idle', 60);
    expect(s.events).toContain('lava');
  });

  it('a cleared wave pays 3000 and brings more riders', () => {
    let s = calm(newLances(1));
    s = stepLances(s, 'idle');
    expect(s.events).toContain('cleared');
    expect(s.score).toBe(3000);
    for (let i = 0; i < 150; i++) s = stepLances(s, 'idle');
    expect(s.wave).toBe(2);
    expect(s.toCome.length).toBeGreaterThan(4);
  });

  it('the lancer goes further than the glider', () => {
    let lancer = 0;
    let glider = 0;
    for (const seed of [1, 2, 3]) {
      lancer += play(seed, lancerPolicy, 60 * 60 * 4).score;
      glider += play(seed, glidePolicy, 60 * 60 * 4).score;
    }
    expect(lancer).toBeGreaterThan(glider * 2);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(4, lancerPolicy, 3000)).toEqual(play(4, lancerPolicy, 3000));
  });
});
