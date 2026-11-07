import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { BrickAction } from '../../shared/bricks/sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('breakout setup', () => {
  it('binds the brick rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    const r = env.createInitialState(undefined, 1);
    expect(r.state.rules).toBe(manifest.id);
    expect(env.getLegalActions(r)).toHaveLength(6);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'up'] as unknown as BrickAction[],
});
