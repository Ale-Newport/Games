import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { SnakeAction } from '../../shared/snake/sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('wraparound-snake setup', () => {
  it('binds the snake rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.rules).toBe(manifest.id);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'fire'] as unknown as SnakeAction[],
});
