import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { hitoriActions, logicMove, solverMove } from '../ai';
import { hitoriEnv } from '../ai-adapter';
import {
  BLACK,
  DIFFICULTIES,
  WHITE,
  countSolutions,
  cycleMark,
  generateHitori,
  isValidHitoriState,
  logicSolve,
  newHitori,
  nextStep,
  redoMove,
  ruleBreaks,
  setMarks,
  twins,
  undoMove,
  whiteConnected,
} from '../engine';

describe('Hitori rules', () => {
  it('finds twins and checks connectivity', () => {
    const p = { size: 3, numbers: [1, 2, 1, 3, 1, 2, 2, 3, 1] };
    expect(twins(p)[0]).toEqual([2]);
    expect(twins(p)[2]).toEqual([0, 8]);
    expect(twins(p)[4]).toEqual([]);
    expect(whiteConnected(3, [0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(true);
    expect(whiteConnected(3, [0, BLACK, 0, BLACK, 0, 0, 0, 0, 0])).toBe(false);
  });

  it('generates puzzles with one solution the techniques reach, for every size', () => {
    for (const [d, spec] of Object.entries(DIFFICULTIES)) {
      const p = generateHitori(spec, 7);
      expect(p.size).toBe(spec.size);
      const tw = twins(p);
      // The solution obeys the three rules and only shades repeated numbers.
      p.solution.forEach((b, c) => {
        if (b) expect(tw[c]!.length).toBeGreaterThan(0);
        else expect(tw[c]!.some((x) => !p.solution[x])).toBe(false);
      });
      const marks = p.solution.map((b) => (b ? BLACK : WHITE));
      expect(whiteConnected(p.size, marks)).toBe(true);
      const r = countSolutions(p, 2);
      expect(r.count).toBe(1);
      expect(r.first).toEqual(p.solution);
      const g = logicSolve(p);
      expect(g.level).toBeLessThanOrEqual(spec.maxLevel);
      expect(g.marks.map((m) => m === BLACK)).toEqual(p.solution);
      expect(d in DIFFICULTIES).toBe(true);
    }
  });

  it('explains steps that agree with the solution', () => {
    const p = generateHitori(DIFFICULTIES.hard!, 3);
    const marks = p.numbers.map(() => 0 as 0 | 1 | 2);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const step = nextStep(p, marks);
      if (!step) break;
      seen.add(step.technique);
      for (const { cell, mark } of step.set) {
        expect(mark === BLACK).toBe(p.solution[cell]);
        marks[cell] = mark;
      }
    }
    expect(seen.has('next-to-black')).toBe(true);
    expect(marks.filter((m) => m === BLACK)).toHaveLength(p.solution.filter(Boolean).length);
  });

  it('plays: marks, undo/redo, mistakes, rule breaks, solving and saves', () => {
    let s = newHitori('easy', 5);
    const black = s.puzzle.solution.findIndex(Boolean);
    expect(cycleMark(0)).toBe(BLACK);
    expect(cycleMark(BLACK)).toBe(WHITE);
    expect(cycleMark(WHITE)).toBe(0);
    s = setMarks(s, [{ cell: black, mark: WHITE }]);
    expect(s.mistakes).toBe(1);
    s = undoMove(s);
    expect(s.marks[black]).toBe(0);
    s = redoMove(s);
    expect(s.marks[black]).toBe(WHITE);
    const twin = twins(s.puzzle)[black]!.find((x) => !s.puzzle.solution[x])!;
    s = setMarks(s, [{ cell: twin, mark: WHITE }]);
    expect(ruleBreaks(s).repeats.size).toBeGreaterThan(0);
    expect(isValidHitoriState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidHitoriState({ ...s, seed: s.seed + 1 })).toBe(false);
    s = setMarks(
      s,
      s.puzzle.solution.map((b, c) => ({ cell: c, mark: b ? BLACK : 0 })),
    );
    expect(s.solved).toBe(true);
    expect(ruleBreaks(s).split).toBe(false);
  });

  it('lets both solvers finish', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newHitori('medium', 6);
      for (let i = 0; i < 100 && !s.solved; i++) s = hitoriEnv.applyAction(s, move(s));
      expect(s.solved).toBe(true);
      expect(hitoriEnv.getOutcome(s)!.returns).toEqual([1]);
    }
  });
});

describeAdapterContract(hitoriEnv, {
  configs: [undefined, { difficulty: 'hard' }],
  playouts: 10,
  maxSteps: 200,
  illegalActions: (s) => ['999:b', '0:x', 'x'].filter((a) => !hitoriActions(s).includes(a)),
});
