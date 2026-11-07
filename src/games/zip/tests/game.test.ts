import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { greedyMove, solverMove, trailActions } from '../ai';
import { trailEnv } from '../ai-adapter';
import {
  SPECS,
  agreed,
  backTo,
  canExtend,
  countPaths,
  extend,
  forcedCell,
  generate,
  isValidTrailState,
  lastNumber,
  neighbours,
  newTrail,
  undoStep,
  wallKey,
} from '../engine';

describe('Number Trail generator', () => {
  it('builds puzzles whose only trail is the solution', () => {
    for (const level of Object.keys(SPECS))
      for (const seed of level === 'expert' ? [1] : [1, 2, 3]) {
        const p = generate(level, seed);
        const n = p.size;
        expect(p.solution).toHaveLength(n * n);
        expect(new Set(p.solution).size).toBe(n * n);
        p.solution.slice(1).forEach((c, i) => {
          expect(neighbours(n, p.solution[i]!)).toContain(c);
          expect(p.walls).not.toContain(wallKey(p.solution[i]!, c));
        });
        expect(p.numbers[p.solution[0]!]).toBe(1);
        expect(p.numbers[p.solution[n * n - 1]!]).toBe(lastNumber(p));
        const order = p.solution.map((c) => p.numbers[c]!).filter(Boolean);
        expect(order).toEqual(order.map((_, i) => i + 1));
        const res = countPaths(p, 2, 5_000_000);
        expect(res.count).toBe(1);
        expect(res.first).toEqual(p.solution);
      }
  });

  it('is deterministic per seed', () => {
    expect(generate('medium', 8)).toEqual(generate('medium', 8));
  });
});

describe('Number Trail play', () => {
  it('extends only to free neighbours in number order, and cuts back', () => {
    let s = newTrail('easy', 4);
    const p = s.puzzle;
    expect(s.path).toEqual([p.solution[0]]);
    const step = p.solution[1]!;
    expect(canExtend(s, step)).toBe(true);
    const far = p.solution.find(
      (c) => !neighbours(p.size, s.path[0]!).includes(c) && c !== s.path[0],
    )!;
    expect(extend(s, far)).toBe(s);
    const last = p.numbers.indexOf(lastNumber(p));
    expect(canExtend({ ...s, path: [p.solution[p.solution.length - 2]!] }, last)).toBe(false);
    for (const c of p.solution.slice(1, 6)) s = extend(s, c);
    expect(s.path).toHaveLength(6);
    expect(backTo(s, p.solution[2]!).path).toHaveLength(3);
    expect(undoStep(s).path).toHaveLength(5);
    expect(agreed(s)).toBe(6);
  });

  it('solves along the solution, with the forced cell always on it', () => {
    let s = newTrail('hard', 3);
    while (!s.solved) {
      const f = forcedCell(s);
      if (f !== null) expect(f).toBe(s.puzzle.solution[s.path.length]);
      const a = solverMove(s);
      expect(trailActions(s)).toContain(a);
      s = extend(s, Number(a.slice(2)));
    }
    expect(s.path).toEqual(s.puzzle.solution);
  });

  it('the greedy walker only makes legal moves', () => {
    let s = newTrail('medium', 5);
    while (trailActions(s).length) {
      const a = greedyMove(s);
      expect(trailActions(s)).toContain(a);
      s = extend(s, Number(a.slice(2)));
    }
    expect(s.path.length).toBeGreaterThan(5);
  });

  it('validates saves by regenerating and replaying the trail', () => {
    let s = newTrail('easy', 9);
    for (const c of s.puzzle.solution.slice(1, 5)) s = extend(s, c);
    expect(isValidTrailState(s)).toBe(true);
    expect(isValidTrailState({ ...s, path: [s.path[0], s.path[2]] })).toBe(false);
    expect(isValidTrailState({ ...s, solved: true })).toBe(false);
    expect(isValidTrailState({ ...s, level: 'nope' })).toBe(false);
    expect(isValidTrailState({ ...s, puzzle: { ...s.puzzle, walls: [] } })).toBe(
      s.puzzle.walls.length === 0,
    );
  });
});

describeAdapterContract(trailEnv, {
  configs: [undefined, { level: 'medium' }],
  playouts: 6,
  maxSteps: 80,
  illegalActions: (s) => ['m:999', 'x', 'm:-1'].filter((a) => !trailActions(s).includes(a)),
});
