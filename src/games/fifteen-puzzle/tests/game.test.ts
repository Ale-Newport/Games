import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { slideActions, solverMove } from '../../shared/sliding/ai';
import { fifteenEnv } from '../ai-adapter';
import {
  SPECS,
  heuristic,
  isSolvable,
  isSolvedBoard,
  isValidSlideState,
  newSlide,
  push,
  scramble,
  slide,
  solve,
  solveWeighted,
} from '../engine';

describe('15-Puzzle', () => {
  it('scrambles solvable 4×4 boards and knows the unsolvable swap', () => {
    for (let s = 1; s <= 30; s++) expect(isSolvable(scramble(4, s))).toBe(true);
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0])).toBe(false);
  });

  it(
    'solves random boards with weighted A* within its factor of the heuristic',
    { timeout: 30_000 },
    () => {
      for (let s = 1; s <= 3; s++) {
        const b = scramble(4, s);
        const r = solveWeighted(b, 1.4);
        expect(r.moves).not.toBeNull();
        expect(r.moves!.length).toBeGreaterThanOrEqual(heuristic(b));
        let x = b;
        for (const t of r.moves!) x = slide(x, t);
        expect(isSolvedBoard(x)).toBe(true);
      }
    },
  );

  it('knows the optimal length for easy scrambles and follows the solver to the end', () => {
    let s = newSlide(SPECS, 'easy', 7);
    expect(s.optimal).not.toBeNull();
    let k = 0;
    while (!s.solved) {
      s = push(s, Number(solverMove(s).slice(2)));
      k++;
    }
    expect(k).toBe(s.optimal);
    const r = solve(scramble(4, 9));
    expect(r.moves.length).toBeGreaterThan(30);
  });

  it('validates saves', () => {
    const s = push(newSlide(SPECS, 'medium', 2), newSlide(SPECS, 'medium', 2).board[11] || 1);
    expect(isValidSlideState(s, SPECS)).toBe(true);
    expect(isValidSlideState({ ...s, size: 3 }, SPECS)).toBe(false);
  });
});

describeAdapterContract(fifteenEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 700,
  illegalActions: (s) => ['t:0', 't:16', 'x'].filter((a) => !slideActions(s).includes(a)),
});
