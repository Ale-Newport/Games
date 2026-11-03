import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { DuelAction } from '../sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('spacewar setup', () => {
  it('binds the rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.ships).toHaveLength(2);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['fly', 'dive'] as unknown as DuelAction[],
});
