import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { greedyMove, slideActions, solverMove } from '../../shared/sliding/ai';
import { eightEnv } from '../ai-adapter';
import {
  SPECS,
  heuristic,
  isSolvable,
  isSolvedBoard,
  isValidSlideState,
  lineTo,
  manhattan,
  movable,
  newSlide,
  push,
  scramble,
  slide,
  solveOptimal,
  undo,
} from '../engine';

describe('Sliding core', () => {
  it('knows solvable boards by inversions (and gap row on even sizes)', () => {
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe(true);
    expect(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 0])).toBe(false);
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0])).toBe(false);
    for (let s = 1; s <= 20; s++) expect(isSolvable(scramble(3, s))).toBe(true);
    for (let s = 1; s <= 20; s++) expect(isSolvable(scramble(4, s))).toBe(true);
  });

  it('slides single tiles and whole lines toward the gap', () => {
    const b = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    expect(movable(b).sort()).toEqual([6, 8]);
    expect(slide(b, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 0, 8]);
    expect(slide(b, 1)).toEqual(b);
    expect(lineTo(b, 7)).toEqual([8, 7]);
    expect(lineTo(b, 3)).toEqual([6, 3]);
    expect(lineTo(b, 5)).toEqual([]);
  });

  it('has an admissible heuristic: never above the optimal length', () => {
    for (let s = 1; s <= 40; s++) {
      const b = scramble(3, s);
      const r = solveOptimal(b);
      expect(heuristic(b)).toBeLessThanOrEqual(r.moves!.length);
      expect(heuristic(b)).toBeGreaterThanOrEqual(manhattan(b));
      let x = b;
      for (const t of r.moves!) x = slide(x, t);
      expect(isSolvedBoard(x)).toBe(true);
    }
  });

  it('finds the known hardest 8-puzzle distance (31 moves)', () => {
    expect(solveOptimal([8, 6, 7, 2, 5, 4, 3, 0, 1]).moves).toHaveLength(31);
  });
});

describe('8-Puzzle play', () => {
  it('counts moves, undoes, and solves along the optimal plan', () => {
    let s = newSlide(SPECS, 'medium', 3);
    expect(s.optimal).not.toBeNull();
    const t = movable(s.board)[0]!;
    s = push(s, t);
    expect(s.moves).toBe(1);
    s = undo(s);
    expect(s.moves).toBe(2);
    expect(s.board).toEqual(s.start);
    let k = 0;
    while (!s.solved) {
      s = push(s, Number(solverMove(s).slice(2)));
      k++;
    }
    expect(k).toBe(s.optimal);
  });

  it('greedy moves are legal and validation replays the history', () => {
    let s = newSlide(SPECS, 'easy', 5);
    const rng = new Rng(1);
    for (let i = 0; i < 10 && !s.solved; i++) {
      const a = greedyMove(s, rng);
      expect(slideActions(s)).toContain(a);
      s = push(s, Number(a.slice(2)));
    }
    expect(isValidSlideState(s, SPECS)).toBe(true);
    expect(isValidSlideState({ ...s, board: [...s.board].reverse() }, SPECS)).toBe(false);
    expect(isValidSlideState({ ...s, start: s.board }, SPECS)).toBe(
      s.board.join() === s.start.join(),
    );
    expect(isValidSlideState({ ...s, moves: -1 }, SPECS)).toBe(false);
    expect(isValidSlideState({ ...s, level: 'x' }, SPECS)).toBe(false);
  });
});

describeAdapterContract(eightEnv, {
  configs: [undefined, { level: 'hard' }],
  playouts: 4,
  maxSteps: 250,
  illegalActions: (s) => ['t:0', 't:9', 'x'].filter((a) => !slideActions(s).includes(a)),
});
