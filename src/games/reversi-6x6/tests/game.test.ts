import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { EpsilonAgent } from '../../../ai/agents/random-agent';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { createReversiState, legalActions } from '../../shared/reversi/engine';
import { ReversiSearchAgent } from '../../shared/reversi/search';
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

  it('Hard-strength search as White beats Medium as Black (seeded, deterministic)', () => {
    // Hard is time-limited (800 ms), which is not reproducible under test load. In practice it
    // reaches depth 8–9 in the middlegame and solves the last 14+ empties exactly, so a fixed
    // depth-6 search with a 14-empty exact endgame is a conservative, deterministic stand-in.
    const hardFloor = new ReversiSearchAgent(R6, {
      id: 'hard-floor',
      label: 'Hard (fixed depth)',
      maxDepth: 6,
      endgameEmpties: 14,
    });
    const r = evaluateAgents(
      r6Env,
      new EpsilonAgent(preset('medium'), 0.05),
      new EpsilonAgent(hardFloor, 0.05),
      { games: 6, seed: 3, swapSeats: false },
    );
    expect(r.agents[1].wins).toBeGreaterThanOrEqual(5);
  }, 60_000);
});
