import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyMancalaAction, legalMancalaActions } from '../../shared/mancala/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { kalahEnv } from '../ai-adapter';
import { KALAH_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(kalahEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 500,
  illegalActions: (s) =>
    ['-1', '99', 'x', ''].filter((a) => !legalMancalaActions(VARIANT, s).includes(a)),
});

describe('Kalah Mancala integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(kalahEnv, preset('easy'), preset('random'), {
      games: 10,
      seed: 9,
      maxSteps: 500,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(kalahEnv, preset('medium'), preset('easy'), {
      games: 10,
      seed: 9,
      maxSteps: 500,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('South moves first and saves round-trip', () => {
    const cfg = KALAH_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyMancalaAction(VARIANT, m.round, '2') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(
        spec,
        wrap(spec, { ...played, round: { ...played.round, stores: [9, 9] as [number, number] } }),
      ).ok,
    ).toBe(false);
  });
});
