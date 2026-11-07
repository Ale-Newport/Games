import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { CrossAction } from '../../shared/crossing/sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('crossing setup', () => {
  it('binds the crossing rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.rules).toBe(manifest.id);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'fire'] as unknown as CrossAction[],
});
