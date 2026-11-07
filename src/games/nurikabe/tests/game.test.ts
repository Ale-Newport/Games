import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, nuriActions, solverMove } from '../ai';
import { nurikabeEnv } from '../ai-adapter';
import {
  DIFFICULTIES,
  LAND,
  SEA,
  UNKNOWN,
  countSolutions,
  cycleMark,
  generateNurikabe,
  isValidNuriState,
  isValidShading,
  logicSolve,
  newNurikabe,
  nextStep,
  redoMove,
  ruleBreaks,
  setMarks,
  startMarks,
  undoMove,
} from '../engine';

describe('Nurikabe rules', () => {
  it('checks shadings: islands, one sea, no pools', () => {
    const p = { rows: 2, cols: 3, numbers: [1, 0, 0, 0, 0, 2] };
    // 1 . . / . . 2 with sea in the middle: island {0}, island {5,2}.
    expect(isValidShading(p, [false, true, false, true, true, false])).toBe(true);
    // A 2×2 pool.
    expect(isValidShading(p, [false, true, true, true, true, false])).toBe(false);
    // Two sea areas.
    expect(isValidShading({ rows: 1, cols: 3, numbers: [0, 1, 0] }, [true, false, true])).toBe(
      false,
    );
  });

  it('generates grids with one solution the techniques reach, for every size', () => {
    for (const spec of Object.values(DIFFICULTIES)) {
      const p = generateNurikabe(spec, 5);
      expect(isValidShading(p, p.solution)).toBe(true);
      const r = countSolutions(p, 2);
      expect(r.count).toBe(1);
      expect(r.first).toEqual(p.solution);
      const g = logicSolve(p);
      expect(g.solved).toBe(true);
      expect(g.marks.map((m) => m === SEA)).toEqual(p.solution);
    }
  }, 30_000);

  it('explains steps that agree with the solution', () => {
    const p = generateNurikabe(DIFFICULTIES.hard!, 3);
    const marks = startMarks(p);
    for (let i = 0; i < 300; i++) {
      const step = nextStep(p, marks);
      if (!step) break;
      for (const { cell, mark } of step.set) {
        expect(mark === SEA).toBe(p.solution[cell]);
        marks[cell] = mark;
      }
    }
    expect(marks.every((m) => m !== UNKNOWN)).toBe(true);
  });
});

describe('Nurikabe play', () => {
  it('marks, undoes, flags pools and saves', () => {
    let s = newNurikabe('easy', 4);
    const land = s.puzzle.solution.findIndex((sea, c) => !sea && !s.puzzle.numbers[c]);
    const numbered = s.puzzle.numbers.findIndex((n) => n > 0);
    expect(cycleMark(UNKNOWN)).toBe(SEA);
    expect(cycleMark(SEA)).toBe(LAND);
    expect(setMarks(s, [{ cell: numbered, mark: SEA }])).toBe(s);
    if (land >= 0) {
      s = setMarks(s, [{ cell: land, mark: SEA }]);
      expect(s.mistakes).toBe(1);
      s = undoMove(s);
      expect(s.marks[land]).toBe(UNKNOWN);
      s = redoMove(s);
      expect(s.marks[land]).toBe(SEA);
      s = undoMove(s);
    }
    expect(isValidNuriState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidNuriState({ ...s, seed: s.seed + 1 })).toBe(false);
    const all = s.puzzle.numbers.map((n, cell) => ({ cell, mark: n ? LAND : SEA }) as const);
    expect(ruleBreaks(setMarks(s, all)).pools.size).toBeGreaterThan(0);
    s = setMarks(
      s,
      s.puzzle.solution.flatMap((sea, cell) => (sea ? [{ cell, mark: SEA } as const] : [])),
    );
    expect(s.solved).toBe(true);
  });

  it('lets both solvers finish', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newNurikabe('medium', 6);
      for (let i = 0; i < 100 && !s.solved; i++) s = nurikabeEnv.applyAction(s, move(s));
      expect(s.solved).toBe(true);
    }
  });
});

describeAdapterContract(nurikabeEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 100,
  illegalActions: (s) => ['999:s', '0:q', 'x'].filter((a) => !nuriActions(s).includes(a)),
});
