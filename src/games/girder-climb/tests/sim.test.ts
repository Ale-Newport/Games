import { describe, expect, it } from 'vitest';
import {
  GIRDERS,
  HAMMERS,
  LADDERS,
  TOP,
  climberPolicy,
  downhill,
  girderY,
  newGirders,
  stepGirders,
  walkerPolicy,
  type Drum,
  type GirderAction,
  type Girders,
} from '../sim';

const run = (s: Girders, a: GirderAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying; i++) t = stepGirders(t, a);
  return t;
};
/** A game with the robot quiet (no drums thrown) for a while. */
const quiet = (s: Girders): Girders => ({ ...s, throwIn: 1e9 });
const at = (s: Girders, g: number, x: number): Girders => ({
  ...s,
  p: { ...s.p, g, x, y: girderY(g, x), mode: 'walk' },
});
const drumAt = (g: number, x: number, dir: 1 | -1): Drum => ({
  id: 99,
  x,
  y: girderY(g, x),
  mode: 'roll',
  g,
  ladder: -1,
  dir,
  vy: 0,
  cleared: false,
  passed: LADDERS.map((_, i) => i),
});

function play(seed: number, policy: (s: Girders) => GirderAction, cap: number) {
  let s = newGirders(seed);
  while (!s.over && s.steps < cap) s = stepGirders(s, policy(s));
  return s;
}

describe('Girder Climb layout', () => {
  it('girders zigzag so drums roll the other way on each, and every whole ladder joins two girders', () => {
    for (let g = 1; g < TOP; g++) expect(downhill(g)).toBe(-downhill(g - 1) as 1 | -1);
    expect(downhill(5)).toBe(1);
    for (const l of LADDERS) {
      const a = GIRDERS[l.from]!;
      const b = GIRDERS[l.to]!;
      expect(l.x).toBeGreaterThanOrEqual(Math.max(a.x0, b.x0));
      expect(l.x).toBeLessThanOrEqual(Math.min(a.x1, b.x1));
      expect(girderY(l.from, l.x)).toBeGreaterThan(girderY(l.to, l.x));
    }
    // A whole ladder up from every girder below the top.
    for (let g = 0; g < TOP; g++) expect(LADDERS.some((l) => l.from === g && !l.broken)).toBe(true);
  });
});

describe('Girder Climb simulation', () => {
  it('walks along the slope and climbs a whole ladder up and back down', () => {
    let s = quiet(newGirders(1));
    const x0 = s.p.x;
    s = run(s, 'right', 40);
    expect(s.p.x).toBeCloseTo(x0 + 30);
    expect(s.p.y).toBeCloseTo(girderY(0, s.p.x));
    const l = LADDERS[0]!;
    s = at(s, 0, l.x);
    s = run(s, 'up', 200);
    expect(s.p.mode).toBe('walk');
    expect(s.p.g).toBe(l.to);
    s = run(s, 'down', 200);
    expect(s.p.g).toBe(l.from);
    // Stopping just short of the top, a sideways press steps off onto the girder.
    s = run(s, 'up', 5);
    let near = { ...s, p: { ...s.p, y: girderY(l.to, l.x) + 3 } };
    near = stepGirders(near, 'left');
    expect(near.p.mode).toBe('walk');
    expect(near.p.g).toBe(l.to);
  });

  it('broken ladders cannot be climbed', () => {
    const l = LADDERS.find((k) => k.broken)!;
    const s = run(at(quiet(newGirders(1)), l.from, l.x), 'up', 60);
    expect(s.p.mode).toBe('walk');
    expect(s.p.g).toBe(l.from);
  });

  it('a jump lands safely; walking off a girder end is a fatal fall', () => {
    let s = at(quiet(newGirders(1)), 2, 120);
    s = stepGirders(s, 'jump');
    expect(s.p.mode).toBe('jump');
    s = run(s, 'idle', 60);
    expect(s.p.mode).toBe('walk');
    expect(s.dying).toBe(0);
    const edge = run(at(quiet(newGirders(1)), 1, 200), 'right', 120);
    expect(edge.events).toContain('fall');
  });

  it('jumping over a drum scores 100; standing in its way costs a life', () => {
    const base = at(quiet(newGirders(1)), 3, 120);
    // The drum rolls right along girder 3 towards the climber.
    let s: Girders = { ...base, drums: [drumAt(3, 104, 1)] };
    s = stepGirders(s, 'jump');
    s = run(s, 'idle', 50);
    expect(s.dying).toBe(0);
    expect(s.score).toBe(100);
    let hit: Girders = { ...base, drums: [drumAt(3, 104, 1)] };
    hit = run(hit, 'idle', 40);
    expect(hit.events).toContain('drum');
    hit = run(hit, 'idle', 1);
    for (let i = 0; i < 90; i++) hit = stepGirders(hit, 'idle');
    expect(hit.lives).toBe(2);
    expect(hit.p.g).toBe(0);
  });

  it('a hammer smashes drums for 300', () => {
    const h = HAMMERS[0]!;
    let s = at(quiet(newGirders(1)), h.g, h.x + 6);
    s = run(s, 'left', 10);
    expect(s.p.hammer).toBeGreaterThan(0);
    expect(s.hammers[0]).toBe(false);
    s = { ...at(s, h.g, 90), drums: [drumAt(h.g, 60, 1)] };
    s = run(s, 'idle', 40);
    expect(s.dying).toBe(0);
    expect(s.score).toBe(300);
    expect(s.drums).toHaveLength(0);
  });

  it('reaching the kitten scores the bonus and starts a faster level', () => {
    let s = at(quiet(newGirders(1)), TOP, 140);
    s = run(s, 'left', 40);
    expect(s.events.length === 0 || s.rescued > 0).toBe(true);
    expect(s.score).toBe(5000);
    for (let i = 0; i < 150; i++) s = stepGirders(s, 'idle');
    expect(s.level).toBe(2);
    expect(s.p.g).toBe(0);
  });

  it('the bonus running out costs a life', () => {
    let s = quiet(newGirders(1));
    let timedOut = false;
    for (let i = 0; i < 6100 && !timedOut; i++) {
      s = stepGirders(s, 'idle');
      timedOut = s.events.includes('time');
    }
    expect(timedOut).toBe(true);
  });

  it('the climber rescues kittens and beats the walker', () => {
    let climber = 0;
    let walker = 0;
    let rescues = 0;
    for (const seed of [1, 2, 3]) {
      const c = play(seed, climberPolicy, 60 * 60 * 3);
      climber += c.score;
      rescues += c.level - 1;
      walker += play(seed, walkerPolicy, 60 * 60 * 3).score;
    }
    expect(rescues).toBeGreaterThan(0);
    expect(climber).toBeGreaterThan(walker);
  }, 60_000);

  it('replays exactly from a seed', () => {
    expect(play(5, climberPolicy, 3000)).toEqual(play(5, climberPolicy, 3000));
  });
});
