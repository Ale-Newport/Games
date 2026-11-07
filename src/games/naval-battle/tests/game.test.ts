import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { analystShot, density, hunterShot } from '../ai';
import { navalEnv } from '../ai-adapter';
import {
  act,
  afloat,
  FLEET,
  isValidFleet,
  isValidNaval,
  legalActions,
  newNaval,
  observe,
  randomFleet,
  shipCells,
  type Ship,
} from '../engine';
import { seedRng } from '../../../core/game-engine/random';

const fleet: Ship[] = [
  { cells: shipCells(0, 5, false)! },
  { cells: shipCells(20, 4, false)! },
  { cells: shipCells(40, 3, false)! },
  { cells: shipCells(60, 3, false)! },
  { cells: shipCells(80, 2, false)! },
];

describe('Naval Battle rules', () => {
  it('fleets: five straight, non-overlapping ships of 5, 4, 3, 3, 2', () => {
    expect(isValidFleet(fleet)).toBe(true);
    expect(isValidFleet([...fleet.slice(0, 4), { cells: [80, 91] }])).toBe(false);
    expect(isValidFleet([...fleet.slice(0, 4), { cells: [1, 2] }])).toBe(false);
    expect(shipCells(8, 3, false)).toBeNull();
    for (let s = 1; s < 20; s++) expect(isValidFleet(randomFleet(seedRng(s))[0])).toBe(true);
    expect(FLEET.reduce((a, b) => a + b, 0)).toBe(17);
  });

  it('miss, hit and sunk; turns alternate; sinking every ship wins', () => {
    let g = newNaval(3, fleet);
    // Seat 1 fires at seat 0's fleet: hits on the 2-cell ship at 80–81.
    g = act(g, `fire:${g.fleets[1][0]!.cells[0]}`);
    expect(g.last!.result).toBe('hit');
    g = act(g, 'fire:80');
    expect(g.last!.result).toBe('hit');
    g = act(g, 'fire:99');
    g = act(g, 'fire:81');
    expect(g.last).toMatchObject({ seat: 1, result: 'sunk', ship: 2 });
    expect(afloat(g, 1)).toHaveLength(4);
    // Seat 0 sinks everything.
    let h = newNaval(5, fleet);
    for (const s of h.fleets[1]) for (const c of s.cells) h = act({ ...h, turn: 0 }, `fire:${c}`);
    expect(h.phase).toBe('over');
    expect(h.winner).toBe(0);
  });

  it('a cell cannot be fired at twice; observations hide the enemy fleet', () => {
    let g = act(newNaval(2, fleet), 'fire:0');
    g = act(g, 'fire:0');
    expect(legalActions(g)).not.toContain('fire:0');
    expect(act(g, 'fire:0')).toBe(g);
    expect(observe(g, 0).fleets[1]).toEqual([]);
    expect(observe(g, 1).fleets[1]).toEqual(g.fleets[1]);
    expect(isValidNaval(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidNaval({ ...g, turn: 1 })).toBe(false);
  });
});

describe('Naval Battle players', () => {
  const shotsToSink = (f: typeof analystShot, seed: number) => {
    let g = newNaval(seed);
    let n = 0;
    while (g.phase === 'play') {
      g = act({ ...g, turn: 0 }, `fire:${f({ ...g, turn: 0 })}`);
      n++;
    }
    return n;
  };

  it('the analyst prefers cells next to an unsunk hit', () => {
    let g = newNaval(1, fleet);
    const target = g.fleets[1][0]!.cells[1]!;
    g = { ...g, shots: [{ [target]: 'hit' }, {}] };
    const dens = density(g, 0);
    const best = dens.indexOf(Math.max(...dens));
    expect([target - 1, target + 1, target - 10, target + 10]).toContain(best);
  });

  it('the analyst sinks a fleet in fewer shots than the hunter, both far under random', () => {
    let a = 0;
    let h = 0;
    for (let s = 1; s <= 30; s++) {
      a += shotsToSink(analystShot, s);
      h += shotsToSink(hunterShot, s);
    }
    expect(a / 30).toBeLessThan(50);
    expect(a).toBeLessThan(h);
    expect(h / 30).toBeLessThan(60);
  });
});

describeAdapterContract(navalEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 400,
  illegalActions: (g) =>
    ['jump', 'fire:100', 'fire:-1'].filter((a) => !legalActions(g).includes(a)),
});
