import { describe, expect, it } from 'vitest';
import {
  STAGES,
  climberPolicy,
  downhill,
  girderY,
  joinsOf,
  loopOf,
  newGirders,
  routeOf,
  stageOf,
  stepGirders,
  topOf,
  walkerPolicy,
  type Drum,
  type GirderAction,
  type Girders,
  type Stage,
} from '../sim';

/** Stage 1, the zigzag, where most of the mechanics are checked. */
const Z = STAGES[0]!;
const GIRDERS = Z.girders;
const LADDERS = Z.ladders;
const HAMMERS = Z.hammers;
const TOP = topOf(Z);
const gy = (g: number, x: number) => girderY(Z, g, x);

const run = (s: Girders, a: GirderAction, n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.dying; i++) t = stepGirders(t, a);
  return t;
};
/** A game with the robot quiet (no drums thrown) for a while. */
const quiet = (s: Girders): Girders => ({ ...s, throwIn: 1e9 });
const at = (s: Girders, g: number, x: number): Girders => ({
  ...s,
  p: { ...s.p, g, x, y: girderY(stageOf(s.level), g, x), mode: 'walk' },
});
const drumAt = (g: number, x: number, dir: 1 | -1): Drum => ({
  id: 99,
  x,
  y: gy(g, x),
  mode: 'roll',
  g,
  ladder: -1,
  dir,
  vy: 0,
  cleared: false,
  passed: LADDERS.map((_, i) => i),
});

function play(seed: number, policy: (s: Girders) => GirderAction, cap: number, level = 1) {
  let s = newGirders(seed, level);
  while (!s.over && s.steps < cap) s = stepGirders(s, policy(s));
  return s;
}

/** Girders the climber can walk, climb or step to from the floor (whole ladders both ways, joins). */
function reachableFrom(st: Stage, start: number): Set<number> {
  const seen = new Set([start]);
  const queue = [start];
  const moves = [
    ...st.ladders
      .filter((l) => !l.broken)
      .flatMap((l) => [
        [l.from, l.to],
        [l.to, l.from],
      ]),
    ...joinsOf(st).map((j) => [j.from, j.to]),
  ];
  while (queue.length) {
    const g = queue.pop()!;
    for (const [a, b] of moves)
      if (a === g && !seen.has(b!)) {
        seen.add(b!);
        queue.push(b!);
      }
  }
  return seen;
}

