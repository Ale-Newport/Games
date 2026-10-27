import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { geometry } from '../../shared/sudoku/grid';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { solveSudoku } from '../../shared/sudoku/solver';
import { rulesOf } from '../../shared/sudoku/play';
import { killerEnv } from '../ai-adapter';
import { KILLER, badCages, isValidSudokuState, newSudoku, placeDigit } from '../engine';

const geo = geometry(KILLER.shape);

describe('Killer Sudoku puzzles', () => {
  it('generates every difficulty with no givens, unique, at its technique level', () => {
    const wanted = { easy: [1], medium: [1, 2], hard: [2, 3] } as const;
    for (const [difficulty, levels] of Object.entries(wanted)) {
      for (const seed of [1, 2]) {
        const s = newSudoku(KILLER, difficulty, seed);
        const rules = rulesOf(geo, s);
        expect(s.puzzle.every((x) => x === 0)).toBe(true);
        expect(solveSudoku(geo, s.puzzle, { limit: 2, extra: rules.extra }).count).toBe(1);
        expect(levels).toContain(gradePuzzle(geo, s.puzzle, rules.steps).level);
        const sizes = s.cages!.map((c) => c.cells.length);
        expect(Math.max(...sizes)).toBeLessThanOrEqual(KILLER.difficulties[difficulty]!.cages!.max);
        expect(isValidSudokuState(KILLER, JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
    const s = newSudoku(KILLER, 'easy', 3);
    expect(isValidSudokuState(KILLER, { ...s, cages: s.cages!.slice(1) })).toBe(false);
    const wrongSum = s.cages!.map((c, i) => (i ? c : { ...c, sum: c.sum + 1 }));
    expect(isValidSudokuState(KILLER, { ...s, cages: wrongSum })).toBe(false);
  });

  it('marks cages that repeat a digit or miss their sum', () => {
    let s = newSudoku(KILLER, 'easy', 4);
    const cage = s.cages!.find((c) => c.cells.length >= 2)!;
    s = placeDigit(KILLER, s, cage.cells[0]!, 9);
    s = placeDigit(KILLER, s, cage.cells[1]!, 9);
    expect(badCages(s).size).toBeGreaterThan(0);
  });

  it('lets the technique solver and the exact solver finish a Hard puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(KILLER, 'hard', 8);
      for (let i = 0; i < 81 && !s.solved; i++) s = killerEnv.applyAction(s, move(KILLER, s));
      expect(s.solved).toBe(true);
      expect(killerEnv.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(KILLER, 'easy', 6);
    // Fill a row's empty cells with wrong-but-legal digits until something breaks.
    for (let i = 0; i < 81 && sudokuActions(KILLER, s).length; i++) {
      const legal = sudokuActions(KILLER, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = killerEnv.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(killerEnv.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(killerEnv, {
  configs: [undefined, { difficulty: 'medium' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) => ['81:1', '0:0', 'x'].filter((a) => !sudokuActions(KILLER, s).includes(a)),
});
