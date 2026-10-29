import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { cornerMove, searchMove, triosActions } from '../ai';
import { triosEnv } from '../ai-adapter';
import { DECK, canMerge, canMove, draw, newGame, score, shift, tilePoints } from '../engine';
import { LEVELS, isValidTriosState, newTrios, play, triosScore, undo } from '../play';
import { seedRng } from '../../../core/game-engine/random';

describe('Number Trios rules', () => {
  it('merges 1 with 2, and equal tiles from 3 up', () => {
    expect(canMerge(1, 2)).toBe(true);
    expect(canMerge(2, 1)).toBe(true);
    expect(canMerge(1, 1)).toBe(false);
    expect(canMerge(2, 2)).toBe(false);
    expect(canMerge(3, 3)).toBe(true);
    expect(canMerge(6, 3)).toBe(false);
    expect(canMerge(48, 48)).toBe(true);
  });

  it('shifts one cell: the first tile that can move goes, the ones behind follow, one merge per line', () => {
    const board = [3, 6, 0, 1, 1, 2, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3];
    const r = shift(board, 4, 'left');
    expect(r.board).toEqual([3, 6, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 6, 3, 3, 0]);
    expect(r.moved).toEqual([0, 1, 3]);
    // Blocked lines do not move: 3 next to 6 next to 12 cannot go right.
    expect(shift([0, 3, 6, 12], 4, 'right').moved).toEqual([]);
    expect(shift([0, 3, 6, 12], 4, 'left').board).toEqual([3, 6, 12, 0]);
    expect(shift([1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4, 'up').board[0]).toBe(3);
  });

  it('scores 3 for a 3 and three times as much per doubling', () => {
    expect([1, 2, 3, 6, 12, 24, 48].map(tilePoints)).toEqual([0, 0, 3, 9, 27, 81, 243]);
    expect(score([3, 6, 0, 1])).toBe(12);
  });

  it('draws from a shuffled deck of four 1s, 2s and 3s', () => {
    let deck: number[] = [];
    let rng = seedRng(9);
    const seen: number[] = [];
    for (let i = 0; i < 12; i++) {
      let v: number;
      [v, deck, rng] = draw(deck, 3, rng);
      seen.push(v);
    }
    expect(seen.sort()).toEqual([...DECK].sort());
  });

  it('starts with nine tiles on 4×4 and a next tile; the next tile enters at the back of a moved line', () => {
    const g = newGame(LEVELS.classic!, 5);
    expect(g.board.filter(Boolean)).toHaveLength(9);
    expect([1, 2, 3]).toContain(g.next);
    const s = newTrios('classic', 5);
    const d = triosActions(s)[0]!;
    const after = play(s, d);
    const sh = shift(s.board, 4, d);
    const entered = after.board.flatMap((v, c) => (v !== sh.board[c] ? [c] : []));
    expect(entered).toHaveLength(1);
    expect(after.board[entered[0]!]).toBe(s.next);
    expect(canMove([1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2], 4)).toBe(true);
    expect(canMove([1, 3, 1, 3, 3, 1, 3, 1, 1, 3, 1, 3, 3, 1, 3, 1], 4)).toBe(false);
  });
});

describe('Number Trios play', () => {
  it('moves, undoes once and validates saves by replay', () => {
    let s = newTrios('classic', 11);
    const first = s;
    s = play(s, triosActions(s)[0]!);
    expect(s.history).toHaveLength(1);
    expect(isValidTriosState(s)).toBe(true);
    expect(isValidTriosState({ ...s, next: s.next === 1 ? 2 : 1 })).toBe(false);
    expect(isValidTriosState({ ...s, history: [...s.history, 'up'] })).toBe(false);
    s = undo(s);
    expect(s.board).toEqual(first.board);
    expect(s.undos).toBe(1);
    expect(undo(s)).toBe(s);
    expect(isValidTriosState(s)).toBe(true);
  });

  it('the search beats the corner keeper and reaches 96 on 4×4', () => {
    const run = (pick: (s: ReturnType<typeof newTrios>) => string) => {
      let s = newTrios('classic', 3);
      while (triosActions(s).length) s = play(s, pick(s) as never);
      return s;
    };
    const corner = run(cornerMove);
    const search = run((s) => searchMove(s));
    expect(search.best).toBeGreaterThanOrEqual(96);
    expect(triosScore(search)).toBeGreaterThan(triosScore(corner));
  });
});

describeAdapterContract(triosEnv, {
  configs: [undefined, { level: 'small' }],
  playouts: 3,
  maxSteps: 400,
  illegalActions: (s) =>
    ['north', 'x', ''].filter((a) => !(triosActions(s) as string[]).includes(a)),
});
