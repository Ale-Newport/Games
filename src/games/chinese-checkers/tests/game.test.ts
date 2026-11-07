import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyJumpRaceAction, legalJumpRaceActions } from '../../shared/jump-race/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { chineseCheckersEnv } from '../ai-adapter';
import { CHINESE_CHECKERS_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(chineseCheckersEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 500,
  illegalActions: (s) =>
    ['0-0', '999-1', 'x', ''].filter((a) => !legalJumpRaceActions(VARIANT, s).includes(a)),
});

describe('Chinese Checkers integration', () => {
  it('opens with 14 moves from the bottom point', () => {
    const s = CHINESE_CHECKERS_GAME.match.rules.create(0);
    expect(legalJumpRaceActions(VARIANT, s)).toHaveLength(14);
  });

  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(chineseCheckersEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 9,
      maxSteps: 500,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(chineseCheckersEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 9,
      maxSteps: 500,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('alternates the opener and saves round-trip', () => {
    const cfg = CHINESE_CHECKERS_GAME.match;
    expect(cfg.fixedFirstSeat).toBeUndefined();
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const first = legalJumpRaceActions(VARIANT, m.round)[0]!;
    const played = { ...m, round: applyJumpRaceAction(VARIANT, m.round, first) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...played.round, history: [...played.round.history, '0-0'] };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
