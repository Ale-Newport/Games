import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyDominoAction, legalDominoActions } from '../../shared/dominoes/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { domineeringEnv } from '../ai-adapter';
import { DOMINEERING_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(domineeringEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 64,
  illegalActions: (s) =>
    ['7,0,v', '0,7,h', '0,0,x', '-1,0,v', ''].filter(
      (a) => !legalDominoActions(VARIANT, s).includes(a),
    ),
});

describe('Domineering integration', () => {
  it('the first seat places vertically and the second horizontally', () => {
    const cfg = DOMINEERING_GAME.match;
    const round = cfg.rules.create(1);
    expect(legalDominoActions(VARIANT, round).every((a) => a.endsWith(',h'))).toBe(true);
    const after = applyDominoAction(VARIANT, round, '0,0,h');
    expect(legalDominoActions(VARIANT, after).every((a) => a.endsWith(',v'))).toBe(true);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(domineeringEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 64,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(domineeringEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 64,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = DOMINEERING_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const first = legalDominoActions(VARIANT, m.round)[0]!;
    const played = { ...m, round: applyDominoAction(VARIANT, m.round, first) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const cells = played.round.cells.map(() => -1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, cells } })).ok).toBe(
      false,
    );
  });
});
