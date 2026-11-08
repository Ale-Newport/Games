import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { RescueAction } from '../sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('rescue-walkers setup', () => {
  it('binds the rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.score).toBe(0);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { options: { start: '4' } }],
  playouts: 2,
  maxSteps: 60 * 60 * 30,
  illegalActions: () => ['fly', 'dive'] as unknown as RescueAction[],
});
