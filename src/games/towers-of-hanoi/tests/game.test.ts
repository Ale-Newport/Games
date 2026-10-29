import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { cyclicMove, hanoiActions, solverMove } from '../ai';
import { hanoiEnv } from '../ai-adapter';
import {
  SPECS,
  bestMove,
  isValidHanoiState,
  legalMoves,
  minimum,
  moveDisk,
  newHanoi,
  undo,
} from '../engine';

describe('Towers of Hanoi', () => {
  it('knows the fewest moves: 2^n − 1 on three pegs, 17 for six disks on four', () => {
    expect(minimum(SPECS.three!)).toBe(7);
    expect(minimum(SPECS.five!)).toBe(31);
    expect(minimum(SPECS.seven!)).toBe(127);
    expect(minimum(SPECS.four!)).toBe(17);
  });

  it('allows only top disks onto empty pegs or bigger disks', () => {
    const s = newHanoi('three');
    expect(legalMoves(s.position, 3)).toEqual([
      [0, 1],
      [0, 2],
    ]);
    const t = moveDisk(s, 0, 1);
    expect(moveDisk(t, 0, 1)).toBe(t);
    expect(undo(t).position).toEqual(s.position);
  });

  it('the solver and the cyclic rule both finish three pegs optimally', () => {
    for (const level of ['three', 'five', 'seven']) {
      let a = newHanoi(level);
      while (!a.solved) a = hanoiEnv.applyAction(a, solverMove(a));
      expect(a.moves).toBe(minimum(SPECS[level]!));
      let b = newHanoi(level);
      while (!b.solved) b = hanoiEnv.applyAction(b, cyclicMove(b));
      expect(b.moves).toBe(minimum(SPECS[level]!));
    }
    let c = newHanoi('four');
    while (!c.solved) c = hanoiEnv.applyAction(c, solverMove(c));
    expect(c.moves).toBe(17);
  });

  it('gives exact hints from any position and validates saves', () => {
    let s = moveDisk(moveDisk(newHanoi('five'), 0, 2), 0, 1);
    expect(bestMove(SPECS.five!, s.position)).not.toBeNull();
    while (!s.solved) {
      const m = bestMove(SPECS.five!, s.position)!;
      s = moveDisk(s, m[0], m[1]);
    }
    expect(isValidHanoiState(s)).toBe(true);
    expect(isValidHanoiState({ ...s, solved: false })).toBe(false);
    expect(isValidHanoiState({ ...s, level: 'ten' })).toBe(false);
    expect(hanoiActions(s)).toEqual([]);
  });
});

describeAdapterContract(hanoiEnv, {
  configs: [undefined, { level: 'four' }],
  playouts: 4,
  maxSteps: 620,
  illegalActions: (s) => ['0>0', '9>1', 'x'].filter((a) => !hanoiActions(s).includes(a)),
});
