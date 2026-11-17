import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { greedyMove, pegActions } from '../ai';
import { pegEnv } from '../ai-adapter';
import {
  SHAPES,
  count,
  geometry,
  has,
  initialPegs,
  isValidPegState,
  isWin,
  jump,
  legalJumps,
  newPegGame,
  nextJump,
  pegsOf,
  play,
  solve,
  undo,
  type Jump,
} from '../engine';

describe('Peg Solitaire boards', () => {
  const HOLES: Record<string, number> = {
    english: 33,
    european: 37,
    german: 45,
    asymmetric: 39,
    diamond: 41,
    triangle: 15,
    triangle21: 21,
    hexagon: 37,
  };

  it('has the classic hole counts and opening jumps', () => {
    expect(Object.keys(SHAPES).sort()).toEqual(Object.keys(HOLES).sort());
    for (const [id, n] of Object.entries(HOLES)) {
      const shape = SHAPES[id]!;
      expect(geometry(shape).cellOf).toHaveLength(n);
      expect(count(initialPegs(shape))).toBe(n - 1);
      expect(shape.start).toBeLessThan(n);
      if (shape.goal !== null) expect(shape.goal).toBeLessThan(n);
    }
    expect(legalJumps(SHAPES.english!, initialPegs(SHAPES.english!))).toHaveLength(4);
    expect(legalJumps(SHAPES.german!, initialPegs(SHAPES.german!))).toHaveLength(4);
    expect(legalJumps(SHAPES.asymmetric!, initialPegs(SHAPES.asymmetric!))).toHaveLength(4);
    expect(legalJumps(SHAPES.triangle!, initialPegs(SHAPES.triangle!))).toHaveLength(2);
    expect(legalJumps(SHAPES.triangle21!, initialPegs(SHAPES.triangle21!))).toHaveLength(2);
    // An inner hole of the hexagon can be reached from all six directions.
    expect(legalJumps(SHAPES.hexagon!, initialPegs(SHAPES.hexagon!))).toHaveLength(6);
  });

  it('starts and goals sit where the boards say', () => {
    const at = (id: string, h: number) => {
      const g = geometry(SHAPES[id]!);
      return [g.cellOf[h]! % g.width, Math.floor(g.cellOf[h]! / g.width)];
    };
    // The cross boards start and end on their centre.
    expect(at('english', SHAPES.english!.start)).toEqual([3, 3]);
    expect(SHAPES.english!.goal).toBe(SHAPES.english!.start);
    expect(at('german', SHAPES.german!.start)).toEqual([4, 4]);
    expect(SHAPES.german!.goal).toBe(SHAPES.german!.start);
    // The 3-3-2-2 centre: two-hole arms on the left and bottom, three-hole arms right and top.
    expect(at('asymmetric', SHAPES.asymmetric!.start)).toEqual([3, 4]);
    expect(SHAPES.asymmetric!.goal).toBe(SHAPES.asymmetric!.start);
    // The diamond: two above the centre to two below it.
    expect(at('diamond', SHAPES.diamond!.start)).toEqual([4, 2]);
    expect(at('diamond', SHAPES.diamond!.goal!)).toEqual([4, 6]);
    // The hexagon: either side of the centre.
    expect(at('hexagon', SHAPES.hexagon!.start)).toEqual([2, 3]);
    expect(at('hexagon', SHAPES.hexagon!.goal!)).toEqual([4, 3]);
  });

  it('the diamond cannot finish from its centre (position classes)', () => {
    // A jump flips the parity of the pegs on all three diagonal classes (x + y mod 3, and likewise
    // x − y), so those parity differences never change. Single pegs never match a centre start.
    const shape = SHAPES.diamond!;
    const g = geometry(shape);
    const cls = (holes: number[]) => {
      const a = [0, 0, 0];
      const b = [0, 0, 0];
      for (const h of holes) {
        const x = g.cellOf[h]! % g.width;
        const y = Math.floor(g.cellOf[h]! / g.width);
        a[(x + y) % 3]! ^= 1;
        b[(((x - y) % 3) + 3) % 3]! ^= 1;
      }
      return `${a[0]! ^ a[1]!}${a[1]! ^ a[2]!}${b[0]! ^ b[1]!}${b[1]! ^ b[2]!}`;
    };
    const all = g.cellOf.map((_, h) => h);
    const centre = g.holeAt[4 * g.width + 4]!;
    const fromCentre = cls(all.filter((h) => h !== centre));
    expect(all.some((h) => cls([h]) === fromCentre)).toBe(false);
    // The chosen start does allow its goal.
    expect(cls(all.filter((h) => h !== shape.start))).toBe(cls([shape.goal!]));
  });

  it('finds a finish on every board from the start', () => {
    for (const id of Object.keys(HOLES)) {
      const shape = SHAPES[id]!;
      let line: Jump[];
      if (shape.line) {
        // The big square boards carry a line found offline; it must replay jump by jump.
        line = shape.line;
      } else {
        const r = solve(shape, initialPegs(shape), 5_000_000);
        expect(r.jumps, id).not.toBeNull();
        line = r.jumps!;
      }
      let p = initialPegs(shape);
      for (const j of line) {
        expect(legalJumps(shape, p), id).toContainEqual(j);
        p = jump(p, j);
      }
      expect(isWin(shape, p), id).toBe(true);
      if (shape.goal !== null) expect(has(p, shape.goal)).toBe(true);
    }
  });

  it('hints and the solver agent follow the known line on the big boards', () => {
    for (const id of ['german', 'asymmetric', 'diamond']) {
      let s = newPegGame(id);
      while (s.status === 'playing') s = play(s, nextJump(s).jump!);
      expect(s.status, id).toBe('won');
    }
  });

  it('reports a position with no finish', () => {
    const shape = SHAPES.triangle!;
    // Two pegs far apart cannot be reduced to one.
    const p = (1n << 0n) | (1n << 14n);
    expect(solve(shape, p).jumps).toBeNull();
    expect(solve(shape, p).exhausted).toBe(false);
  });
});

describe('Peg Solitaire play', () => {
  it('jumps, undoes, and follows the solver to a win', () => {
    let s = newPegGame('english');
    const j = legalJumps(SHAPES.english!, pegsOf(s))[0]!;
    s = play(s, j);
    expect(count(pegsOf(s))).toBe(31);
    s = undo(s);
    expect(s).toMatchObject({ jumps: 0, undos: 1 });
    while (s.status === 'playing') s = play(s, nextJump(s).jump!);
    expect(s.status).toBe('won');
  });

  it('greedy jumps are legal and saves validate by replay', () => {
    let s = newPegGame('triangle');
    const rng = new Rng(2);
    while (s.status === 'playing') {
      const a = greedyMove(s, rng);
      expect(pegActions(s)).toContain(a);
      s = pegEnv.applyAction(s, a);
    }
    expect(isValidPegState(s)).toBe(true);
    expect(isValidPegState({ ...s, pegs: 'ff' })).toBe(false);
    expect(isValidPegState({ ...s, board: 'square' })).toBe(false);
    expect(isValidPegState({ ...s, status: s.status === 'won' ? 'stuck' : 'won' })).toBe(false);
  });
});

describeAdapterContract(pegEnv, {
  configs: [undefined, { board: 'triangle' }, { board: 'hexagon' }, { board: 'german' }],
  playouts: 6,
  maxSteps: 40,
  illegalActions: (s) => ['0-0', '99-1', 'x'].filter((a) => !pegActions(s).includes(a)),
});
