import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { legalActions } from '../../shared/throws/engine';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('rock-paper-scissors setup', () => {
  it('binds 3 throws and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(legalActions(env.createInitialState(undefined, 1))).toHaveLength(3);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { target: 3 }, { target: 10 }],
  playouts: 3,
  maxSteps: 2000,
  illegalActions: (g) => ['jump', 'throw:9'].filter((a) => !legalActions(g).includes(a)),
});
