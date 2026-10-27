import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, nonoActions, solverMove } from '../ai';
import { nonogramEnv } from '../ai-adapter';
import {
  DIFFICULTIES,
  EMPTY,
  FILLED,
  UNKNOWN,
  generateNonogram,
  isValidNonoState,
  lineDone,
  lineSolvable,
  lineSolve,
  makePuzzle,
  newNonogram,
  puzzleFor,
  redoMove,
  runsOf,
  setCells,
  setValues,
  solveExact,
  solveLine,
  undoMove,
} from '../engine';
import { PICTURES } from '../pictures';

describe('Nonogram line logic', () => {
  it('computes runs and solves single lines by overlap', () => {
    expect(runsOf([true, true, false, true, false])).toEqual([2, 1]);
    expect(runsOf([false, false])).toEqual([]);
    // A 7 in a line of 10 fixes the middle 4.
    const line = solveLine([7], Array(10).fill(UNKNOWN))!;
    expect(line.map((c) => (c === FILLED ? '#' : c === EMPTY ? 'x' : '.')).join('')).toBe(
      '...####...',
    );
    // 0 empties the line; a full clue fills it.
    expect(solveLine([], Array(3).fill(UNKNOWN))).toEqual([EMPTY, EMPTY, EMPTY]);
    expect(solveLine([2, 1], Array(4).fill(UNKNOWN))).toEqual([FILLED, FILLED, EMPTY, FILLED]);
    expect(solveLine([3], [EMPTY, EMPTY, UNKNOWN])).toBeNull();
    expect(lineDone([2, 1], [FILLED, FILLED, EMPTY, FILLED])).toBe(true);
  });

  it('has original pictures that the line solver finishes', () => {
    expect(PICTURES.length).toBeGreaterThanOrEqual(10);
    for (const pic of PICTURES) {
      expect(pic.art.every((r) => r.length === pic.art[0]!.length)).toBe(true);
      const p = puzzleFor(`picture:${pic.id}`, 1);
      expect(lineSolvable(p)).toBe(true);
      expect(solveExact(p).count).toBe(1);
    }
  });

  it('generates random puzzles that are line-solvable and unique, for every size', () => {
    for (const spec of Object.values(DIFFICULTIES)) {
      const p = generateNonogram(spec, 9);
      expect(p.rows).toBe(spec.rows);
      expect(lineSolvable(p)).toBe(true);
      expect(solveExact(p).first).toEqual(p.solution);
      expect(lineSolve(p).steps).toBeGreaterThan(0);
    }
    // A puzzle with two solutions is caught by the exact solver.
    const twin = makePuzzle(2, 2, [true, false, false, true]);
    expect(lineSolvable(twin)).toBe(false);
    expect(solveExact(twin).count).toBe(2);
  });
});

describe('Nonogram play', () => {
  it('fills, crosses, undoes, counts mistakes and validates saves', () => {
    let s = newNonogram('easy', 4);
    const on = s.puzzle.solution.indexOf(true);
    const off = s.puzzle.solution.indexOf(false);
    s = setCells(s, [on], FILLED);
    s = setCells(s, [off], FILLED);
    expect(s.mistakes).toBe(1);
    s = undoMove(s);
    expect(s.grid[off]).toBe(UNKNOWN);
    s = redoMove(s);
    expect(s.grid[off]).toBe(FILLED);
    s = setValues(s, [
      { cell: off, value: EMPTY },
      { cell: on, value: FILLED },
    ]);
    expect(isValidNonoState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidNonoState({ ...s, seed: s.seed + 1 })).toBe(false);
    expect(isValidNonoState({ ...s, kind: 'picture:nope' })).toBe(false);
    s = setCells(
      s,
      s.puzzle.solution.flatMap((f, i) => (f ? [i] : [])),
      FILLED,
    );
    s = setCells(
      s,
      s.puzzle.solution.flatMap((f, i) => (f ? [] : [i])),
      EMPTY,
    );
    expect(s.solved).toBe(true);
  });

  it('lets both solvers finish', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newNonogram('medium', 6);
      for (let i = 0; i < 200 && !s.solved; i++) s = nonogramEnv.applyAction(s, move(s));
      expect(s.solved).toBe(true);
    }
  });
});

describeAdapterContract(nonogramEnv, {
  configs: [undefined, { difficulty: 'medium' }],
  playouts: 6,
  maxSteps: 300,
  illegalActions: (s) => ['999:f', '0:q', 'x'].filter((a) => !nonoActions(s).includes(a)),
});
