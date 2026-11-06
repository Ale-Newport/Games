import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  createGravityState,
  dropDisc,
  gravityFromHistory,
  isValidGravityState,
  lastDropIndex,
  legalColumns,
  undoDrops,
  type GravityRules,
} from '../engine';

const C4: GravityRules = { rows: 6, cols: 7, k: 4 };
const C5: GravityRules = { rows: 7, cols: 9, k: 5 };

describe('gravity engine', () => {
  it('drops discs to the lowest empty cell', () => {
    let s = createGravityState(C4);
    s = dropDisc(C4, s, 3);
    expect(s.board[5 * 7 + 3]).toBe(1);
    s = dropDisc(C4, s, 3);
    expect(s.board[4 * 7 + 3]).toBe(2);
    expect(s.heights[3]).toBe(2);
    expect(lastDropIndex(C4, s)).toBe(4 * 7 + 3);
  });

  it('rejects full columns and out-of-range columns', () => {
    const s = gravityFromHistory(C4, [0, 0, 0, 0, 0, 0]);
    expect(legalColumns(C4, s)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(() => dropDisc(C4, s, 0)).toThrow();
    expect(() => dropDisc(C4, s, 7)).toThrow();
    expect(() => dropDisc(C4, s, -1)).toThrow();
  });

  it('detects horizontal, vertical and both diagonal wins', () => {
    expect(gravityFromHistory(C4, [0, 0, 1, 1, 2, 2, 3]).result).toMatchObject({
      kind: 'win',
      winner: 0,
      line: [35, 36, 37, 38],
    });
    expect(gravityFromHistory(C4, [0, 1, 0, 1, 0, 1, 0]).result).toMatchObject({
      kind: 'win',
      winner: 0,
      line: [14, 21, 28, 35],
    });
    // Rising diagonal for X: (5,0) (4,1) (3,2) (2,3)
    const rising = gravityFromHistory(C4, [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);
    expect(rising.result).toMatchObject({ kind: 'win', winner: 0 });
    expect(rising.result?.kind === 'win' && rising.result.line).toEqual([17, 23, 29, 35]);
    // Falling diagonal for X: (2,3) (3,4) (4,5) (5,6)
    const falling = gravityFromHistory(C4, [6, 5, 5, 4, 4, 3, 4, 3, 3, 0, 3]);
    expect(falling.result?.kind === 'win' && falling.result.line).toEqual([17, 25, 33, 41]);
  });

  it('does not stop after the game ends and declares a draw on a full board', () => {
    const won = gravityFromHistory(C4, [0, 1, 0, 1, 0, 1, 0]);
    expect(legalColumns(C4, won)).toEqual([]);
    expect(() => dropDisc(C4, won, 3)).toThrow();
    // A full-board draw (generated offline by a no-four-in-a-row search, then hard-coded).
    const history = [
      1, 4, 6, 6, 6, 0, 2, 0, 3, 6, 3, 3, 5, 3, 6, 1, 0, 3, 0, 4, 3, 5, 0, 6, 5, 2, 2, 5, 1, 2, 2,
      0, 2, 5, 4, 5, 4, 4, 4, 1, 1, 1,
    ];
    const s = gravityFromHistory(C4, history);
    expect(s.history).toHaveLength(42);
    expect(s.result).toEqual({ kind: 'draw', reason: 'board-full' });
  });

  it('requires five in a row on the 9×7 board', () => {
    const four = gravityFromHistory(C5, [0, 0, 1, 1, 2, 2, 3]);
    expect(four.result).toBeNull();
    const five = gravityFromHistory(C5, [0, 0, 1, 1, 2, 2, 3, 3, 4]);
    expect(five.result).toMatchObject({ kind: 'win', winner: 0, line: [54, 55, 56, 57, 58] });
  });

  it('undoes by replaying and validates states (randomized)', () => {
    const rng = new Rng(3);
    for (let g = 0; g < 100; g++) {
      let s = createGravityState(C4, (g % 2) as 0 | 1);
      while (!s.result) s = dropDisc(C4, s, rng.pick(legalColumns(C4, s)));
      expect(isValidGravityState(C4, JSON.parse(JSON.stringify(s)))).toBe(true);
      const back = undoDrops(C4, s, 3);
      expect(back.history).toEqual(s.history.slice(0, -3));
      expect(back.result).toBeNull();
    }
    const s = gravityFromHistory(C4, [3, 3]);
    expect(isValidGravityState(C4, { ...s, heights: [0, 0, 0, 1, 0, 0, 0] })).toBe(false);
  });
});
