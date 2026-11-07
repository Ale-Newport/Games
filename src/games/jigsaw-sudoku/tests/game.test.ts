import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, solverMove, sudokuActions } from '../../shared/sudoku/ai';
import { geometry } from '../../shared/sudoku/grid';
import { regionsConnected } from '../../shared/sudoku/jigsaw';
import { geoFor } from '../../shared/sudoku/play';
import { gradePuzzle } from '../../shared/sudoku/logic';
import { hasUniqueSolution } from '../../shared/sudoku/solver';
import { jigsawEnv } from '../ai-adapter';
import { JIGSAW, isValidSudokuState, newSudoku } from '../engine';

describe('Jigsaw Sudoku puzzles', () => {
  it('generates fresh connected regions and every difficulty at its level', () => {
    const wanted = { easy: 1, medium: 1, hard: 2, expert: 3 } as const;
    for (const [difficulty, level] of Object.entries(wanted)) {
      for (const seed of [1, 2]) {
        const s = newSudoku(JIGSAW, difficulty, seed);
        const geo = geoFor(JIGSAW, s);
        expect(regionsConnected(9, s.regions!)).toBe(true);
        expect(
          geo.units.filter((_, i) => geo.unitKinds[i] === 'box').every((u) => u.length === 9),
        ).toBe(true);
        // Not just the standard boxes.
        expect(s.regions).not.toEqual(geometry(JIGSAW.shape).region);
        expect(hasUniqueSolution(geo, s.puzzle)).toBe(true);
        expect(gradePuzzle(geo, s.puzzle).level).toBe(level);
        expect(isValidSudokuState(JIGSAW, JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
    const s = newSudoku(JIGSAW, 'easy', 3);
    expect(newSudoku(JIGSAW, 'easy', 4).regions).not.toEqual(s.regions);
    const broken = [...s.regions!];
    [broken[0], broken[80]] = [broken[80]!, broken[0]!];
    expect(isValidSudokuState(JIGSAW, { ...s, regions: broken })).toBe(false);
  });

  it('lets the technique solver and the exact solver finish an Expert puzzle', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSudoku(JIGSAW, 'expert', 8);
      for (let i = 0; i < 81 && !s.solved; i++) s = jigsawEnv.applyAction(s, move(JIGSAW, s));
      expect(s.solved).toBe(true);
      expect(jigsawEnv.getOutcome(s)!.returns).toEqual([1]);
    }
  });

  it('ends stuck when an empty cell has no candidate left', () => {
    let s = newSudoku(JIGSAW, 'easy', 6);
    // Fill a row's empty cells with wrong-but-legal digits until something breaks.
    for (let i = 0; i < 81 && sudokuActions(JIGSAW, s).length; i++) {
      const legal = sudokuActions(JIGSAW, s);
      const wrong = legal.find((a) => {
        const [c, d] = a.split(':').map(Number) as [number, number];
        return s.solution[c] !== d;
      });
      s = jigsawEnv.applyAction(s, wrong ?? legal[0]!);
    }
    if (!s.solved) expect(jigsawEnv.getOutcome(s)!.reason).toBe('stuck');
  });
});

describeAdapterContract(jigsawEnv, {
  configs: [undefined, { difficulty: 'hard' }],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) => ['81:1', '0:0', 'x'].filter((a) => !sudokuActions(JIGSAW, s).includes(a)),
});
