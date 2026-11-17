import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import { SIM } from '../definition';
import { CELL, MAPS, SIZE } from '../maps';
import {
  findPath,
  GRAVITY,
  hitFighter,
  JUMP,
  move,
  newMatch,
  NO_INPUT,
  RUN,
  stepMatch,
  think,
  type Fighter,
  type Input,
  type Match,
} from '../sim';
import { WEAPONS } from '../weapons';

const map = MAPS.courtyard!;
const solo = (seed = 1, bots = 1): Match =>
  newMatch(seed, {
    map: 'courtyard',
    loadout: 'rifleman',
    bots,
    level: 'easy',
    goal: 15,
    minutes: 3,
  });

/** You at a cell centre, facing north (−z). */
const placeAt = (f: Fighter, cx: number, cz: number, yaw = 0): Fighter => ({
  ...f,
  x: (cx + 0.5) * CELL,
  z: (cz + 0.5) * CELL,
  y: map.levels[cz * SIZE + cx]! * 0.5,
  yaw,
  pitch: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  ground: true,
});

const run = (f: Fighter, input: Partial<Input>, steps: number) => {
  let g = f;
  for (let i = 0; i < steps; i++) g = move(map, g, { ...NO_INPUT, ...input });
  return g;
};

describe('Blocky Arena movement', () => {
  it('runs at the top speed and stops with friction', () => {
    // Facing east along an open row.
    const me = placeAt(solo().fighters[0]!, 8, 22, -Math.PI / 2);
    const g = run(me, { fx: 1 }, 60);
    expect(Math.hypot(g.vx, g.vz)).toBeCloseTo(RUN, 0);
    expect(g.x).toBeGreaterThan(me.x + 5);
    const h = run(g, {}, 40);
    expect(Math.hypot(h.vx, h.vz)).toBeLessThan(0.2);
  });

  it('jumps about 1.4 units high and lands', () => {
    const me = placeAt(solo().fighters[0]!, 15, 22);
    let g = move(map, me, { ...NO_INPUT, jump: true });
    let top = 0;
    for (let i = 0; i < 80; i++) {
      g = move(map, g, NO_INPUT);
      top = Math.max(top, g.y);
    }
    expect(top).toBeCloseTo((JUMP * JUMP) / (2 * GRAVITY), 0);
    expect(g.ground).toBe(true);
    expect(g.y).toBe(0);
  });

  it('walks up the stairs to the keep and is blocked by walls', () => {
    // West stairs at z = 15, x = 8..12 (levels 1..5), keep at x = 13 (level 6).
    const me = placeAt(solo().fighters[0]!, 6, 15, (Math.PI / 2) * -1);
    const g = run(me, { fx: 1 }, 200);
    expect(g.y).toBe(3);
    const wall = placeAt(solo().fighters[0]!, 1, 15, Math.PI / 2);
    const w = run(wall, { fx: 1 }, 60);
    expect(w.x).toBeGreaterThan(CELL + 0.3);
  });

  it('a slide boosts speed; chained jumps keep it', () => {
    const me = placeAt(solo().fighters[0]!, 6, 22, -Math.PI / 2);
    const fast = run(me, { fx: 1 }, 60);
    const slid = move(map, fast, { ...NO_INPUT, fx: 1, crouch: true });
    expect(Math.hypot(slid.vx, slid.vz)).toBeGreaterThan(RUN * 1.1);
    let hop = move(map, fast, { ...NO_INPUT, fx: 1, jump: true });
    for (let i = 0; i < 40; i++) hop = move(map, hop, { ...NO_INPUT, fx: 1, jump: true });
    expect(Math.hypot(hop.vx, hop.vz)).toBeGreaterThan(RUN * 0.95);
  });
});

