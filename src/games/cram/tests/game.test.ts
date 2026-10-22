import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyDominoAction, legalDominoActions } from '../../shared/dominoes/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { cramEnv } from '../ai-adapter';
import { CRAM_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(cramEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 30,
  illegalActions: (s) =>
    ['4,0,v', '0,5,h', '0,0,x', '-1,0,v', ''].filter(
      (a) => !legalDominoActions(VARIANT, s).includes(a),
    ),
});

describe('Cram integration', () => {
  it('both seats may place either way', () => {
    const round = CRAM_GAME.match.rules.create(1);
    const moves = legalDominoActions(VARIANT, round);
    expect(moves.some((a) => a.endsWith(',h'))).toBe(true);
    expect(moves.some((a) => a.endsWith(',v'))).toBe(true);
    expect(moves).toHaveLength(49);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(cramEnv, preset('easy'), preset('random'), {
      games: 10,
      seed: 9,
      maxSteps: 30,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(cramEnv, preset('medium'), preset('easy'), {
      games: 10,
      seed: 9,
      maxSteps: 30,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = CRAM_GAME.match;
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