describe('Girder Climb stages', () => {
  it('four distinct stages, each with its own layout', () => {
    expect(STAGES.map((st) => st.id)).toEqual(['zigzag', 'funnel', 'cascade', 'stairway']);
    const shapes = STAGES.map((st) => JSON.stringify([st.girders, st.ladders]));
    expect(new Set(shapes).size).toBe(4);
  });

  it('the zigzag: girders slope alternately so drums roll the other way on each', () => {
    for (let g = 1; g < TOP; g++) expect(downhill(Z, g)).toBe(-downhill(Z, g - 1) as 1 | -1);
    expect(downhill(Z, 5)).toBe(1);
    expect(GIRDERS).toHaveLength(7);
  });

  it.each(STAGES.map((st) => [st.id, st] as const))(
    '%s: a sound layout — on screen, ladders joining girders, things where they belong',
    (_id, st) => {
      for (const g of st.girders) {
        expect(g.x0).toBeGreaterThanOrEqual(0);
        expect(g.x1).toBeLessThanOrEqual(224);
        expect(g.x1 - g.x0).toBeGreaterThanOrEqual(48);
        for (const y of [g.yl, g.yr]) {
          expect(y).toBeGreaterThan(30);
          expect(y).toBeLessThanOrEqual(250);
        }
      }
      // The floor runs the whole width; the kitten's platform is the highest girder.
      expect(st.girders[0]).toMatchObject({ x0: 0, x1: 224 });
      const top = st.girders[topOf(st)]!;
      for (const g of st.girders) expect(Math.min(g.yl, g.yr)).toBeGreaterThanOrEqual(top.yl);
      for (const l of st.ladders) {
        const a = st.girders[l.from]!;
        const b = st.girders[l.to]!;
        expect(l.x).toBeGreaterThanOrEqual(Math.max(a.x0, b.x0));
        expect(l.x).toBeLessThanOrEqual(Math.min(a.x1, b.x1));
        // Upwards, and long enough to need climbing but not more than a storey.
        const len = girderY(st, l.from, l.x) - girderY(st, l.to, l.x);
        expect(len).toBeGreaterThan(24);
        expect(len).toBeLessThan(42);
      }
      // No other girder cuts across a ladder.
      for (const l of st.ladders)
        st.girders.forEach((g, k) => {
          if (k === l.from || k === l.to || l.x < g.x0 || l.x > g.x1) return;
          const y = girderY(st, k, l.x);
          expect(y < girderY(st, l.to, l.x) || y > girderY(st, l.from, l.x)).toBe(true);
        });
      expect(st.startX).toBeGreaterThan(0);
      expect(st.startX).toBeLessThan(224);
      expect(st.kittenX).toBeGreaterThanOrEqual(top.x0);
      expect(st.kittenX).toBeLessThanOrEqual(top.x1);
      for (const h of st.hammers) {
        expect(h.x).toBeGreaterThanOrEqual(st.girders[h.g]!.x0);
        expect(h.x).toBeLessThanOrEqual(st.girders[h.g]!.x1);
      }
      for (const t of st.throws) {
        expect(t.x).toBeGreaterThanOrEqual(st.girders[t.g]!.x0);
        expect(t.x).toBeLessThanOrEqual(st.girders[t.g]!.x1);
      }
    },
  );

  it.each(STAGES.map((st) => [st.id, st] as const))(
    '%s: the kitten can be reached from the start by ladders, and no girder is a dead end',
    (_id, st) => {
      // A path of whole ladders (and walkable joins) from the floor to the kitten's platform.
      expect(reachableFrom(st, 0).has(topOf(st))).toBe(true);
      // Every girder (wherever a jump or a fall leaves the climber) has a way on up.
      const route = routeOf(st);
      for (const d of route) expect(Number.isFinite(d)).toBe(true);
      expect(route[topOf(st)]).toBe(0);
    },
  );

  it.each(STAGES.map((st) => [st.id, st] as const))(
    '%s: every drum thrown rolls, drops and ends up in the recycler or off screen',
    (_id, st) => {
      // Throw one drum of each kind into an empty stage and let it run its course.
      const level = STAGES.indexOf(st) + 1;
      for (let k = 0; k < st.throws.length; k++) {
        let s: Girders = { ...newGirders(1, level), throwIn: 1, nextId: k };
        s = stepGirders(s, 'idle');
        expect(s.drums).toHaveLength(1);
        s = { ...s, throwIn: 1e9, p: { ...s.p, y: -100 } };
        let steps = 0;
        while (s.drums.length && steps < 6000) {
          s = stepGirders({ ...s, bonus: 5000 }, 'idle');
          steps++;
        }
        expect(s.drums).toHaveLength(0);
      }
    },
  );

  it('the climber can rescue the kitten on every stage', () => {
    STAGES.forEach((st, k) => {
      let rescued = false;
      for (let seed = 1; seed <= 8 && !rescued; seed++) {
        let s = newGirders(seed, k + 1);
        while (!s.over && s.level === k + 1 && s.steps < 60 * 60 * 3) {
          s = stepGirders(s, climberPolicy(s));
          rescued ||= s.events.includes('rescue');
        }
      }
      expect(rescued, st.id).toBe(true);
    });
  }, 60_000);

  it('completing a stage moves on to the next; after the fourth the first returns, faster', () => {
    const rescue = (s: Girders): Girders => {
      const st = stageOf(s.level);
      let t = at(quiet(s), topOf(st), st.kittenX + 8);
      t = stepGirders(t, 'left');
      expect(t.events).toContain('rescue');
      for (let i = 0; i < 150 && !t.events.includes('level'); i++) t = stepGirders(t, 'idle');
      return t;
    };
    let s = newGirders(1);
    const seen: string[] = [stageOf(s.level).id];
    for (let k = 0; k < 4; k++) {
      s = rescue(s);
      expect(s.events).toContain('level');
      seen.push(stageOf(s.level).id);
      // A fresh climb on the new stage: on its floor, hammers back, no drums.
      const st = stageOf(s.level);
      expect(s.p.g).toBe(0);
      expect(s.p.x).toBe(st.startX);
      expect(s.hammers).toHaveLength(st.hammers.length);
      expect(s.drums).toHaveLength(0);
    }
    expect(seen).toEqual(['zigzag', 'funnel', 'cascade', 'stairway', 'zigzag']);
    expect(s.level).toBe(5);
    expect(loopOf(4)).toBe(0);
    expect(loopOf(5)).toBe(1);
    // The second round: a bigger bonus and faster, more frequent drums.
    expect(s.bonus).toBe(6000);
    const speedOf = (t: Girders) => {
      let u: Girders = { ...quiet(t), drums: [{ ...drumAt(3, 100, 1) }] };
      const x0 = u.drums[0]!.x;
      u = stepGirders({ ...u, p: { ...u.p, y: -100 } }, 'idle');
      return u.drums[0]!.x - x0;
    };
    expect(speedOf(s)).toBeCloseTo(1.02);
    expect(speedOf(newGirders(1))).toBeCloseTo(0.9);
  });
});

describe('Girder Climb simulation', () => {
  it('walks along the slope and climbs a whole ladder up and back down', () => {
    let s = quiet(newGirders(1));
    const x0 = s.p.x;
    s = run(s, 'right', 40);
    expect(s.p.x).toBeCloseTo(x0 + 30);
    expect(s.p.y).toBeCloseTo(gy(0, s.p.x));
    const l = LADDERS[0]!;
    s = at(s, 0, l.x);
    s = run(s, 'up', 200);
    expect(s.p.mode).toBe('walk');
    expect(s.p.g).toBe(l.to);
    s = run(s, 'down', 200);
    expect(s.p.g).toBe(l.from);
    // Stopping just short of the top, a sideways press steps off onto the girder.
    s = run(s, 'up', 5);
    let near = { ...s, p: { ...s.p, y: gy(l.to, l.x) + 3 } };
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

  it('reaching the kitten scores the bonus and starts the next stage', () => {
    let s = at(quiet(newGirders(1)), TOP, 140);
    s = run(s, 'left', 40);
    expect(s.events.length === 0 || s.rescued > 0).toBe(true);
    expect(s.score).toBe(5000);
    for (let i = 0; i < 150; i++) s = stepGirders(s, 'idle');
    expect(s.level).toBe(2);
    expect(stageOf(s.level).id).toBe('funnel');
    expect(s.p.g).toBe(0);
  });

  it('a peak can be walked across from one side to the other', () => {
    const cascade = STAGES[2]!;
    const [j] = joinsOf(cascade);
    expect(j).toBeDefined();
    const level = 3;
    let s = quiet(newGirders(1, level));
    s = at(s, j!.from, cascade.girders[j!.from]!.x1 - 4);
    s = run(s, 'right', 20);
    expect(s.dying).toBe(0);
    expect(s.p.mode).toBe('walk');
    expect(s.p.g).toBe(j!.to);
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
