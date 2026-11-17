import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, codeActions, env } from '../ai-adapter';

describe('Code Words environment', () => {
  it('wins more often with the vector operative than with random touches', () => {
    const vector = AGENT_PRESETS.find((a) => a.id === 'vector-operative')!.create();
    const play = (smart: boolean) => {
      let wins = 0;
      for (let seed = 1; seed <= 12; seed++) {
        let s = env.createInitialState({ skill: 'normal' }, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) {
          const a = smart ? vector.selectAction(env, s, 0, { rng }) : rng.pick(codeActions(s));
          s = env.applyAction(s, a);
        }
        wins += env.getReward(s, 0);
      }
      return wins;
    };
    expect(play(true)).toBeGreaterThan(play(false));
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [undefined, { skill: 'easy' }],
  playouts: 2,
  maxSteps: 80,
  illegalActions: () => ['g:99', 'g:-1'],
});
