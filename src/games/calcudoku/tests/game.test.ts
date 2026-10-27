import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { cageTuples, cageValue } from '../../shared/sudoku/calc';
import { geoFor, rulesOf } from '../../shared/sudoku/play';
import { solveSudoku } from '../../shared/sudoku/solver';
import { calcEnv } from '../ai-adapter';
import { CALC, badCalc, cageLabel, isValidSudokuState, newSudoku, placeDigit } from '../engine';

describe('Calcudoku puzzles', () => {
  it('generates Latin squares with arithmetic cages, unique and at their level, for every size', () => {
    const wanted = {
      easy: [4, 1, 1],
      medium: [5, 1, 2],
      hard: [6, 1, 3],
      expert: [7, 2, 3],
    } as const;
    for (const [difficulty, [size, lo, hi]] of Object.entries(wanted)) {
      for (const seed of [1, 2]) {
        const s = newSudoku(CALC, difficulty, seed);
        const geo = geoFor(CALC, s);
        expect(geo.size).toBe(size);
        expect(geo.units).toHaveLength(2 * size);
        const rules = rulesOf(geo, s);
        expect(s.puzzle.every((x) => x === 0)).toBe(true);
        expect(solveSudoku(geo, s.puzzle, { limit: 2, extra: rules.extra }).count).toBe(1);
        const level = gradePuzzle(geo, s.puzzle, rules.steps).level;
        expect(level).toBeGreaterThanOrEqual(lo);
        expect(level).toBeLessThanOrEqual(hi);
        for (const cage of s.calc!) {
          expect(
            cageValue(
              cage.op,
              cage.cells.map((c) => s.solution[c]!),
            ),
          ).toBe(cage.target);
          if (cage.op === '-' || cage.op === '/') expect(cage.cells).toHaveLength(2);
        }
        expect(isValidSudokuState(CALC, JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
    const s = newSudoku(CALC, 'easy', 3);
    const wrong = s.calc!.map((c, i) => (i ? c : { ...c, target: c.target + 1 }));
    expect(isValidSudokuState(CALC, { ...s, calc: wrong })).toBe(false);
  });

  it('knows the cage tuples and marks a missed target', () => {
    const geo = geoFor(CALC, { difficulty: 'easy' });
    expect(cageTuples(geo, { cells: [0, 1], target: 3, op: '/' })).toEqual([
      [1, 3],
      [3, 1],
    ]);
    // An L-shaped cage may repeat a digit across rows and columns.
    expect(cageTuples(geo, { cells: [0, 1, 5], target: 4, op: '*' })).toContainEqual([2, 1, 2]);
    let s = newSudoku(CALC, 'easy', 4);
    const cage = s.calc!.find((c) => c.op !== '=')!;
    for (const c of cage.cells) s = placeDigit(CALC, s, c, s.solution[c] === 1 ? 2 : 1);
    expect(badCalc(s).size).toBeGreaterThan(0);
    expect(cageLabel({ cells: [0], target: 12, op: '*' })).toBe('12×');
  });

  it('lets the technique solver and the exact solver finish an Expert puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(CALC, 'expert', 8);
      for (let i = 0; i < 49 && !s.solved; i++) s = calcEnv.applyAction(s, move(CALC, s));
      expect(s.solved).toBe(true);
      expect(calcEnv.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(CALC, 'easy', 6);
    // Fill a row's empty cells with wrong-but-legal digits until something breaks.
    for (let i = 0; i < 49 && sudokuActions(CALC, s).length; i++) {
      const legal = sudokuActions(CALC, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = calcEnv.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(calcEnv.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(calcEnv, {
  configs: [undefined, { difficulty: 'expert' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) => ['49:1', '0:0', 'x'].filter((a) => !sudokuActions(CALC, s).includes(a)),
});
