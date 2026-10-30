import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chooseAction } from '../ai';
import { urEnv } from '../ai-adapter';
import { END, THROW_ODDS, applyMove, legalMoves, startPosition, type UrPosition } from '../engine';
import { act, isValidUr, legalActions, newUr, rollOf } from '../match';
import { bestMove, evaluate, greedyMove } from '../search';
import { cellOf } from '../UrTable';

const at = (mine: number[], theirs: number[] = []): UrPosition => {
  const p = startPosition();
  for (const sq of mine) p.board[0][sq] = true;
  for (const sq of theirs) p.board[1][sq] = true;
  p.waiting = [7 - mine.length, 7 - theirs.length];
  return p;
};

describe('Ur rules', () => {
  it('throws four binary dice: 0 to 4 with binomial odds', () => {
    expect(THROW_ODDS.reduce((a, b) => a + b)).toBe(1);
    expect(THROW_ODDS[2]).toBe(6 / 16);
  });

  it('enters, moves exactly, never onto its own piece, and bears off with the exact throw', () => {
    const p = at([3, 13]);
    const moves = legalMoves(p, 0, 2);
    expect(moves.map((m) => [m.from, m.to])).toEqual([
      [0, 2],
      [3, 5],
      [13, END],
    ]);
    expect(legalMoves(p, 0, 3).some((m) => m.from === 13)).toBe(false);
    expect(legalMoves(at([2, 4]), 0, 2).some((m) => m.from === 2)).toBe(false);
  });

  it('captures on the shared row but not on the central rosette, and rosettes give another throw', () => {
    const p = at([6], [7]);
    const hit = legalMoves(p, 0, 1).find((m) => m.from === 6)!;
    expect(hit.capture).toBe(true);
    const after = applyMove(p, 0, hit);
    expect(after.board[1][7]).toBe(false);
    expect(after.waiting[1]).toBe(7);
    expect(legalMoves(at([6], [8]), 0, 2).some((m) => m.from === 6)).toBe(false);
    expect(legalMoves(at([2]), 0, 2).find((m) => m.from === 2)!.rosette).toBe(true);
    // Private squares are never shared: both sides may stand on their own square 3.
    expect(legalMoves(at([1], [3]), 0, 2).find((m) => m.from === 1)!.capture).toBe(false);
  });

  it('places squares on the historical board shape', () => {
    expect(cellOf(0, 1)).toEqual([3, 2]);
    expect(cellOf(0, 4)).toEqual([0, 2]);
    expect(cellOf(1, 5)).toEqual([0, 1]);
    expect(cellOf(0, 8)).toEqual([3, 1]);
    expect(cellOf(1, 14)).toEqual([6, 0]);
  });
});

describe('Ur play and search', () => {
  it('throws, moves, passes and validates saves by replay', () => {
    let g = newUr(5);
    for (let i = 0; i < 30 && g.phase !== 'over'; i++) g = act(g, legalActions(g)[0]!);
    expect(isValidUr(g)).toBe(true);
    expect(isValidUr({ ...g, captures: [9, 0] })).toBe(false);
    if (g.phase === 'throw') expect(act(g, 'move:0')).toBe(g);
    expect(rollOf(newUr(5))).toBe(0);
  });

  it('the search prefers a capture or a rosette to a plain step, and agents finish games', () => {
    const p = at([6, 1], [7]);
    expect(bestMove(p, 0, 1, 2)!.from).toBe(6);
    expect(greedyMove(at([2]), 0, 2)!.to).toBe(4);
    expect(evaluate(at([12]), 0)).toBeGreaterThan(evaluate(at([5]), 0));
    let g = newUr(9);
    for (let i = 0; i < 3000 && g.phase !== 'over'; i++)
      g = act(g, chooseAction(g, g.turn === 0 ? 'search' : 'greedy'));
    expect(g.phase).toBe('over');
    expect(isValidUr(g)).toBe(true);
  });
});

describeAdapterContract(urEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 3000,
  illegalActions: (g) => ['move:99', 'jump', 'pass'].filter((a) => !legalActions(g).includes(a)),
});
