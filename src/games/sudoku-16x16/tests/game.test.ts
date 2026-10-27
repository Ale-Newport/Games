import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { geometry } from '../../shared/sudoku/grid';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { hasUniqueSolution } from '../../shared/sudoku/solver';
import { sudoku16Env } from '../ai-adapter';
import { SUDOKU_16, newSudoku } from '../engine';

const geo = geometry(SUDOKU_16.shape);

describe('Sudoku 16×16 puzzles', () => {
  it('generates every difficulty with a unique solution at its technique level', () => {
    const wanted = { easy: [1], medium: [1], hard: [2, 3] } as const;
    for (const [difficulty, levels] of Object.entries(wanted)) {
      for (const seed of [1, 2]) {
        const s = newSudoku(SUDOKU_16, difficulty, seed);
        const clues = s.puzzle.filter((x) => x).length;
        const spec = SUDOKU_16.difficulties[difficulty]!;
        expect(hasUniqueSolution(geo, s.puzzle)).toBe(true);
        expect(levels).toContain(gradePuzzle(geo, s.puzzle).level);
        expect(clues).toBeGreaterThanOrEqual(spec.minClues);
        expect(clues).toBeLessThanOrEqual(spec.maxClues);
      }
    }
    // Easy keeps more clues than Medium.
    const clues = (d: string) => newSudoku(SUDOKU_16, d, 4).puzzle.filter((x) => x).length;
    expect(clues('easy')).toBeGreaterThan(clues('medium'));
  });

  it('lets the technique solver and the exact solver finish a Hard puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(SUDOKU_16, 'hard', 8);
      for (let i = 0; i < 256 && !s.solved; i++) s = sudoku16Env.applyAction(s, move(SUDOKU_16, s));
      expect(s.solved).toBe(true);
      expect(sudoku16Env.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(SUDOKU_16, 'hard', 6);
    // Place wrong-but-legal digits until something breaks.
    for (let i = 0; i < 256 && sudokuActions(SUDOKU_16, s).length; i++) {
      const legal = sudokuActions(SUDOKU_16, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = sudoku16Env.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(sudoku16Env.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(sudoku16Env, {
  configs: [undefined],
  playouts: 4,
  maxSteps: 100,
  illegalActions: (s) =>
    ['256:1', '0:17', 'x'].filter((a) => !sudokuActions(SUDOKU_16, s).includes(a)),
});
