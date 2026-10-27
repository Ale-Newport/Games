import { describe, expect, it } from 'vitest';
import { generatePuzzle } from '../generator';
import { bit, candidates, conflicts, geometry, isComplete } from '../grid';
import { applyStep, gradePuzzle, logicState, nextStep, stepsToPlacement } from '../logic';
import {
  eraseCell,
  fillNotes,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  redoMove,
  toggleNote,
  undoMove,
  wrongCells,
  type SudokuVariant,
} from '../play';
import { hasUniqueSolution, randomSolution, solveSudoku } from '../solver';
import { Rng } from '../../../../core/game-engine/random';

const geo9 = geometry({ size: 9, boxRows: 3, boxCols: 3 });
const parse = (text: string) =>
  [...text.replace(/\s/g, '')].map((ch) => (ch === '.' ? 0 : Number(ch)));

// A well-known puzzle that singles alone solve.
const EASY = parse(`
  53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79`);

const VARIANT: SudokuVariant = {
  id: 'test-9',
  shape: { size: 9, boxRows: 3, boxCols: 3 },
  difficulties: {
    easy: { minLevel: 1, maxLevel: 1, minClues: 36, maxClues: 40, symmetric: true },
  },
};

describe('sudoku geometry', () => {
  it('builds rows, columns and boxes with 20 peers per cell', () => {
    expect(geo9.units).toHaveLength(27);
    expect(geo9.peers.every((p) => p.length === 20)).toBe(true);
    expect(geo9.region[0]).toBe(0);
    expect(geo9.region[80]).toBe(8);
    const six = geometry({ size: 6, boxRows: 2, boxCols: 3 });
    expect(
      six.units.filter((_, i) => six.unitKinds[i] === 'box').every((u) => u.length === 6),
    ).toBe(true);
    const x = geometry({ size: 9, boxRows: 3, boxCols: 3, diagonals: true });
    expect(x.units).toHaveLength(29);
    expect(x.peers[40]!.length).toBeGreaterThan(20);
  });

  it('finds candidates and conflicts', () => {
    const c = candidates(geo9, EASY);
    expect(c[0]).toBe(0);
    expect(c[2]! & bit(5)).toBe(0);
    const bad = [...EASY];
    bad[2] = 5;
    expect([...conflicts(geo9, bad)].sort((a, b) => a - b)).toEqual([0, 2]);
  });
});

describe('sudoku solver and generator', () => {
  it('solves a puzzle, proves uniqueness and detects multiple solutions', () => {
    const r = solveSudoku(geo9, EASY);
    expect(r.count).toBe(1);
    expect(isComplete(geo9, r.solution!)).toBe(true);
    expect(r.solution!.slice(0, 9)).toEqual([5, 3, 4, 6, 7, 8, 9, 1, 2]);
    const open = [...EASY];
    open.fill(0, 0, 30);
    expect(hasUniqueSolution(geo9, open)).toBe(false);
    const broken = [...EASY];
    broken[2] = 5;
    expect(solveSudoku(geo9, broken).count).toBe(0);
  });

  it('fills random grids and generates graded puzzles with a unique solution', () => {
    const full = randomSolution(geo9, new Rng(3));
    expect(isComplete(geo9, full)).toBe(true);
    for (const [min, max] of [
      [1, 1],
      [2, 2],
      [3, 3],
    ] as const) {
      const p = generatePuzzle(geo9, 11, {
        minLevel: min,
        maxLevel: max,
        minClues: 20,
        maxClues: 40,
        symmetric: true,
        attempts: 150,
      });
      expect(hasUniqueSolution(geo9, p.puzzle)).toBe(true);
      expect(p.level).toBe(min);
      expect(gradePuzzle(geo9, p.puzzle).level).toBe(min);
      expect(p.puzzle.every((x, c) => !x || x === p.solution[c])).toBe(true);
      // Symmetric through the centre.
      expect(p.puzzle.every((x, c) => !!x === !!p.puzzle[80 - c])).toBe(true);
    }
    expect(generatePuzzle(geo9, 5, VARIANT.difficulties.easy!)).toEqual(
      generatePuzzle(geo9, 5, VARIANT.difficulties.easy!),
    );
  });
});

