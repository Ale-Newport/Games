import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyTaflAction, legalTaflActions } from '../../shared/tafl/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { hnefataflEnv } from '../ai-adapter';
import { HNEFATAFL_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(hnefataflEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 300,
  illegalActions: (s) =>
    ['60-61', '0-1', '3-3', ''].filter((a) => !legalTaflActions(VARIANT, s).includes(a)),
});

describe('Hnefatafl integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(hnefataflEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 9,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(hnefataflEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 9,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThanOrEqual(medium.losses);
  }, 180_000);

  it('the attackers always move first and saves round-trip', () => {
    const cfg = HNEFATAFL_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = {
      ...m,
      round: applyTaflAction(VARIANT, m.round, legalTaflActions(VARIANT, m.round)[0]!),
    };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
