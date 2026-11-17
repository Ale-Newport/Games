import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import { CELLS } from '../definition';
import {
  botAction,
  EJECT_COST,
  EJECT_MASS,
  massOf,
  newDish,
  radius,
  speed,
  stepDish,
  VIRUS_MASS,
  type Cell,
  type Dish,
} from '../sim';

/** Just you (and the given cells) in an empty dish. */
const empty = (cells: Partial<Cell>[] = [], mass = 12): Dish => {
  const d = newDish(1, 1, 'easy');
  const you: Cell = { ...d.cells[0]!, mass };
  const others = cells.map((c, i) => ({
    id: 100 + i,
    owner: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 10,
    merge: 0,
    ...c,
  }));
  return { ...d, cells: [you, ...others], food: [], blobs: [] };
};

describe('Cell Arena rules', () => {
  it('cells move towards the pointer, slower when bigger', () => {
    expect(speed(500)).toBeLessThan(speed(20));
    let d = empty();
    d = stepDish(d, 'd0');
    expect(d.cells[0]!.x).toBeCloseTo(speed(12), 5);
    expect(d.cells[0]!.y).toBeCloseTo(0, 5);
  });

  it('a cell eats a covered cell with 25 % less mass, not an equal one', () => {
    let d = empty([{ x: 5, y: 0, mass: 20 }], 30);
    d = { ...d, players: d.players.map((p) => ({ ...p })) };
    d = stepDish(d, 'idle');
    expect(massOf(d, 0)).toBeCloseTo(50, 0);
    let e = empty([{ x: 5, y: 0, mass: 26 }], 30);
    e = stepDish(e, 'idle');
    expect(massOf(e, 0)).toBeCloseTo(30, 0);
  });

  it('splitting halves cells, launches them, needs a fresh press, and they merge after the cooldown', () => {
    let d = empty([], 100);
    d = { ...d, cells: [{ ...d.cells[0]!, x: -1500 }], players: [d.players[0]!] };
    d = stepDish(d, 'd0s');
    let own = d.cells.filter((c) => c.owner === 0);
    expect(own).toHaveLength(2);
    expect(own[0]!.mass).toBeCloseTo(50, 1);
    d = stepDish(d, 'd0s');
    expect(d.cells.filter((c) => c.owner === 0)).toHaveLength(2);
    d = stepDish(d, 'd0');
    d = stepDish(d, 'd0s');
    expect(d.cells.filter((c) => c.owner === 0)).toHaveLength(4);
    for (let i = 0; i < 30 * 40; i++) d = stepDish(d, 'idle');
    own = d.cells.filter((c) => c.owner === 0);
    expect(own).toHaveLength(1);
    expect(own[0]!.mass).toBeGreaterThan(95);
  });

  it('ejecting fires a blob and costs mass, at most every three steps', () => {
    let d = empty([], 100);
    d = { ...d, players: [d.players[0]!], cells: [d.cells[0]!] };
    d = stepDish(d, 'd0w');
    expect(d.cells[0]!.mass).toBeCloseTo(100 - EJECT_COST, 1);
    expect(d.blobs).toHaveLength(1);
    expect(d.blobs[0]!.mass).toBe(EJECT_MASS);
    d = stepDish(d, 'd0w');
    expect(d.blobs).toHaveLength(1);
  });

  it('a big cell eating a virus bursts into pieces; a small one passes under it', () => {
    let d = empty([], 300);
    d = {
      ...d,
      players: [d.players[0]!],
      cells: [d.cells[0]!],
      blobs: [{ x: 10, y: 0, vx: 0, vy: 0, mass: VIRUS_MASS, hue: 120, virus: true, fed: 0 }],
    };
    d = stepDish(d, 'idle');
    expect(d.cells.filter((c) => c.owner === 0).length).toBeGreaterThan(5);
    expect(massOf(d, 0)).toBeCloseTo(400, 0);
    let s = empty([], 50);
    s = {
      ...s,
      players: [s.players[0]!],
      cells: [s.cells[0]!],
      blobs: [{ x: 5, y: 0, vx: 0, vy: 0, mass: VIRUS_MASS, hue: 120, virus: true, fed: 0 }],
    };
    s = stepDish(s, 'idle');
    expect(s.cells).toHaveLength(1);
    expect(s.blobs).toHaveLength(1);
  });

  it('being eaten entirely ends the run and credits the eater', () => {
    let d = empty([{ x: 3, y: 0, mass: 200 }], 12);
    d = stepDish(d, 'idle');
    expect(d.over).toBe(true);
    expect(d.killedBy).toBe(d.players[1]!.name);
    expect(d.players[1]!.kills).toBe(1);
    expect(CELLS.ending(d)[0]).toBe('end.eaten');
  });

  it('maps controls to actions', () => {
    const d = empty();
    expect(CELLS.control(d, new Set(['right'] as const), null)).toBe('d0');
    expect(CELLS.control(d, new Set(['up', 'fire'] as const), null)).toBe('d12s');
    expect(CELLS.control(d, new Set(['alt'] as const), { x: 400, y: 450 })).toBe('d4w');
    expect(CELLS.control(d, new Set(), null)).toBe('idle');
    expect(radius(400)).toBeGreaterThan(radius(100));
  });
});

describe('Cell Arena bots', () => {
  it('the hunter grows and bots eat each other', () => {
    let d = newDish(3, 25, 'hard');
    let deaths = 0;
    for (let i = 0; i < 30 * 120 && !d.over; i++) {
      const alive = d.players.filter((p) => p.alive).length;
      d = stepDish(d, botAction(d, 0, 'hard'));
      deaths += Math.max(0, alive - d.players.filter((p) => p.alive).length);
    }
    expect(d.players[0]!.best).toBeGreaterThan(40);
    expect(deaths).toBeGreaterThan(0);
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ options: { bots: '10', level: 'hard' } }],
  playouts: 1,
  maxSteps: 30 * 60 * 20 + 1,
  illegalActions: () => ['jump', 'd16'],
});
