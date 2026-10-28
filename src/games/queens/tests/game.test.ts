import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, markOf, queensActions, solverMove } from '../ai';
import { queensEnv } from '../ai-adapter';
import {
  CROSS,
  EMPTY,
  QUEEN,
  SPECS,
  attacked,
  clashes,
  countSolutions,
  generate,
  gradePuzzle,
  isValidQueensState,
  newQueens,
  nextStep,
  redoMove,
  setMarks,
  undoMove,
  units,
} from '../engine';

describe('Queens generator', () => {
  it('builds connected regions with one queen each and a unique solution', () => {
    for (const level of Object.keys(SPECS))
      for (const seed of [1, 2, 3]) {
        const p = generate(level, seed);
        const n = p.size;
        expect(n).toBe(SPECS[level]!.size);
        expect(countSolutions(p, 2)).toMatchObject({ count: 1, first: p.solution });
        const u = units(p);
        for (const cells of u.regions) {
          expect(cells.length).toBeGreaterThan(0);
          const seen = new Set([cells[0]!]);
          const stack = [cells[0]!];
          while (stack.length) {
            const c = stack.pop()!;
            for (const x of [c - n, c + n, c % n ? c - 1 : -1, (c + 1) % n ? c + 1 : -1])
              if (x >= 0 && x < n * n && cells.includes(x) && !seen.has(x)) {
                seen.add(x);
                stack.push(x);
              }
          }
          expect(seen.size).toBe(cells.length);
        }
        p.solution.forEach((k, r) => {
          if (r) expect(Math.abs(k - p.solution[r - 1]!)).toBeGreaterThan(1);
        });
      }
  });

  it('grades every level as solvable by techniques, needing the level technique', () => {
    expect(gradePuzzle(generate('easy', 5))).toMatchObject({ solved: true, hardest: 'confined' });
    expect(gradePuzzle(generate('medium', 5))).toMatchObject({ solved: true, hardest: 'group' });
    expect(gradePuzzle(generate('hard', 5))).toMatchObject({ solved: true, hardest: 'attack' });
    expect(generate('hard', 5)).toEqual(generate('hard', 5));
  });
});

describe('Queens play', () => {
  it('attacks rows, columns, regions and neighbours, and shows clashes', () => {
    const s = newQueens('easy', 7);
    const n = s.puzzle.size;
    const hit = new Set(attacked(s.puzzle, 0));
    expect(hit.has(1) && hit.has(n) && hit.has(n + 1)).toBe(true);
    const two = setMarks(setMarks(s, [{ cell: 0, mark: QUEEN }]), [{ cell: n + 1, mark: QUEEN }]);
    expect([...clashes(two)].sort()).toEqual([0, n + 1]);
  });

  it('counts mistakes, undoes and redoes, and solves from the techniques', () => {
    let s = newQueens('medium', 3);
    const p = s.puzzle;
    const off = p.solution[0] === 0 ? 1 : 0;
    s = setMarks(s, [{ cell: off, mark: QUEEN }]);
    expect(s.mistakes).toBe(1);
    s = undoMove(s);
    expect(s.marks[off]).toBe(EMPTY);
    expect(redoMove(s).marks[off]).toBe(QUEEN);
    for (let i = 0; i < 400 && !s.solved; i++) {
      const step = nextStep(p, s.marks);
      expect(step).not.toBeNull();
      const a = logicMove(s);
      s = setMarks(s, [{ cell: Number(a.split(':')[0]), mark: markOf(a) }]);
    }
    expect(s.solved).toBe(true);
    expect(s.mistakes).toBe(1);
  });

  it('validates saves by regenerating the puzzle', () => {
    const s = setMarks(newQueens('easy', 11), [{ cell: 3, mark: CROSS }]);
    expect(isValidQueensState(s)).toBe(true);
    expect(isValidQueensState({ ...s, level: 'nope' })).toBe(false);
    expect(isValidQueensState({ ...s, solved: true })).toBe(false);
    expect(isValidQueensState({ ...s, marks: s.marks.slice(1) })).toBe(false);
    const other = [...s.puzzle.regions];
    [other[0], other[other.length - 1]] = [other[other.length - 1]!, other[0]!];
    expect(isValidQueensState({ ...s, puzzle: { ...s.puzzle, regions: other } })).toBe(
      other.join() === s.puzzle.regions.join(),
    );
  });

  it('the exact solver places the solution', () => {
    let s = newQueens('hard', 2);
    while (!s.solved) {
      const a = solverMove(s);
      expect(queensActions(s)).toContain(a);
      s = setMarks(s, [{ cell: Number(a.split(':')[0]), mark: markOf(a) }]);
    }
    expect(s.mistakes).toBe(0);
  });
});

describeAdapterContract(queensEnv, {
  configs: [undefined, { level: 'medium' }],
  playouts: 6,
  maxSteps: 300,
  illegalActions: (s) => ['999:q', 'x', '0:z'].filter((a) => !queensActions(s).includes(a)),
});
