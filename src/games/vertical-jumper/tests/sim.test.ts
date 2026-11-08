import { describe, expect, it } from 'vitest';
import {
  BOUNCE,
  CLOUD_W,
  SPRING,
  W,
  drifterPolicy,
  metres,
  move,
  newClimb,
  plannerPolicy,
  scoreOf,
  stepClimb,
  type Climb,
  type ClimbAction,
  type Cloud,
  type Sprite,
} from '../sim';

const play = (s0: Climb, policy: (s: Climb) => ClimbAction, max: number) => {
  let s = s0;
  while (!s.over && s.steps < max) s = stepClimb(s, policy(s));
  return s;
};
const cloud = (x: number, y: number, kind: Cloud['kind'] = 'solid'): Cloud => ({
  x,
  y,
  kind,
  vx: 0,
  gone: false,
});
/** A world of just the given clouds and sprites. */
const world = (clouds: Cloud[], sprites: Sprite[] = []): Climb => ({
  ...newClimb(1),
  clouds,
  sprites,
  nextPath: -1e9,
});

describe('Cloud Climber rules', () => {
  it('she bounces by herself on a cloud', () => {
    let s = world([cloud(100, 0)]);
    let bounces = 0;
    let top = 0;
    for (let k = 0; k < 300; k++) {
      s = stepClimb(s, 'idle');
      if (s.events.includes('bounce')) bounces++;
      top = Math.min(top, s.me.y);
    }
    expect(bounces).toBeGreaterThanOrEqual(3);
    expect(top).toBeLessThan(-130);
    expect(top).toBeGreaterThan(-150);
    expect(s.over).toBe(false);
  });

  it('clouds only hold her from above: she rises through them', () => {
    const [b] = [move({ x: 120, y: 10, vx: 0, vy: BOUNCE }, 'idle', [cloud(100, 5)], [])];
    expect(b.bounced).toBeNull();
    expect(b.me.y).toBeLessThan(5);
  });

  it('steering accelerates up to a top speed and the sides wrap round', () => {
    let m = { x: W - 3, y: -50, vx: 0, vy: 0 };
    for (let k = 0; k < 20; k++) m = move(m, 'right', [], []).me;
    expect(m.vx).toBe(4);
    expect(m.x).toBeLessThan(W / 2);
    for (let k = 0; k < 30; k++) m = move(m, 'idle', [], []).me;
    expect(Math.abs(m.vx)).toBeLessThan(0.1);
  });

  it('a thin cloud bursts under her without a bounce', () => {
    const s = play(world([cloud(100, 0), cloud(100, -80, 'thin')]), () => 'idle', 200);
    expect(s.clouds.find((c) => c.kind === 'thin')!.gone).toBe(true);
    expect(s.over).toBe(false);
  });

  it('a spring throws her far higher', () => {
    const m = move(
      { x: 120, y: -2, vx: 0, vy: 3 },
      'idle',
      [cloud(120 - CLOUD_W / 2, 0, 'spring')],
      [],
    );
    expect(m.spring).toBe(true);
    expect(m.me.vy).toBe(SPRING);
    // Off the spring's middle, it is an ordinary bounce.
    expect(
      move({ x: 98, y: -2, vx: 0, vy: 3 }, 'idle', [cloud(100 - 2, 0, 'spring')], []).me.vy,
    ).toBe(BOUNCE);
  });

  it('a storm sprite is fatal from the side or below, and pops when landed on', () => {
    const sp: Sprite = { x: 120, y: -60, vx: 0, gone: false };
    const hit = play(world([cloud(100, 0)], [sp]), () => 'idle', 400);
    expect(hit.cause).toBe('sprite');
    expect(hit.over).toBe(true);
    const pop = move({ x: 120, y: -70, vx: 0, vy: 3 }, 'idle', [], [sp]);
    expect(pop.bounced).toBe(sp);
    expect(pop.me.vy).toBe(BOUNCE);
    let s = world([], [{ ...sp, y: 40 }]);
    s = { ...s, me: { x: 120, y: 20, vx: 0, vy: 2 } };
    for (let k = 0; k < 10 && !s.events.includes('pop'); k++) s = stepClimb(s, 'idle');
    expect(s.pops).toBe(1);
    expect(s.sprites[0]!.gone).toBe(true);
  });

  it('dropping below the view ends the climb; the view never comes back down', () => {
    const s = play(world([cloud(100, 0)]), (r) => (r.steps < 40 ? 'right' : 'idle'), 600);
    expect(s.over).toBe(true);
    expect(s.cause).toBe('fall');
    let t = world([cloud(100, 0)]);
    let cam = t.cam;
    for (let k = 0; k < 200; k++) {
      t = stepClimb(t, 'idle');
      expect(t.cam).toBeLessThanOrEqual(cam);
      cam = t.cam;
    }
  });

  it('the generated path never leaves a gap a bounce cannot reach', () => {
    for (const seed of [1, 2, 3, 4]) {
      let s = newClimb(seed);
      s = play(s, plannerPolicy, 60 * 30);
      const path = s.clouds
        .filter((c) => c.kind !== 'thin')
        .map((c) => c.y)
        .sort((a, b) => b - a);
      for (let k = 1; k < path.length; k++)
        expect(path[k - 1]! - path[k]!).toBeLessThanOrEqual(100);
    }
  });

  it('height is the score, in metres (10 px each)', () => {
    expect(metres(-1234)).toBe(123);
    expect(metres(50)).toBe(0);
    const s = play(newClimb(5), plannerPolicy, 600);
    expect(scoreOf(s)).toBe(metres(s.top));
    expect(scoreOf(s)).toBeGreaterThan(30);
  });

  it('the planner climbs for three minutes on any seed; the drifter climbs but meets a sprite', () => {
    for (const seed of [1, 2, 3]) {
      const s = play(newClimb(seed), plannerPolicy, 60 * 60 * 3);
      expect(s.over).toBe(false);
      expect(s.dying).toBe(0);
      expect(metres(s.top)).toBeGreaterThan(2000);
      const d = play(newClimb(seed), drifterPolicy, 60 * 60 * 3);
      expect(d.cause).toBe('sprite');
      expect(metres(d.top)).toBeGreaterThan(200);
    }
  }, 60_000);

  it('replays exactly from the same seed and actions', () => {
    const a = play(newClimb(9), plannerPolicy, 1500);
    const b = play(newClimb(9), plannerPolicy, 1500);
    expect(b).toEqual(a);
  });
});