describe('Blocky Arena combat', () => {
  const duel = (dist: number): Match => {
    const m = solo(2, 1);
    const you = placeAt(m.fighters[0]!, 15, 24);
    const bot = { ...placeAt(m.fighters[1]!, 15, 24), z: you.z - dist, mind: null, bot: true };
    return { ...m, fighters: [you, { ...bot, yaw: Math.PI }] };
  };

  it('hit boxes: the head is above the body', () => {
    const m = duel(10);
    const bot = m.fighters[1]!;
    const [t1, head1] = hitFighter(bot, [bot.x, bot.y + 1.6, bot.z + 10], [0, 0, -1]);
    const [, head2] = hitFighter(bot, [bot.x, bot.y + 0.8, bot.z + 10], [0, 0, -1]);
    expect(t1).toBeCloseTo(10 - 0.22, 1);
    expect(head1).toBe(true);
    expect(head2).toBe(false);
  });

  it('firing spends ammo, damages and recoils; an empty magazine reloads', () => {
    let m = duel(8);
    // Aim at the chest.
    const you = m.fighters[0]!;
    m = { ...m, fighters: [{ ...you, pitch: Math.atan2(1.1 - 1.6, 8) }, m.fighters[1]!] };
    const before = m.fighters[1]!.hp;
    m = stepMatch(m, { ...NO_INPUT, fire: true, aim: true });
    expect(m.fighters[0]!.ammo[0]).toBe(WEAPONS.rifle.mag - 1);
    expect(m.fighters[1]!.hp).toBeLessThan(before);
    expect(m.events).toContain('shot-rifle');
    m = { ...m, fighters: [{ ...m.fighters[0]!, ammo: [0, 10] }, m.fighters[1]!] };
    m = stepMatch(m, NO_INPUT);
    expect(m.fighters[0]!.reload).toBeGreaterThan(0);
    for (let i = 0; i < WEAPONS.rifle.reload + 2; i++) m = stepMatch(m, NO_INPUT);
    expect(m.fighters[0]!.ammo[0]).toBe(WEAPONS.rifle.mag);
  });

  it('a headshot does more damage; blocks stop bullets', () => {
    let m = duel(8);
    const you = m.fighters[0]!;
    m = {
      ...m,
      fighters: [
        { ...you, pitch: Math.atan2(1.6 - 1.6, 8) },
        { ...m.fighters[1]!, hp: 100 },
      ],
    };
    m = stepMatch(m, { ...NO_INPUT, fire: true, aim: true });
    expect(100 - m.fighters[1]!.hp).toBe(Math.round(WEAPONS.rifle.damage * WEAPONS.rifle.head));
    // Behind the keep wall: you at x = 11 (stairs), the bot inside the keep's far side cannot be hit.
    const w = solo(3, 1);
    const a = placeAt(w.fighters[0]!, 15, 21, 0);
    const b = { ...placeAt(w.fighters[1]!, 15, 11), bot: true };
    let x: Match = { ...w, fighters: [a, b] };
    x = stepMatch(x, { ...NO_INPUT, fire: true, aim: true });
    expect(x.fighters[1]!.hp).toBe(100);
  });

  it('kills count, the dead respawn and health regenerates', () => {
    let m = duel(6);
    m = {
      ...m,
      fighters: [
        { ...m.fighters[0]!, pitch: 0 },
        { ...m.fighters[1]!, hp: 10 },
      ],
    };
    m = stepMatch(m, { ...NO_INPUT, fire: true, aim: true });
    expect(m.fighters[0]!.kills).toBe(1);
    expect(m.fighters[1]!.alive).toBe(false);
    expect(m.events).toContain('kill-head');
    expect(m.feed).toHaveLength(1);
    for (let i = 0; i < 200; i++) m = stepMatch(m, NO_INPUT);
    expect(m.fighters[1]!.alive).toBe(true);
    let r = duel(30);
    r = { ...r, fighters: [{ ...r.fighters[0]!, hp: 40, lastHit: 0 }, r.fighters[1]!] };
    for (let i = 0; i < 300; i++)
      r = {
        ...stepMatch(r, NO_INPUT),
        fighters: stepMatch(r, NO_INPUT).fighters.map((f, k) =>
          k === 1 ? { ...f, hp: 100, x: r.fighters[1]!.x, z: r.fighters[1]!.z } : f,
        ),
      };
    expect(r.fighters[0]!.hp).toBeGreaterThan(40);
  });
});

describe('Blocky Arena bots and matches', () => {
  it('finds paths over stairs and around walls', () => {
    const p = findPath(map, 22 * SIZE + 15, 15 * SIZE + 15);
    expect(p.length).toBeGreaterThan(5);
    expect(p[p.length - 1]).toBe(15 * SIZE + 15);
  });

  it('bots hunt an idle player and a match runs to its end', () => {
    let m = newMatch(5, {
      map: 'docks',
      loadout: 'rifleman',
      bots: 5,
      level: 'normal',
      goal: 10,
      minutes: 3,
    });
    while (!m.over) m = stepMatch(m, think(m, 0, 'hard')[0]);
    const leader = Math.max(...m.fighters.map((f) => f.kills));
    expect(leader === 10 || m.t >= m.limit).toBe(true);
    expect(m.fighters.reduce((n, f) => n + f.deaths, 0)).toBeGreaterThan(5);
    expect(SIM.result(m, { map: 'docks', level: 'normal' }).mode).toBe('docks-normal');
    let idle = solo(9, 5);
    for (let i = 0; i < 60 * 30 && idle.fighters[0]!.deaths === 0; i++)
      idle = stepMatch(idle, NO_INPUT);
    expect(idle.fighters[0]!.deaths).toBe(1);
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ options: { bots: '3', level: 'hard', length: 'short' } }],
  playouts: 1,
  maxSteps: 60 * 60 * 7 + 1,
  illegalActions: () => ['jump', 'fff'],
});
