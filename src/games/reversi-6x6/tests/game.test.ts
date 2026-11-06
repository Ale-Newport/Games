import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { EpsilonAgent } from '../../../ai/agents/random-agent';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { createReversiState, legalActions } from '../../shared/reversi/engine';
import { AGENT_PRESETS } from '../ai';
import { r6Env } from '../ai-adapter';
import { R6 } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(r6Env, {
  configs: [undefined],
  playouts: 60,
  illegalActions: (s) => [
    -1,
    37,
    ...s.board.flatMap((d, i) => (d ? [i] : [])).slice(0, 3),
    ...(legalActions(R6, s).includes(36) ? [] : [36]),
  ],
});

describe('Reversi 6×6', () => {
  it('starts with four discs and four legal moves on a 37-action space', () => {
    const s = createReversiState(R6);
    expect(s.board.filter((d) => d !== 0)).toHaveLength(4);
    expect(legalActions(R6, s)).toHaveLength(4);
    expect(r6Env.info.actionSpaceSize).toBe(37);
  });

  it('Hard as White beats Medium as Black most of the time (seeded, 250 ms budget)', () => {
    const r = evaluateAgents(
      r6Env,
      new EpsilonAgent(preset('medium'), 0.05),
      new EpsilonAgent(preset('hard'), 0.05),
      {
        games: 6,
        seed: 3,
        swapSeats: false,
        timeLimitMs: 250,
      },
    );
    expect(r.agents[1].wins).toBeGreaterThan(r.agents[1].losses);
  }, 60_000);
});