describe('sudoku techniques', () => {
  it('solves with singles and explains the next placement', () => {
    const g = gradePuzzle(geo9, EASY);
    expect(g.solved).toBe(true);
    expect(g.level).toBe(1);
    const steps = stepsToPlacement(geo9, EASY)!;
    expect(steps.at(-1)!.place).toBeDefined();
    const { cell, digit } = steps.at(-1)!.place!;
    expect(solveSudoku(geo9, EASY).solution![cell]).toBe(digit);
  });

  it('finds locked candidates, pairs and fish that only remove what is impossible', () => {
    const p = generatePuzzle(geo9, 21, {
      minLevel: 3,
      maxLevel: 3,
      minClues: 20,
      maxClues: 40,
      symmetric: true,
      attempts: 150,
    });
    const st = logicState(geo9, p.puzzle);
    const seen = new Set<string>();
    for (let i = 0; i < 500 && st.values.some((v) => !v); i++) {
      const step = nextStep(geo9, st)!;
      seen.add(step.technique);
      for (const { cell, digit } of step.remove) expect(p.solution[cell]).not.toBe(digit);
      if (step.place) expect(p.solution[step.place.cell]).toBe(step.place.digit);
      applyStep(geo9, st, step);
    }
    expect(st.values).toEqual(p.solution);
    expect(
      [...seen].some((x) =>
        ['x-wing', 'y-wing', 'swordfish', 'naked-triple', 'hidden-triple'].includes(x),
      ),
    ).toBe(true);
  });
});

describe('sudoku play', () => {
  it('places digits, cleans notes, counts mistakes and solves', () => {
    let s = newSudoku(VARIANT, 'easy', 9);
    const empty = s.values.findIndex((x) => !x);
    const peer = geo9.peers[empty]!.find((c) => !s.values[c])!;
    const right = s.solution[empty]!;
    s = toggleNote(s, peer, right);
    expect(s.notes[peer]).toBe(bit(right));
    s = placeDigit(VARIANT, s, empty, right);
    expect(s.notes[peer]).toBe(0);
    expect(s.mistakes).toBe(0);
    s = undoMove(s);
    expect(s.values[empty]).toBe(0);
    expect(s.notes[peer]).toBe(bit(right));
    s = redoMove(s);
    expect(s.values[empty]).toBe(right);
    const wrong = (right % 9) + 1;
    s = placeDigit(VARIANT, s, empty, wrong);
    expect(s.mistakes).toBe(1);
    expect(wrongCells(s)).toEqual([empty]);
    s = eraseCell(s, empty);
    expect(s.values[empty]).toBe(0);
    const given = s.puzzle.findIndex((x) => x);
    expect(placeDigit(VARIANT, s, given, 1)).toBe(s);
    s = fillNotes(VARIANT, s);
    expect(s.notes[empty]! & bit(right)).toBeTruthy();
    for (let c = 0; c < 81; c++) if (!s.values[c]) s = placeDigit(VARIANT, s, c, s.solution[c]!);
    expect(s.solved).toBe(true);
    expect(isValidSudokuState(VARIANT, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(placeDigit(VARIANT, s, empty, 1)).toBe(s);
  });

  it('rejects broken saves', () => {
    const s = newSudoku(VARIANT, 'easy', 4);
    expect(isValidSudokuState(VARIANT, s)).toBe(true);
    expect(isValidSudokuState(VARIANT, { ...s, difficulty: 'nope' })).toBe(false);
    expect(isValidSudokuState(VARIANT, { ...s, values: s.values.slice(1) })).toBe(false);
    const swapped = [...s.solution];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    expect(isValidSudokuState(VARIANT, { ...s, solution: swapped })).toBe(false);
    const changed = [...s.values];
    const given = s.puzzle.findIndex((x) => x);
    changed[given] = (changed[given]! % 9) + 1;
    expect(isValidSudokuState(VARIANT, { ...s, values: changed })).toBe(false);
    expect(isValidSudokuState(VARIANT, { ...s, solved: true })).toBe(false);
  });
});
