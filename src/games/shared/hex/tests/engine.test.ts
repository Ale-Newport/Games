import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  SWAP,
  applyHexAction,
  canSwap,
  createHexState,
  isValidHexState,
  legalHexActions,
  replayHex,
  winningPath,
} from '../engine';

const at = (r: number, c: number, size = 5) => r * size + c;

describe('hex rules', () => {
  it('detects a winning chain along the hex neighborhood (no orthogonal shortcuts)', () => {
    const board = new Array<number>(25).fill(0);
    // Red down the anti-diagonal: (r, c) touches (r + 1, c − 1) in hex.
    for (const [r, c] of [
      [0, 4],
      [1, 3],
      [2, 2],
      [3, 1],
      [4, 0],
    ] as const)
      board[at(r, c)] = 1;
    expect(winningPath(board, 5, 1)).toEqual([at(0, 4), at(1, 3), at(2, 2), at(3, 1), at(4, 0)]);
    // The other diagonal is not connected in hex (only through two-cell steps).
    const other = new Array<number>(25).fill(0);
    for (let k = 0; k < 5; k++) other[at(k, k)] = 1;
    expect(winningPath(other, 5, 1)).toBe(null);
    const blue = new Array<number>(25).fill(0);
    for (let c = 0; c < 5; c++) blue[at(2, c)] = 2;
    expect(winningPath(blue, 5, 2)?.length).toBe(5);
  });

  it('lets Blue swap the first stone, mirrored, only right after it', () => {
    const s = applyHexAction(createHexState(5), at(1, 3));
    expect(canSwap(s)).toBe(true);
    const swapped = applyHexAction(s, SWAP);
    expect(swapped.board[at(1, 3)]).toBe(0);
    expect(swapped.board[at(3, 1)]).toBe(2);
    expect(swapped.toMove).toBe(0);
    expect(legalHexActions(swapped)).not.toContain(SWAP);
    expect(legalHexActions(applyHexAction(s, at(0, 0)))).not.toContain(SWAP);
  });

  it('always has exactly one winner on a full board, and games replay', () => {
    const rng = new Rng(11);
    for (let g = 0; g < 40; g++) {
      let s = createHexState(5);
      while (!s.result) {
        const moves = legalHexActions(s).filter((a) => a !== SWAP);
        s = applyHexAction(s, rng.pick(moves));
      }
      const full = s.board.map((v) => v || (g % 2 ? 1 : 2));
      expect(!!winningPath(full, 5, 1) !== !!winningPath(full, 5, 2)).toBe(true);
      expect(isValidHexState(5, JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(replayHex(5, s.history).result?.winner).toBe(s.result.winner);
    }
  });
});
