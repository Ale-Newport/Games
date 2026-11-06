import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { gravityFromHistory } from '../../shared/gravity/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { c4Env } from '../ai-adapter';
import { FOUR_IN_A_ROW } from '../Game';
import { C4, wonDiagonally } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(c4Env, {
  configs: [undefined, { firstPlayer: 1 }],
  playouts: 120,
  illegalActions: (s) => [-1, 7, 1.5, ...s.heights.flatMap((h, c) => (h >= C4.rows ? [c] : []))],
});

describe('Four in a Row', () => {
  it('declares a 7-column action space and [3,6,7] observation', () => {
    expect(c4Env.info.actionSpaceSize).toBe(7);
    expect(c4Env.getObservationTensor!(gravityFromHistory(C4, [3]), 0).data).toHaveLength(126);
  });

  it('detects diagonal wins for the achievement', () => {
    expect(wonDiagonally(gravityFromHistory(C4, [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]))).toBe(true);
    expect(wonDiagonally(gravityFromHistory(C4, [0, 0, 1, 1, 2, 2, 3]))).toBe(false);
  });

  it('levels are ordered by strength (seeded, reproducible)', () => {
    const easy = evaluateAgents(c4Env, preset('easy'), preset('random'), { games: 30, seed: 1 })
      .agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(27);
    const medium = evaluateAgents(c4Env, preset('medium'), preset('easy'), { games: 20, seed: 1 })
      .agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses * 4);
  }, 60_000);

  it('round-trips match saves and rejects tampered rounds', () => {
    const spec = matchSaveSpec(FOUR_IN_A_ROW.match);
    const m = newMatch(FOUR_IN_A_ROW.match, defaultSetup(FOUR_IN_A_ROW.match, 'Ana'));
    const played = { ...m, round: gravityFromHistory(C4, [3, 3, 2]) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(
        spec,
        wrap(spec, { ...played, round: { ...played.round, heights: [0, 0, 1, 3, 0, 0, 0] } }),
      ).ok,
    ).toBe(false);
  });
});
