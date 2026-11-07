import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { BLOCK, legalActions, newBones } from '../../shared/bones/engine';
import { env } from '../ai-adapter';
import { manifest } from '../manifest';

describe('Block Dominoes setup', () => {
  it('binds the shared rules: target and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    const g = newBones(BLOCK, 2, 1);
    expect(g.rules).toBe(BLOCK.id);
    expect(legalActions(g).length).toBeGreaterThan(0);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { players: 3 }, { players: 4 }],
  playouts: 2,
  maxSteps: 20000,
  illegalActions: (g) => ['jump', 'play:99:0', 'next'].filter((a) => !legalActions(g).includes(a)),
});
