import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { ShieldAction } from '../sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('missile-command setup', () => {
  it('binds the rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.cities).toHaveLength(6);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['fly', 'dive'] as unknown as ShieldAction[],
});
