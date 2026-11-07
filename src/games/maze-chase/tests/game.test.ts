import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { MazeAction } from '../../shared/maze/sim';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('maze-chase setup', () => {
  it('binds the maze rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.rules).toBe(manifest.id);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'fire'] as unknown as MazeAction[],
});
