import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { stateFromHistory } from '../../shared/mnk/engine';
import { defaultSetup, newMatch } from '../../shared/mnk/match';
import { t4Env } from '../ai-adapter';
import { MATCH_CONFIG, SAVE_SPEC } from '../match';
import { T4 } from '../rules';

describeAdapterContract(t4Env, {
  configs: [undefined, { firstPlayer: 1 }],
  playouts: 150,
  illegalActions: (s) => [-1, 16, 0.5, ...s.history],
});

describe('Tic-Tac-Toe 4×4 adapter and saves', () => {
  it('declares a 16-action space and a [3,4,4] observation', () => {
    expect(t4Env.info.actionSpaceSize).toBe(16);
    const tensor = t4Env.getObservationTensor!(stateFromHistory(T4, [5]), 1);
    expect(tensor.shape).toEqual([3, 4, 4]);
    expect(tensor.data).toHaveLength(48);
    expect(tensor.data[16 + 5]).toBe(1);
  });

  it('round-trips match saves and rejects a 3×3 board', () => {
    const m = newMatch(MATCH_CONFIG, defaultSetup(MATCH_CONFIG, 'Ana'));
    expect(unwrap(SAVE_SPEC, wrap(SAVE_SPEC, m)).ok).toBe(true);
    const wrong = { ...m, round: { ...m.round, board: new Array(9).fill(0) } };
    expect(unwrap(SAVE_SPEC, wrap(SAVE_SPEC, wrong)).ok).toBe(false);
  });
});
