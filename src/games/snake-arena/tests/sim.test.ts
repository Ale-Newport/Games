import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import { SNAKES } from '../definition';
import {
  ARENA_R,
  MIN_BOOST_MASS,
  newArena,
  parseAction,
  points,
  policy,
  radius,
  stepArena,
  toAction,
  type Arena,
} from '../sim';

const head = (a: Arena, i = 0) => [a.snakes[i]!.body[0]!, a.snakes[i]!.body[1]!] as const;

/** An arena with only you, far from everything. */
const alone = (seed = 1): Arena => {
  const a = newArena(seed, 3, 'easy');
  return { ...a, snakes: [a.snakes[0]!], food: [] };
};

describe('Snake Arena movement', () => {
  it('moves forward, turns at a limited rate and the body follows', () => {
    let a = alone();
    const [x0, y0] = head(a);
    const ang = a.snakes[0]!.angle;
    a = stepArena(a, 'idle');
    expect(Math.hypot(head(a)[0] - x0, head(a)[1] - y0)).toBeCloseTo(4, 5);
    a = stepArena(a, 'r');
    const d = a.snakes[0]!.angle - ang;
    const turned = Math.atan2(Math.sin(d), Math.cos(d));
    expect(turned).toBeGreaterThan(0.05);
    expect(turned).toBeLessThan(0.2);
    expect(a.snakes[0]!.body.length).toBe(points(10) * 2);
  });

  it('boosting is faster, burns mass and drops pellets; it needs enough mass', () => {
    let a = alone();
    a = { ...a, snakes: [{ ...a.snakes[0]!, mass: 40, best: 40 }] };
    const [x0, y0] = head(a);
    for (let i = 0; i < 10; i++) a = stepArena(a, 'b');
    expect(Math.hypot(head(a)[0] - x0, head(a)[1] - y0)).toBeGreaterThan(70);
    expect(a.snakes[0]!.mass).toBeLessThan(40);
    expect(a.food.length).toBeGreaterThan(0);
    let small = alone();
    small = { ...small, snakes: [{ ...small.snakes[0]!, mass: MIN_BOOST_MASS - 1 }] };
    const s0 = head(small);
    small = stepArena(small, 'b');
    expect(Math.hypot(head(small)[0] - s0[0], head(small)[1] - s0[1])).toBeCloseTo(4, 5);
  });

  it('eating a pellet adds its value', () => {
    let a = alone();
    const [x, y] = head(a);
    const ang = a.snakes[0]!.angle;
    a = { ...a, food: [x + Math.cos(ang) * 12, y + Math.sin(ang) * 12, 2, 100] };
    a = stepArena(a, 'idle');
    expect(a.snakes[0]!.mass).toBeCloseTo(12);
    expect(a.events).toContain('eat');
  });

  it('a head touching another body dies and turns into pellets; the owner gets the kill', () => {
    const base = newArena(2, 1, 'easy');
    const you = base.snakes[0]!;
    // A bot lying straight across your path.
    const bot = { ...base.snakes[1]!, angle: Math.PI / 2, body: [] as number[], mass: 50 };
    const [x, y] = head(base);
    for (let i = 0; i < points(50); i++)
      bot.body.push(
        x + Math.cos(you.angle) * 20 + i * 0,
        y + Math.sin(you.angle) * 20 - 60 + i * 6,
      );
    let a: Arena = { ...base, snakes: [you, bot], food: [] };
    for (let i = 0; i < 10 && !a.over; i++) a = stepArena(a, 'idle');
    expect(a.over).toBe(true);
    expect(a.killedBy).toBe(bot.name);
    expect(a.snakes[1]!.kills).toBe(1);
    expect(a.food.length / 4).toBeGreaterThan(3);
  });

  it('the wall kills', () => {
    let a = alone();
    const s = a.snakes[0]!;
    a = {
      ...a,
      snakes: [
        { ...s, body: s.body.map((v, i) => (i % 2 === 0 ? v + ARENA_R - 30 : v)), angle: 0 },
      ],
    };
    for (let i = 0; i < 20 && !a.over; i++) a = stepArena(a, 'd0');
    expect(a.over).toBe(true);
    expect(SNAKES.ending(a)[0]).toBe('end.wall');
  });

  it('maps steering to actions', () => {
    expect(toAction({ angle: 0, boost: false })).toBe('d0');
    expect(toAction({ angle: Math.PI / 2, boost: true })).toBe('d4b');
    expect(toAction({ angle: -Math.PI / 2, boost: false })).toBe('d12');
    const s = alone().snakes[0]!;
    expect(parseAction(s, 'd8').angle).toBeCloseTo(Math.PI);
    expect(parseAction(s, 'lb').boost).toBe(true);
    expect(SNAKES.control(alone(), new Set(), { x: 400, y: 100 })).toBe('d12');
    expect(SNAKES.control(alone(), new Set(), { x: 700, y: 250, down: true, mouse: true })).toBe(
      'd0b',
    );
    expect(SNAKES.control(alone(), new Set(['left'] as const), null)).toBe('l');
    expect(radius(1000)).toBeGreaterThan(radius(10));
  });
});

describe('Snake Arena bots', () => {
  it('bots and the hunter policy survive, grow and kill over a long run', () => {
    let a = newArena(3, 20, 'normal');
    let deaths = 0;
    for (let i = 0; i < 30 * 90 && !a.over; i++) {
      const alive = a.snakes.filter((s) => s.alive).length;
      a = stepArena(a, policy(a));
      deaths += Math.max(0, alive - a.snakes.filter((s) => s.alive).length);
    }
    expect(a.t).toBeGreaterThan(30 * 30);
    expect(a.snakes[0]!.best).toBeGreaterThan(30);
    expect(deaths).toBeGreaterThan(0);
    expect(a.snakes.filter((s) => s.alive).length).toBeGreaterThan(15);
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ options: { bots: '10', level: 'hard' } }],
  playouts: 1,
  maxSteps: 30 * 60 * 20 + 1,
  illegalActions: () => ['jump', 'd16'],
});
