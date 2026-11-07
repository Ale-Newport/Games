import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { geometry } from '../../shared/sudoku/grid';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { hasUniqueSolution } from '../../shared/sudoku/solver';
import { sudoku9Env } from '../ai-adapter';
import { SUDOKU_9, newSudoku } from '../engine';

const geo = geometry(SUDOKU_9.shape);

describe('Classic Sudoku puzzles', () => {
  it('generates every difficulty with a unique solution at its technique level', () => {
    const wanted = { easy: 1, medium: 1, hard: 2, expert: 3 } as const;
    for (const [difficulty, level] of Object.entries(wanted)) {
      for (const seed of [1, 2, 3]) {
        const s = newSudoku(SUDOKU_9, difficulty, seed);
        const clues = s.puzzle.filter((x) => x).length;
        const spec = SUDOKU_9.difficulties[difficulty]!;
        expect(hasUniqueSolution(geo, s.puzzle)).toBe(true);
        expect(gradePuzzle(geo, s.puzzle).level).toBe(level);
        expect(clues).toBeGreaterThanOrEqual(spec.minClues);
        expect(clues).toBeLessThanOrEqual(spec.maxClues);
      }
    }
    // Easy keeps more clues than Medium.
    expect(newSudoku(SUDOKU_9, 'easy', 4).puzzle.filter((x) => x).length).toBeGreaterThan(
      newSudoku(SUDOKU_9, 'medium', 4).puzzle.filter((x) => x).length,
    );
  });

  it('lets the technique solver and the exact solver finish an Expert puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(SUDOKU_9, 'expert', 8);
      for (let i = 0; i < 81 && !s.solved; i++) s = sudoku9Env.applyAction(s, move(SUDOKU_9, s));
      expect(s.solved).toBe(true);
      expect(sudoku9Env.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(SUDOKU_9, 'easy', 6);
    // Fill a row's empty cells with wrong-but-legal digits until something breaks.
    for (let i = 0; i < 81 && sudokuActions(SUDOKU_9, s).length; i++) {
      const legal = sudokuActions(SUDOKU_9, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = sudoku9Env.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(sudoku9Env.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(sudoku9Env, {
  configs: [undefined, { difficulty: 'hard' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) =>
    ['81:1', '0:0', 'x'].filter((a) => !sudokuActions(SUDOKU_9, s).includes(a)),
});
