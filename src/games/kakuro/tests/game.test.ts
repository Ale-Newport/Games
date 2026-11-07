import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { kakuroActions, logicMove, solverMove } from '../ai';
import { kakuroEnv } from '../ai-adapter';
import {
  DIFFICULTIES,
  badRuns,
  bit,
  combos,
  digitsOf,
  eraseCell,
  fillNotes,
  generateKakuro,
  isValidKakuroState,
  layout,
  logicSolves,
  newKakuro,
  placeDigit,
  redoMove,
  runAllowed,
  runIndex,
  runsOf,
  solveKakuro,
  stepsToPlacement,
  toggleNote,
  undoMove,
} from '../engine';

describe('Kakuro rules', () => {
  it('knows the digit combinations of each run', () => {
    expect(combos(2, 3).map(digitsOf)).toEqual([[1, 2]]);
    expect(combos(2, 17).map(digitsOf)).toEqual([[8, 9]]);
    expect(combos(3, 6).map(digitsOf)).toEqual([[1, 2, 3]]);
    expect(combos(9, 45)).toHaveLength(1);
    expect(combos(2, 19)).toEqual([]);
    const run = { cells: [0, 1], sum: 4 };
    expect(
      runAllowed(
        run,
        () => 0,
        () => (1 << 9) - 1,
      ),
    ).toBe(bit(1) | bit(3));
    expect(
      runAllowed(
        run,
        (c) => (c === 0 ? 2 : 0),
        () => (1 << 9) - 1,
      ),
    ).toBeNull();
  });

  it('builds symmetric layouts where every white cell sits in an across and a down run', () => {
    const rng = new Rng(3);
    let found = 0;
    for (let i = 0; i < 50 && found < 5; i++) {
      const white = layout(DIFFICULTIES.hard!, rng);
      if (!white) continue;
      found++;
      const runs = runsOf(9, 9, white);
      expect(runIndex(81, runs).every((r, c) => !white[c] || r.length === 2)).toBe(true);
      expect(runs.every((r) => r.cells.length >= 2 && r.cells.length <= 6)).toBe(true);
      expect(white.slice(0, 9).some(Boolean)).toBe(false);
    }
    expect(found).toBeGreaterThan(0);
  });

  it('generates puzzles with a unique solution the techniques can reach', () => {
    for (const [difficulty, seed] of [
      ['easy', 1],
      ['medium', 2],
      ['hard', 3],
    ] as const) {
      const p = generateKakuro(DIFFICULTIES[difficulty]!, seed);
      for (const run of p.runs) {
        const digits = run.cells.map((c) => p.solution[c]!);
        expect(new Set(digits).size).toBe(digits.length);
        expect(digits.reduce((a, b) => a + b, 0)).toBe(run.sum);
      }
      const r = solveKakuro(p, p.given, { limit: 2 });
      expect(r.count).toBe(1);
      expect(r.solutions[0]).toEqual(p.solution);
      expect(logicSolves(p)).toBe(true);
      expect(p.given.every((g, c) => !g || g === p.solution[c])).toBe(true);
    }
  });

  it('plays: digits, notes, undo/redo, mistakes, bad runs and saves', () => {
    let s = newKakuro('easy', 5);
    const p = s.puzzle;
    const cell = p.white.findIndex((w, c) => w && !p.given[c]);
    const right = p.solution[cell]!;
    s = toggleNote(s, cell, right);
    expect(s.notes[cell]).toBe(bit(right));
    s = placeDigit(s, cell, right);
    expect(s.values[cell]).toBe(right);
    s = undoMove(s);
    expect(s.values[cell]).toBe(0);
    s = redoMove(s);
    expect(s.values[cell]).toBe(right);
    s = eraseCell(s, cell);
    const wrong = (right % 9) + 1;
    s = placeDigit(s, cell, wrong);
    expect(s.mistakes).toBe(1);
    const mate = p.runs
      .find((r) => r.cells.includes(cell))!
      .cells.find((c) => c !== cell && !p.given[c])!;
    s = placeDigit(s, mate, wrong);
    expect(badRuns(s).size).toBeGreaterThan(0);
    s = fillNotes(eraseCell(eraseCell(s, cell), mate));
    expect(s.notes[cell]! & bit(right)).toBeTruthy();
    expect(isValidKakuroState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidKakuroState({ ...s, seed: s.seed + 1 })).toBe(false);
    expect(isValidKakuroState({ ...s, difficulty: 'nope' })).toBe(false);
    for (const c of p.white.flatMap((w, i) => (w ? [i] : [])))
      if (s.values[c] !== p.solution[c]) s = placeDigit(s, c, p.solution[c]!);
    expect(s.solved).toBe(true);
  });
});

describe('Kakuro solvers', () => {
  it('explains a placement and lets both solvers finish', () => {
    const s0 = newKakuro('medium', 6);
    const steps = stepsToPlacement(s0.puzzle, s0.values)!;
    const { cell, digit } = steps.at(-1)!.place!;
    expect(s0.puzzle.solution[cell]).toBe(digit);
    for (const move of [logicMove, solverMove]) {
      let s = s0;
      for (let i = 0; i < 100 && !s.solved; i++) s = kakuroEnv.applyAction(s, move(s));
      expect(s.solved).toBe(true);
    }
    expect(kakuroActions(s0).length).toBeGreaterThan(0);
  });
});

describeAdapterContract(kakuroEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 100,
  illegalActions: (s) => ['0:1', 'x', '999:2'].filter((a) => !kakuroActions(s).includes(a)),
});
