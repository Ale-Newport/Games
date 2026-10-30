import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chooseAction } from '../ai';
import { senetEnv } from '../ai-adapter';
import {
  OFF,
  THROW_ODDS,
  applyMove,
  cellOf,
  extraThrow,
  legalMoves,
  startPosition,
  type SenetPosition,
} from '../engine';
import { act, isValidSenet, legalActions, newSenet, rollOf } from '../match';
import { bestMove, greedyMove } from '../search';

/** A position from squares: positive numbers for side 0, negative for side 1. */
const at = (squares: number[], off: [number, number] = [0, 0]): SenetPosition => {
  const board = new Array<number>(31).fill(0);
  for (const sq of squares) board[Math.abs(sq)] = sq > 0 ? 1 : 2;
  return { board, off };
};

describe('Senet rules', () => {
  it('starts alternating on the first row; sticks give 1–5 and extra throws on 1, 4, 5', () => {
    const p = startPosition();
    expect(p.board.slice(1, 11)).toEqual([1, 2, 1, 2, 1, 2, 1, 2, 1, 2]);
    expect(THROW_ODDS.reduce((a, b) => a + b)).toBe(1);
    expect([1, 2, 3, 4, 5].map(extraThrow)).toEqual([true, false, false, true, true]);
    expect(cellOf(1)).toEqual([0, 0]);
    expect(cellOf(11)).toEqual([9, 1]);
    expect(cellOf(30)).toEqual([9, 2]);
  });

  it('swaps with a lone piece, but pairs protect and three in a row block', () => {
    const swap = legalMoves(at([5, -7]), 0, 2).find((m) => m.from === 5)!;
    expect(swap.swap).toBe(true);
    const after = applyMove(at([5, -7]), 0, swap);
    expect(after.board[7]).toBe(1);
    expect(after.board[5]).toBe(2);
    expect(legalMoves(at([5, -7, -8]), 0, 2).some((m) => m.from === 5)).toBe(false);
    expect(legalMoves(at([5, -7, -8, -9]), 0, 5).some((m) => m.from === 5)).toBe(false);
    expect(legalMoves(at([5, 7]), 0, 2).some((m) => m.from === 5)).toBe(false);
  });

  it('every piece stops on 26; the Water sends it back; the last squares need exact throws', () => {
    expect(legalMoves(at([24]), 0, 3)).toHaveLength(0);
    expect(legalMoves(at([24]), 0, 2)[0]!.to).toBe(26);
    expect(legalMoves(at([26]), 0, 5)[0]!.to).toBe(OFF);
    const water = legalMoves(at([26, -15]), 0, 1)[0]!;
    expect(water.landed).toBe(27);
    expect(water.to).toBe(14);
    expect(legalMoves(at([28]), 0, 3)[0]!.to).toBe(OFF);
    expect(legalMoves(at([28]), 0, 2)).toHaveLength(0);
    expect(legalMoves(at([29]), 0, 2)[0]!.to).toBe(OFF);
    expect(legalMoves(at([30]), 0, 1)[0]!.to).toBe(OFF);
    expect(legalMoves(at([25, -26]), 0, 1)).toHaveLength(0);
  });
});

describe('Senet play and search', () => {
  it('throws, moves, passes and validates saves by replay', () => {
    let g = newSenet(4);
    for (let i = 0; i < 40 && g.phase !== 'over'; i++) g = act(g, legalActions(g)[0]!);
    expect(isValidSenet(g)).toBe(true);
    expect(isValidSenet({ ...g, captures: [7, 7] })).toBe(false);
    expect(rollOf(newSenet(4))).toBe(0);
  });

  it('the search and greedy players choose legal moves and finish games', () => {
    // Bearing off from 26 with a 5 beats a plain step of the same length.
    expect(greedyMove(at([26, 3]), 0, 5)!.from).toBe(26);
    expect(bestMove(at([26, 3]), 0, 5, 1)!.from).toBe(26);
    let g = newSenet(12);
    for (let i = 0; i < 4000 && g.phase !== 'over'; i++)
      g = act(g, chooseAction(g, g.turn === 0 ? 'search' : 'greedy'));
    expect(g.phase).toBe('over');
    expect(isValidSenet(g)).toBe(true);
  });
});

describeAdapterContract(senetEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 4000,
  illegalActions: (g) => ['move:99', 'jump', 'pass'].filter((a) => !legalActions(g).includes(a)),
});
