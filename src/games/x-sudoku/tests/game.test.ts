import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { geometry } from '../../shared/sudoku/grid';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { hasUniqueSolution } from '../../shared/sudoku/solver';
import { xSudokuEnv } from '../ai-adapter';
import { X_SUDOKU, newSudoku, onDiagonal } from '../engine';

const geo = geometry(X_SUDOKU.shape);

describe('X-Sudoku puzzles', () => {
  it('generates every difficulty with a unique solution at its technique level', () => {
    const wanted = { easy: 1, medium: 1, hard: 2, expert: 3 } as const;
    for (const [difficulty, level] of Object.entries(wanted)) {
      for (const seed of [1, 2, 3]) {
        const s = newSudoku(X_SUDOKU, difficulty, seed);
        const clues = s.puzzle.filter((x) => x).length;
        const spec = X_SUDOKU.difficulties[difficulty]!;
        expect(hasUniqueSolution(geo, s.puzzle)).toBe(true);
        expect(gradePuzzle(geo, s.puzzle).level).toBe(level);
        expect(clues).toBeGreaterThanOrEqual(spec.minClues);
        expect(clues).toBeLessThanOrEqual(spec.maxClues);
      }
    }
    // The solution's diagonals hold 1–9 too.
    const s = newSudoku(X_SUDOKU, 'medium', 5);
    const diag = (f: (i: number) => number) =>
      new Set(Array.from({ length: 9 }, (_, i) => s.solution[f(i)]));
    expect(diag((i) => i * 10).size).toBe(9);
    expect(diag((i) => i * 8 + 8).size).toBe(9);
    expect(Array.from({ length: 81 }, (_, c) => c).filter(onDiagonal)).toHaveLength(17);
    // Easy keeps more clues than Medium.
    expect(newSudoku(X_SUDOKU, 'easy', 4).puzzle.filter((x) => x).length).toBeGreaterThan(
      newSudoku(X_SUDOKU, 'medium', 4).puzzle.filter((x) => x).length,
    );
  });

  it('lets the technique solver and the exact solver finish an Expert puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(X_SUDOKU, 'expert', 8);
      for (let i = 0; i < 81 && !s.solved; i++) s = xSudokuEnv.applyAction(s, move(X_SUDOKU, s));
      expect(s.solved).toBe(true);
      expect(xSudokuEnv.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(X_SUDOKU, 'easy', 6);
    // Fill a row's empty cells with wrong-but-legal digits until something breaks.
    for (let i = 0; i < 81 && sudokuActions(X_SUDOKU, s).length; i++) {
      const legal = sudokuActions(X_SUDOKU, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = xSudokuEnv.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(xSudokuEnv.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(xSudokuEnv, {
  configs: [undefined, { difficulty: 'hard' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) =>
    ['81:1', '0:0', 'x'].filter((a) => !sudokuActions(X_SUDOKU, s).includes(a)),
});
