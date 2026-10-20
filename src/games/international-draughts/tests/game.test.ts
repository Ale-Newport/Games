import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { EpsilonAgent } from '../../../ai/agents/random-agent';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { applyMove, initialState, legalMoves } from '../../shared/draughts/engine';
import { draughtsFeats } from '../../shared/draughts/feats';
import { AGENT_PRESETS } from '../ai';
import { internationalEnv } from '../ai-adapter';
import { INTERNATIONAL_DRAUGHTS } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(internationalEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 1500,
  illegalActions: () => [[0, 1], [], [200]],
});

describe('International draughts integration', () => {
  it('uses the 10×10 variant with White first and squares numbered 1–50', () => {
    expect(INTERNATIONAL_DRAUGHTS.match.fixedFirstSeat).toBe(0);
    const s = initialState(VARIANT);
    expect(s.board).toHaveLength(100);
    expect(internationalEnv.actionToString!(legalMoves(VARIANT, s)[0]!)).toMatch(
      /^(3[1-9]|[4][0-9]|50)-(2[6-9]|3[0-5])$/,
    );
  });

  it('records the best single-move capture for achievements (cross-checked on random games)', () => {
    const rng = new Rng(8);
    for (let g = 0; g < 8; g++) {
      let s = initialState(VARIANT);
      let best = 0;
      while (!s.result && s.history.length < 400) {
        const before = s.board.filter((p) => p !== 0).length;
        const mover = s.toMove;
        s = applyMove(VARIANT, s, rng.pick(legalMoves(VARIANT, s)));
        if (mover === 0) best = Math.max(best, before - s.board.filter((p) => p !== 0).length);
      }
      expect(draughtsFeats(VARIANT, s, 0).bestCapture).toBe(best);
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const medium = evaluateAgents(
      internationalEnv,
      new EpsilonAgent(preset('medium'), 0.05),
      preset('easy'),
      { games: 4, seed: 1, maxSteps: 400 },
    ).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 60_000);
});
