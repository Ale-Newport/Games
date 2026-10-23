import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyHuntAction, legalHuntActions } from '../../shared/hunt/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { baghChalEnv } from '../ai-adapter';
import { BAGH_CHAL_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(baghChalEnv, {
  configs: [undefined],
  playouts: 10,
  maxSteps: 300,
  illegalActions: (s) =>
    ['0-48', '+0', 'stop', 'x', ''].filter((a) => !legalHuntActions(VARIANT, s).includes(a)),
});

describe('Bagh-Chal integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(baghChalEnv, preset('easy'), preset('random'), {
      games: 10,
      seed: 9,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(baghChalEnv, preset('medium'), preset('easy'), {
      games: 10,
      seed: 9,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('the prey move first and saves round-trip', () => {
    const cfg = BAGH_CHAL_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyHuntAction(VARIANT, m.round, '+12') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, captured: 3 } })).ok,
    ).toBe(false);
  });
});
