import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { CartAction } from '../sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('cartpole setup', () => {
  it('binds the rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.x).toBe(0);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { options: { pole: 'short' } }],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['fly', 'dive'] as unknown as CartAction[],
});
