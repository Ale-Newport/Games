import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { geoFor, rulesOf } from '../../shared/sudoku/play';
import { solveSudoku } from '../../shared/sudoku/solver';
import { futoshikiEnv } from '../ai-adapter';
import { FUTOSHIKI, brokenSigns, isValidSudokuState, newSudoku, placeDigit } from '../engine';

describe('Futoshiki puzzles', () => {
  it('generates Latin squares with true signs, unique and at their level, for every size', () => {
    const wanted = {
      easy: [4, 1, 1],
      medium: [5, 1, 2],
      hard: [6, 2, 3],
      expert: [7, 3, 3],
    } as const;
    for (const [difficulty, [size, lo, hi]] of Object.entries(wanted)) {
      for (const seed of [1, 2]) {
        const s = newSudoku(FUTOSHIKI, difficulty, seed);
        const geo = geoFor(FUTOSHIKI, s);
        expect(geo.size).toBe(size);
        const rules = rulesOf(geo, s);
        expect(solveSudoku(geo, s.puzzle, { limit: 2, extra: rules.extra }).count).toBe(1);
        const level = gradePuzzle(geo, s.puzzle, rules.steps).level;
        expect(level).toBeGreaterThanOrEqual(lo);
        expect(level).toBeLessThanOrEqual(hi);
        expect(s.signs!.length).toBeGreaterThan(0);
        for (const { less, more } of s.signs!)
          expect(s.solution[less]!).toBeLessThan(s.solution[more]!);
        expect(isValidSudokuState(FUTOSHIKI, JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
    const s = newSudoku(FUTOSHIKI, 'easy', 3);
    const flipped = s.signs!.map((x, i) => (i ? x : { less: x.more, more: x.less }));
    expect(isValidSudokuState(FUTOSHIKI, { ...s, signs: flipped })).toBe(false);
  });

  it('marks a broken sign', () => {
    let s = newSudoku(FUTOSHIKI, 'medium', 4);
    const sign = s.signs!.find((x) => !s.puzzle[x.less] && !s.puzzle[x.more])!;
    s = placeDigit(FUTOSHIKI, s, sign.less, 5);
    s = placeDigit(FUTOSHIKI, s, sign.more, 1);
    expect(brokenSigns(s).size).toBe(1);
  });

  it('lets the technique solver and the exact solver finish an Expert puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(FUTOSHIKI, 'expert', 8);
      for (let i = 0; i < 49 && !s.solved; i++) s = futoshikiEnv.applyAction(s, move(FUTOSHIKI, s));
      expect(s.solved).toBe(true);
      expect(futoshikiEnv.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(FUTOSHIKI, 'easy', 6);
    // Fill a row's empty cells with wrong-but-legal digits until something breaks.
    for (let i = 0; i < 49 && sudokuActions(FUTOSHIKI, s).length; i++) {
      const legal = sudokuActions(FUTOSHIKI, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = futoshikiEnv.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(futoshikiEnv.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(futoshikiEnv, {
  configs: [undefined, { difficulty: 'expert' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) =>
    ['49:1', '0:0', 'x'].filter((a) => !sudokuActions(FUTOSHIKI, s).includes(a)),
});
