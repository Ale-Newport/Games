import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { greedyStep, sortActions, solverStep } from '../../shared/sorting/ai';
import { waterEnv } from '../ai-adapter';
import {
  SPECS,
  amount,
  isSorted,
  isValidSortState,
  move,
  moves,
  newSort,
  pour,
  rulesFor,
  solveSort,
  topRun,
  undo,
} from '../engine';

const rules = { capacity: 4, pourAll: true };

describe('Water Sort rules', () => {
  it('pours whole runs onto empty or same-color tops, as much as fits', () => {
    const tubes = [[0, 1, 1], [2, 1], [], [2, 2, 2, 2]];
    expect(topRun(tubes[0]!)).toBe(2);
    expect(amount(tubes, 0, 1, rules)).toBe(2);
    expect(pour(tubes, 0, 1, rules)[1]).toEqual([2, 1, 1, 1]);
    expect(amount(tubes, 0, 3, rules)).toBe(0);
    expect(amount(tubes, 1, 2, rules)).toBe(1);
    expect(isSorted([[1, 1, 1, 1], [], [0, 0, 0, 0]], rules)).toBe(true);
    // A finished tube never moves, and a one-color tube is not poured into an empty one.
    expect(moves(tubes, rules).some(([a]) => a === 3)).toBe(false);
    expect(moves([[1, 1], [], [0]], rules).some(([a, b]) => a === 0 && b === 1)).toBe(false);
  });

  it('every level shuffle is solvable and the solver finishes it', () => {
    for (const level of Object.keys(SPECS)) {
      const s = newSort(SPECS, rulesFor, level, 7);
      const r = solveSort(s.tubes, rulesFor(SPECS[level]!));
      expect(r.moves).not.toBeNull();
      let t = s;
      for (const [a, b] of r.moves!) t = move(t, rulesFor(SPECS[level]!), a, b);
      expect(t.solved).toBe(true);
    }
  });
});

describe('Water Sort play', () => {
  it('moves, undoes, and validates saves by replay', () => {
    let s = newSort(SPECS, rulesFor, 'medium', 3);
    const r = rulesFor(SPECS.medium!);
    const [a, b] = moves(s.tubes, r)[0]!;
    s = move(s, r, a, b);
    expect(s.history).toHaveLength(1);
    expect(isValidSortState(s, SPECS, rulesFor)).toBe(true);
    expect(
      isValidSortState(
        {
          ...s,
          history: [
            [b, a],
            [a, b],
          ],
        },
        SPECS,
        rulesFor,
      ),
    ).toBe(false);
    s = undo(s, r);
    expect(s.tubes).toEqual(s.start);
    expect(s.undos).toBe(1);
  });

  it('agents make legal moves', () => {
    const s = newSort(SPECS, rulesFor, 'easy', 5);
    const r = rulesFor(SPECS.easy!);
    const g = greedyStep(s, r, new Rng(1));
    expect(sortActions(s, r)).toContain(`${g[0]}>${g[1]}`);
    const v = solverStep(s, r)!;
    expect(sortActions(s, r)).toContain(`${v[0]}>${v[1]}`);
  });
});

describeAdapterContract(waterEnv, {
  configs: [undefined, { level: 'hard' }],
  playouts: 4,
  maxSteps: 320,
  illegalActions: (s) =>
    ['0>0', '99>1', 'x'].filter((a) => !waterEnv.getLegalActions(s, 0).includes(a)),
});
