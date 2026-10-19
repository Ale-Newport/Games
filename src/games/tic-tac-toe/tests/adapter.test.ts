import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { tttEnv } from '../ai-adapter';
import { replay } from '../rules';

describeAdapterContract(tttEnv, {
  configs: [undefined, { firstPlayer: 1 }],
  playouts: 200,
  illegalActions: (s) => [-1, 9, 2.5, ...s.history],
});

describe('Tic-Tac-Toe adapter specifics', () => {
  it('encodes observations as [3,3,3] planes from the observer perspective', () => {
    const s = replay([4, 0]);
    const t0 = tttEnv.getObservationTensor!(s, 0);
    expect(t0.shape).toEqual([3, 3, 3]);
    expect(t0.data.slice(0, 9)).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    expect(t0.data.slice(9, 18)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(t0.data.slice(18)).toEqual(new Array(9).fill(1));
    const t1 = tttEnv.getObservationTensor!(s, 1);
    expect(t1.data.slice(0, 9)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('reports outcomes and rewards', () => {
    const win = replay([0, 3, 1, 4, 2]);
    expect(tttEnv.getOutcome(win)).toEqual({
      returns: [1, -1],
      winners: [0],
      draw: false,
      reason: 'line',
    });
    expect(tttEnv.getReward(win, 1)).toBe(-1);
    const draw = replay([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(tttEnv.getOutcome(draw)).toMatchObject({ draw: true, winners: [], returns: [0, 0] });
  });

  it('rejects tampered serialized states', () => {
    const data = tttEnv.serializeState(replay([0, 1]));
    expect(() => tttEnv.deserializeState(data.replace('"board":[1', '"board":[2'))).toThrow();
  });

  it('only lists actions for the player to move', () => {
    const s = replay([4]);
    expect(tttEnv.getLegalActions(s, 0)).toEqual([]);
    expect(tttEnv.getLegalActions(s, 1)).toHaveLength(8);
  });
});
