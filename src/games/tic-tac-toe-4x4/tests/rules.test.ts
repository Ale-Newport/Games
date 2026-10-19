import { describe, expect, it } from 'vitest';
import { allLines } from '../../../core/game-engine/grid';
import { createMnkState, legalCells, playCell, stateFromHistory } from '../../shared/mnk/engine';
import { T4, wonByDoubleThreat, wonOnDiagonal } from '../rules';

describe('Tic-Tac-Toe 4×4 rules', () => {
  it('has exactly 10 winning lines', () => {
    expect(allLines(T4, 4)).toHaveLength(10);
  });

  it('wins on every row, column and long diagonal for both players', () => {
    for (const line of allLines(T4, 4)) {
      // X fills the line; O plays the first free cells outside it (never forming a line in 3 moves).
      const others = Array.from({ length: 16 }, (_, i) => i).filter((c) => !line.includes(c));
      const history = [line[0]!, others[0]!, line[1]!, others[1]!, line[2]!, others[2]!, line[3]!];
      const s = stateFromHistory(T4, history);
      expect(s.result, `line ${line}`).toMatchObject({ kind: 'win', winner: 0, line });
      const asO = stateFromHistory(T4, history, 1);
      expect(asO.result).toMatchObject({ kind: 'win', winner: 1, line });
    }
  });

  it('does not count three in a row', () => {
    const s = stateFromHistory(T4, [0, 4, 1, 5, 2, 8]);
    expect(s.result).toBeNull();
    expect(legalCells(T4, s)).toHaveLength(10);
  });

  it('declares a draw on a full board without a line', () => {
    // Rows: X X O O / O O X X / X X O O / O O X X  — no four in a row anywhere.
    const xs = [0, 1, 6, 7, 8, 9, 14, 15];
    const os = [2, 3, 4, 5, 10, 11, 12, 13];
    const history = xs.flatMap((x, i) => [x, os[i]!]);
    const s = stateFromHistory(T4, history);
    expect(s.result).toEqual({ kind: 'draw', reason: 'board-full' });
  });

  it('rejects occupied and out-of-range cells', () => {
    const s = playCell(T4, createMnkState(T4), 5);
    expect(() => playCell(T4, s, 5)).toThrow();
    expect(() => playCell(T4, s, 16)).toThrow();
  });

  it('detects double-threat and diagonal wins', () => {
    // X: 0,5,10 diagonal + 1,2: after X plays 2 (with 0,1 and diagonal 0,5,10) X threatens 3 and 15.
    const s = stateFromHistory(T4, [0, 4, 5, 8, 10, 12, 1, 6, 2, 9, 15]);
    expect(s.result).toMatchObject({ kind: 'win', winner: 0, line: [0, 5, 10, 15] });
    expect(wonOnDiagonal(s)).toBe(true);
    expect(wonByDoubleThreat(s)).toBe(true);
    const row = stateFromHistory(T4, [0, 4, 1, 5, 2, 6, 3]);
    expect(wonOnDiagonal(row)).toBe(false);
    expect(wonByDoubleThreat(row)).toBe(false);
  });
});
