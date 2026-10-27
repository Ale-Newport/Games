import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { geometry } from '../../shared/sudoku/grid';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { hasUniqueSolution } from '../../shared/sudoku/solver';
import { sudoku4Env } from '../ai-adapter';
import { SUDOKU_4, newSudoku } from '../engine';

const geo = geometry(SUDOKU_4.shape);

describe('Mini Sudoku puzzles', () => {
  it('generates every difficulty with a unique solution at its technique level', () => {
    const wanted = { easy: 1, medium: 1, hard: 1 } as const;
    for (const [difficulty, level] of Object.entries(wanted)) {
      for (const seed of [1, 2, 3]) {
        const s = newSudoku(SUDOKU_4, difficulty, seed);
        const clues = s.puzzle.filter((x) => x).length;
        const spec = SUDOKU_4.difficulties[difficulty]!;
        expect(hasUniqueSolution(geo, s.puzzle)).toBe(true);
        expect(gradePuzzle(geo, s.puzzle).level).toBe(level);
        expect(clues).toBeGreaterThanOrEqual(spec.minClues);
        expect(clues).toBeLessThanOrEqual(spec.maxClues);
      }
    }
    // Easy keeps more clues than Medium, Medium more than Hard.
    const clues = (d: string) => newSudoku(SUDOKU_4, d, 4).puzzle.filter((x) => x).length;
    expect(clues('easy')).toBeGreaterThan(clues('medium'));
    expect(clues('medium')).toBeGreaterThan(clues('hard'));
  });

  it('lets the technique solver and the exact solver finish a Hard puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(SUDOKU_4, 'hard', 8);
      for (let i = 0; i < 16 && !s.solved; i++) s = sudoku4Env.applyAction(s, move(SUDOKU_4, s));
      expect(s.solved).toBe(true);
      expect(sudoku4Env.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(SUDOKU_4, 'hard', 6);
    // Place wrong-but-legal digits until something breaks.
    for (let i = 0; i < 16 && sudokuActions(SUDOKU_4, s).length; i++) {
      const legal = sudokuActions(SUDOKU_4, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = sudoku4Env.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(sudoku4Env.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(sudoku4Env, {
  configs: [undefined, { difficulty: 'hard' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) =>
    ['16:1', '0:5', 'x'].filter((a) => !sudokuActions(SUDOKU_4, s).includes(a)),
});
