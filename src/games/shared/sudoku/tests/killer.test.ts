import { describe, expect, it } from 'vitest';
import { geometry } from '../grid';
import { cageExtra, cageIndex, generateKiller, killerSteps, type Cage } from '../killer';
import { applyStep, gradePuzzle, logicState, nextStep } from '../logic';
import { solveSudoku } from '../solver';

const geo = geometry({ size: 9, boxRows: 3, boxCols: 3 });
const empty = () => Array<number>(81).fill(0);

describe('killer cages', () => {
  it('generates connected, distinct-digit cages with a unique solution', () => {
    const k = generateKiller(geo, 5, { min: 2, max: 4, maxNodes: 4000 }, () => true);
    const owner = cageIndex(81, k.cages);
    expect(owner.every((o) => o >= 0)).toBe(true);
    for (const cage of k.cages) {
      const digits = cage.cells.map((c) => k.solution[c]!);
      expect(new Set(digits).size).toBe(digits.length);
      expect(digits.reduce((a, b) => a + b, 0)).toBe(cage.sum);
      // Connected: every cell reaches the first through orthogonal cage neighbours.
      const seen = new Set([cage.cells[0]!]);
      for (const c of seen)
        for (const x of [c - 9, c + 9, c % 9 ? c - 1 : -1, c % 9 < 8 ? c + 1 : -1])
          if (cage.cells.includes(x)) seen.add(x);
      expect(seen.size).toBe(cage.cells.length);
    }
    const r = solveSudoku(geo, empty(), { limit: 2, extra: cageExtra(geo, k.cages) });
    expect(r.count).toBe(1);
    expect(r.solution).toEqual(k.solution);
  });

  it('prunes candidates by cage combinations and rejects broken cages', () => {
    const cages: Cage[] = [{ cells: [0, 1], sum: 3 }];
    const extra = cageExtra(geo, cages);
    const values = new Int8Array(81);
    const masks = new Int32Array(81).fill((1 << 9) - 1);
    expect(extra.prune!(values, masks)).toBe(1);
    expect(masks[0]).toBe(0b11);
    values[0] = 2;
    expect(extra.check!(values, 0)).toBe(true);
    values[1] = 2;
    expect(extra.check!(values, 1)).toBe(false);
    values[1] = 3;
    expect(extra.check!(values, 1)).toBe(false);
  });

  it('solves with cage combinations and the 45 rule, every step agreeing with the solution', () => {
    for (const seed of [3, 8, 13]) {
      const k = generateKiller(
        geo,
        seed,
        { min: 3, max: 6, maxNodes: 4000 },
        (cages) => gradePuzzle(geo, empty(), killerSteps(cages)).solved,
        60,
      );
      const steps = killerSteps(k.cages);
      const st = logicState(geo, empty());
      const used = new Set<string>();
      for (let i = 0; i < 1000 && st.values.some((v) => !v); i++) {
        const step = nextStep(geo, st, steps)!;
        used.add(step.technique);
        for (const { cell, digit } of step.remove) expect(k.solution[cell]).not.toBe(digit);
        if (step.place) expect(k.solution[step.place.cell]).toBe(step.place.digit);
        applyStep(geo, st, step);
      }
      expect(st.values).toEqual(k.solution);
      expect(used.has('cage-combination')).toBe(true);
    }
  });
});
