import { describe, expect, it } from 'vitest';
import {
  completingCells,
  createMnkState,
  isValidMnkState,
  legalCells,
  lineThrough,
  playCell,
  stateFromHistory,
  undoMoves,
  type MnkRules,
} from '../engine';

const T3: MnkRules = { rows: 3, cols: 3, k: 3 };
const T4: MnkRules = { rows: 4, cols: 4, k: 4 };

describe('m,n,k engine', () => {
  it('starts empty with the requested first player', () => {
    const s = createMnkState(T3, 1);
    expect(s.board).toEqual(new Array(9).fill(0));
    expect(s.toMove).toBe(1);
    expect(legalCells(T3, s)).toHaveLength(9);
  });

  it('alternates turns and records history immutably', () => {
    const s0 = createMnkState(T3);
    const s1 = playCell(T3, s0, 4);
    expect(s0.board[4]).toBe(0);
    expect(s1.board[4]).toBe(1);
    expect(s1.toMove).toBe(1);
    const s2 = playCell(T3, s1, 0);
    expect(s2.board[0]).toBe(2);
    expect(s2.history).toEqual([4, 0]);
  });

  it('rejects occupied, out-of-range and post-game moves', () => {
    const s = playCell(T3, createMnkState(T3), 4);
    expect(() => playCell(T3, s, 4)).toThrow();
    expect(() => playCell(T3, s, 9)).toThrow();
    expect(() => playCell(T3, s, -1)).toThrow();
    expect(() => playCell(T3, s, 1.5)).toThrow();
    const won = stateFromHistory(T3, [0, 3, 1, 4, 2]);
    expect(won.result).toMatchObject({ kind: 'win', winner: 0, line: [0, 1, 2] });
    expect(legalCells(T3, won)).toEqual([]);
    expect(() => playCell(T3, won, 5)).toThrow();
  });

  it('detects all eight 3×3 lines for both players', () => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const line of lines) {
      const board = new Array(9).fill(0) as (0 | 1 | 2)[];
      for (const c of line) board[c] = 2;
      for (const c of line) expect(lineThrough(T3, board, c)).toEqual(line);
    }
  });

  it('declares a draw only on a full board without a line', () => {
    const draw = stateFromHistory(T3, [0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(draw.result).toEqual({ kind: 'draw', reason: 'board-full' });
    const anotherDraw = stateFromHistory(T3, [0, 1, 2, 4, 3, 6, 5, 8, 7]);
    expect(anotherDraw.result?.kind).toBe('draw');
    // A line completed with the ninth mark is a win, not a draw.
    const ninthWin = stateFromHistory(T3, [0, 1, 4, 2, 5, 3, 7, 6, 8]);
    expect(ninthWin.result).toMatchObject({ kind: 'win', winner: 0, line: [0, 4, 8] });
  });

  it('supports k-in-a-row on larger boards', () => {
    const s = stateFromHistory(T4, [0, 4, 5, 8, 10, 12, 15]);
    expect(s.result).toMatchObject({ kind: 'win', winner: 0, line: [0, 5, 10, 15] });
    const notYet = stateFromHistory(T4, [0, 4, 1, 5, 2]);
    expect(notYet.result).toBeNull();
  });

  it('inverts the outcome in misère play', () => {
    const s = stateFromHistory({ ...T3, misere: true }, [0, 3, 1, 4, 2]);
    expect(s.result).toMatchObject({
      kind: 'win',
      winner: 1,
      line: [0, 1, 2],
      reason: 'misere-line',
    });
  });

  it('undoes moves by replaying history', () => {
    const s = stateFromHistory(T3, [0, 3, 1, 4, 2]);
    const back = undoMoves(T3, s, 1);
    expect(back.result).toBeNull();
    expect(back.toMove).toBe(0);
    expect(back.board[2]).toBe(0);
    expect(undoMoves(T3, s, 99).history).toEqual([]);
  });

  it('finds completing cells (threats and forks)', () => {
    const blocked = stateFromHistory(T3, [0, 4, 8, 1, 7, 6]);
    expect(completingCells(T3, blocked, 0)).toEqual([]);
    const s = stateFromHistory(T3, [0, 4, 2, 7]);
    expect(completingCells(T3, s, 0)).toEqual([1]);
    expect(completingCells(T3, s, 1)).toEqual([1]);
    const doubleThreat = stateFromHistory(T3, [0, 1, 4, 8, 6]);
    expect(completingCells(T3, doubleThreat, 0)).toEqual([2, 3]);
  });

  it('validates untrusted states by replaying their history', () => {
    const s = stateFromHistory(T3, [4, 0, 8]);
    expect(isValidMnkState(T3, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidMnkState(T3, { ...s, board: [1, 1, 1, 0, 0, 0, 0, 0, 0] })).toBe(false);
    expect(isValidMnkState(T3, { ...s, history: [4, 4] })).toBe(false);
    expect(isValidMnkState(T3, null)).toBe(false);
    expect(isValidMnkState(T3, { ...s, toMove: 0 })).toBe(false);
  });
});
