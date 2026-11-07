import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { cornerMove, mergeActions } from '../../shared/merge/ai';
import { fibonacciEnv } from '../ai-adapter';
import {
  FIBONACCI,
  LEVELS,
  bestMove,
  isValidMergeState,
  newGame,
  newMerge,
  play,
  rank,
  slide,
  undo,
} from '../engine';

const rules = LEVELS.classic!;
const row = (cells: number[]) => [...cells, ...new Array<number>(12).fill(0)];

describe('Fibonacci Merge rules', () => {
  it('merges Fibonacci neighbours (and two 1s) into the next number, never other equal pairs', () => {
    expect(rules.merge(1, 1)).toBe(2);
    expect(rules.merge(1, 2)).toBe(3);
    expect(rules.merge(3, 2)).toBe(5);
    expect(rules.merge(8, 13)).toBe(21);
    expect(rules.merge(2, 2)).toBeNull();
    expect(rules.merge(3, 8)).toBeNull();
    expect(FIBONACCI.slice(0, 8)).toEqual([1, 2, 3, 5, 8, 13, 21, 34]);
  });

  it('slides to the edge and merges each tile once per move', () => {
    expect(slide(row([1, 1, 2, 3]), rules, 'left').board.slice(0, 4)).toEqual([2, 5, 0, 0]);
    expect(slide(row([2, 2, 2, 0]), rules, 'left').moved).toBe(false);
    expect(slide(row([0, 5, 3, 2]), rules, 'right').board.slice(0, 4)).toEqual([0, 0, 5, 5]);
    expect(slide(row([0, 5, 3, 2]), rules, 'right').gained).toBe(5);
  });

  it('spawns 1s and 2s from the seeded generator and ranks tiles by their place in the sequence', () => {
    const g = newGame(rules, 11);
    expect(g.board.filter(Boolean)).toHaveLength(2);
    expect(g.board.every((v) => v === 0 || v === 1 || v === 2)).toBe(true);
    expect([1, 2, 3, 5, 2584].map(rank)).toEqual([0, 1, 2, 3, 16]);
  });
});

describe('Fibonacci Merge play', () => {
  it('moves, undoes once and validates saves by replay', () => {
    let s = newMerge(LEVELS, 'classic', 5);
    const first = s;
    s = play(s, LEVELS, mergeActions(s, rules)[0] as never);
    expect(isValidMergeState(s, LEVELS)).toBe(true);
    expect(isValidMergeState({ ...s, history: ['up', 'up', 'up'] }, LEVELS)).toBe(false);
    s = undo(s);
    expect(s.board).toEqual(first.board);
    expect(isValidMergeState(s, LEVELS)).toBe(true);
  });

  it('the expectimax search beats the corner keeper on the 3×3 board', () => {
    const mini = LEVELS.mini!;
    const run = (pick: (s: ReturnType<typeof newMerge>) => string) => {
      let s = newMerge(LEVELS, 'mini', 3);
      while (mergeActions(s, mini).length) s = play(s, LEVELS, pick(s) as never);
      return s;
    };
    const corner = run((s) => cornerMove(s, mini));
    const search = run((s) => bestMove(s.board, mini, 2)!);
    expect(search.score).toBeGreaterThan(corner.score);
  });
});

describeAdapterContract(fibonacciEnv, {
  configs: [undefined, { level: 'mini' }],
  playouts: 3,
  maxSteps: 5000,
  illegalActions: (s) =>
    ['north', 'x', ''].filter((a) => !mergeActions(s, LEVELS[s.level]!).includes(a)),
});
