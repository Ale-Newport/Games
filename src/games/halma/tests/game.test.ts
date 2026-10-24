import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyJumpRaceAction, legalJumpRaceActions } from '../../shared/jump-race/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { halmaEnv } from '../ai-adapter';
import { HALMA_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(halmaEnv, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 700,
  illegalActions: (s) =>
    ['0-0', '999-1', 'x', ''].filter((a) => !legalJumpRaceActions(VARIANT, s).includes(a)),
});

describe('Halma integration', () => {
  it('Easy beats Random (seeded)', () => {
    const easy = evaluateAgents(halmaEnv, preset('easy'), preset('random'), {
      games: 2,
      seed: 9,
      maxSteps: 700,
    }).agents[0];
    expect(easy.wins).toBe(2);
  }, 180_000);

  it('alternates the opener and saves round-trip', () => {
    const cfg = HALMA_GAME.match;
    expect(cfg.fixedFirstSeat).toBeUndefined();
    expect(cfg.rules.create(1).toMove).toBe(1);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const first = legalJumpRaceActions(VARIANT, m.round)[0]!;
    const played = { ...m, round: applyJumpRaceAction(VARIANT, m.round, first) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...played.round, board: played.round.board.map((x) => (x === 2 ? 1 : x)) };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
