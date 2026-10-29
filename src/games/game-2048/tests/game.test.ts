import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { cornerMove, mergeActions } from '../../shared/merge/ai';
import { merge2048Env } from '../ai-adapter';
import {
  LEVELS,
  bestMove,
  canMove,
  isValidMergeState,
  move,
  newGame,
  newMerge,
  play,
  rank,
  slide,
  undo,
} from '../engine';

const rules = LEVELS.classic!;

describe('Merge to 2048 rules', () => {
  it('slides tiles to the edge and merges each pair once per move', () => {
    const row = (cells: number[]) => [...cells, ...new Array<number>(12).fill(0)];
    expect(slide(row([2, 2, 2, 2]), rules, 'left').board.slice(0, 4)).toEqual([4, 4, 0, 0]);
    expect(slide(row([2, 2, 4, 0]), rules, 'left').board.slice(0, 4)).toEqual([4, 4, 0, 0]);
    expect(slide(row([0, 4, 4, 8]), rules, 'right').board.slice(0, 4)).toEqual([0, 0, 8, 8]);
    expect(slide(row([2, 0, 0, 2]), rules, 'left').gained).toBe(4);
    expect(slide(row([2, 4, 8, 16]), rules, 'left').moved).toBe(false);
    const col = [2, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0];
    expect(slide(col, rules, 'up').board.filter((_, c) => c % 4 === 0)).toEqual([4, 8, 0, 0]);
  });

  it('starts with two tiles and adds one after each move, from the seeded generator', () => {
    const g = newGame(rules, 42);
    expect(g.board.filter(Boolean)).toHaveLength(2);
    expect(newGame(rules, 42)).toEqual(g);
    const d = (['left', 'right', 'up', 'down'] as const).find(
      (x) => slide(g.board, rules, x).moved,
    )!;
    const next = move(g, rules, d);
    expect(next.board.filter(Boolean).length).toBe(
      slide(g.board, rules, d).board.filter(Boolean).length + 1,
    );
    expect(next.board.every((v) => v === 0 || [2, 4].includes(v) || v >= 4)).toBe(true);
  });

  it('ends when no slide changes the board, and ranks tiles by their power of two', () => {
    const stuck = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    expect(canMove(stuck, rules)).toBe(false);
    expect(canMove([...stuck.slice(0, 15), 0], rules)).toBe(true);
    expect([2, 4, 8, 2048].map(rank)).toEqual([0, 1, 2, 10]);
  });
});

describe('Merge to 2048 play', () => {
  it('moves, undoes once and validates saves by replay', () => {
    let s = newMerge(LEVELS, 'classic', 7);
    const first = s;
    s = play(s, LEVELS, mergeActions(s, rules)[0] as never);
    expect(isValidMergeState(s, LEVELS)).toBe(true);
    expect(isValidMergeState({ ...s, score: s.score + 4 }, LEVELS)).toBe(false);
    s = undo(s);
    expect(s.board).toEqual(first.board);
    expect(s.undos).toBe(1);
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
    expect(search.best).toBeGreaterThanOrEqual(128);
    expect(search.score).toBeGreaterThan(corner.score);
  });
});

describeAdapterContract(merge2048Env, {
  configs: [undefined, { level: 'mini' }],
  playouts: 3,
  maxSteps: 400,
  illegalActions: (s) =>
    ['north', 'x', ''].filter((a) => !mergeActions(s, LEVELS[s.level]!).includes(a)),
});
