import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { minesActions } from '../../shared/minesweeper/ai';
import { minesEnv } from '../ai-adapter';
import { SPECS, newMines, reveal } from '../engine';

describe('Classic Minesweeper boards', () => {
  it('has the three standard boards', () => {
    expect(SPECS.beginner).toEqual({ rows: 9, cols: 9, mines: 10 });
    expect(SPECS.intermediate).toEqual({ rows: 16, cols: 16, mines: 40 });
    expect(SPECS.expert).toEqual({ rows: 16, cols: 30, mines: 99 });
    const s = reveal(newMines('expert', SPECS.expert!, 5, false), 0);
    expect(s.mines.filter(Boolean)).toHaveLength(99);
  });

  it('hides the mines from the observation until the game ends', () => {
    const s = minesEnv.applyAction(minesEnv.createInitialState(undefined, 3), 'r:40');
    expect(minesEnv.getObservation(s, 0).mines.some(Boolean)).toBe(s.status !== 'playing');
  });
});

describeAdapterContract(minesEnv, {
  configs: [undefined, { difficulty: 'intermediate' }],
  playouts: 10,
  maxSteps: 400,
  illegalActions: (s) => ['r:9999', 'x', 'f:0'].filter((a) => !minesActions(s).includes(a)),
});
