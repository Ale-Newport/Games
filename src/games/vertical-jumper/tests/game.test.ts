import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { ClimbAction } from '../sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('vertical-jumper setup', () => {
  it('binds the rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.pops).toBe(0);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 40000,
  illegalActions: () => ['fly', 'dive'] as unknown as ClimbAction[],
});
