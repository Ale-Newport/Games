import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  applyReversi,
  countDiscs,
  createReversiState,
  flipsFor,
  isLegalAction,
  isValidReversiState,
  legalActions,
  passAction,
  reversiFromHistory,
  undoReversi,
  type Disc,
  type ReversiState,
} from '../engine';

const R8 = { size: 8 };
const R6 = { size: 6 };
const at = (r: number, c: number, n = 8) => r * n + c;

describe('Reversi engine', () => {
  it('starts with the standard four discs and four legal moves for Black', () => {
    const s = createReversiState(R8);
    expect(countDiscs(s.board)).toEqual([2, 2]);
    expect(s.board[at(3, 3)]).toBe(2);
    expect(s.board[at(3, 4)]).toBe(1);
    expect(legalActions(R8, s).sort((a, b) => a - b)).toEqual(
      [at(2, 3), at(3, 2), at(4, 5), at(5, 4)].sort((a, b) => a - b),
    );
  });

  it('flips lines in every direction and only when bracketed', () => {
    const s = applyReversi(R8, createReversiState(R8), at(2, 3));
    expect(s.board[at(2, 3)]).toBe(1);
    expect(s.board[at(3, 3)]).toBe(1);
    expect(s.lastFlipped).toEqual([at(3, 3)]);
    expect(countDiscs(s.board)).toEqual([4, 1]);
    // A custom board: Black at the center with white rays ending in black discs in all 8 directions.
    const b: Disc[] = new Array(64).fill(0);
    const center = at(4, 4);
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ] as const) {
      b[at(4 + dr, 4 + dc)] = 2;
      b[at(4 + 2 * dr, 4 + 2 * dc)] = 1;
    }
    expect(flipsFor(R8, b, center, 0)).toHaveLength(8);
    b[at(2, 2)] = 0; // break one ray
    expect(flipsFor(R8, b, center, 0)).toHaveLength(7);
    expect(flipsFor(R8, b, center, 1)).toEqual([]);
  });

  it('forces a pass when a player has no move and ends when neither can move', () => {
    const R4 = { size: 4 };
    // 4×4: empty corner 0, one white disc at 6, everything else black. No line from 0 reaches the
    // white disc through black discs, so White must pass.
    const board: Disc[] = new Array(16).fill(1);
    board[0] = 0;
    board[6] = 2;
    const s: ReversiState = { board, toMove: 1, history: [], lastFlipped: [], result: null };
    expect(legalActions(R4, s)).toEqual([passAction(R4)]);
    expect(isLegalAction(R4, s, 0)).toBe(false);
    // Black to move with one flipping move; afterwards nobody can move → the game ends.
    const b2: Disc[] = new Array(16).fill(1);
    b2[0] = 0;
    b2[1] = 2;
    const s2: ReversiState = { board: b2, toMove: 0, history: [], lastFlipped: [], result: null };
    expect(legalActions(R4, s2)).toEqual([0]);
    const end = applyReversi(R4, s2, 0);
    expect(end.result).toEqual({ kind: 'win', winner: 0, reason: 'disc-count' });
    expect(countDiscs(end.board)).toEqual([16, 0]);
  });

  it('plays complete random games on 8×8 and 6×6 with consistent results (randomized)', () => {
    const rng = new Rng(7);
    for (const rules of [R8, R6]) {
      for (let g = 0; g < 40; g++) {
        let s = createReversiState(rules);
        let plies = 0;
        while (!s.result) {
          s = applyReversi(rules, s, rng.pick(legalActions(rules, s)));
          plies++;
          expect(plies).toBeLessThan(rules.size * rules.size * 2);
        }
        const [b, w] = countDiscs(s.board);
        if (s.result.kind === 'draw') expect(b).toBe(w);
        else expect(s.result.winner === 0 ? b > w : w > b).toBe(true);
        expect(legalActions(rules, s)).toEqual([]);
        expect(isValidReversiState(rules, JSON.parse(JSON.stringify(s)))).toBe(true);
        expect(undoReversi(rules, s, 1).history).toEqual(s.history.slice(0, -1));
      }
    }
  });

  it('rejects illegal placements, passes and tampered states', () => {
    const s = createReversiState(R8);
    expect(() => applyReversi(R8, s, at(0, 0))).toThrow();
    expect(() => applyReversi(R8, s, passAction(R8))).toThrow();
    const played = reversiFromHistory(R8, [at(2, 3)]);
    expect(isValidReversiState(R8, { ...played, toMove: 0 })).toBe(false);
  });
});
