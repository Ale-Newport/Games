import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { greedyMove, pegActions } from '../ai';
import { pegEnv } from '../ai-adapter';
import {
  SHAPES,
  count,
  geometry,
  has,
  initialPegs,
  isValidPegState,
  isWin,
  jump,
  legalJumps,
  newPegGame,
  nextJump,
  pegsOf,
  play,
  solve,
  undo,
} from '../engine';

describe('Peg Solitaire boards', () => {
  it('has the classic hole counts and opening jumps', () => {
    expect(geometry(SHAPES.english!).cellOf).toHaveLength(33);
    expect(geometry(SHAPES.european!).cellOf).toHaveLength(37);
    expect(geometry(SHAPES.triangle!).cellOf).toHaveLength(15);
    expect(legalJumps(SHAPES.english!, initialPegs(SHAPES.english!))).toHaveLength(4);
    expect(legalJumps(SHAPES.triangle!, initialPegs(SHAPES.triangle!))).toHaveLength(2);
    expect(count(initialPegs(SHAPES.european!))).toBe(36);
  });

  it('finds a finish on every board from the start', () => {
    for (const id of ['english', 'european', 'triangle']) {
      const shape = SHAPES[id]!;
      const r = solve(shape, initialPegs(shape), 5_000_000);
      expect(r.jumps).not.toBeNull();
      let p = initialPegs(shape);
      for (const j of r.jumps!) p = jump(p, j);
      expect(isWin(shape, p)).toBe(true);
      if (id === 'english') expect(has(p, shape.start)).toBe(true);
    }
  });

  it('reports a position with no finish', () => {
    const shape = SHAPES.triangle!;
    // Two pegs far apart cannot be reduced to one.
    const p = (1n << 0n) | (1n << 14n);
    expect(solve(shape, p).jumps).toBeNull();
    expect(solve(shape, p).exhausted).toBe(false);
  });
});

describe('Peg Solitaire play', () => {
  it('jumps, undoes, and follows the solver to a win', () => {
    let s = newPegGame('english');
    const j = legalJumps(SHAPES.english!, pegsOf(s))[0]!;
    s = play(s, j);
    expect(count(pegsOf(s))).toBe(31);
    s = undo(s);
    expect(s).toMatchObject({ jumps: 0, undos: 1 });
    while (s.status === 'playing') s = play(s, nextJump(s).jump!);
    expect(s.status).toBe('won');
  });

  it('greedy jumps are legal and saves validate by replay', () => {
    let s = newPegGame('triangle');
    const rng = new Rng(2);
    while (s.status === 'playing') {
      const a = greedyMove(s, rng);
      expect(pegActions(s)).toContain(a);
      s = pegEnv.applyAction(s, a);
    }
    expect(isValidPegState(s)).toBe(true);
    expect(isValidPegState({ ...s, pegs: 'ff' })).toBe(false);
    expect(isValidPegState({ ...s, board: 'square' })).toBe(false);
    expect(isValidPegState({ ...s, status: s.status === 'won' ? 'stuck' : 'won' })).toBe(false);
  });
});

describeAdapterContract(pegEnv, {
  configs: [undefined, { board: 'triangle' }],
  playouts: 6,
  maxSteps: 40,
  illegalActions: (s) => ['0-0', '99-1', 'x'].filter((a) => !pegActions(s).includes(a)),
});
