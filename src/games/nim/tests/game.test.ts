import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyHeapsAction, legalHeapsActions } from '../../shared/heaps/engine';
import { HeapsSolver } from '../../shared/heaps/solver';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { nimEnv } from '../ai-adapter';
import { NIM_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(nimEnv, {
  configs: [undefined],
  playouts: 30,
  maxSteps: 60,
  illegalActions: (s) =>
    ['9:1', '0:0', '0:99', 'b:1', ''].filter((a) => !legalHeapsActions(VARIANT, s).includes(a)),
});

describe('Nim integration', () => {
  it('Hard never loses a position it starts in a winning spot', () => {
    const solver = new HeapsSolver(VARIANT);
    const hard = preset('hard');
    const random = preset('random');
    let checked = 0;
    for (let seed = 0; seed < 40; seed++) {
      let s = nimEnv.reset(seed);
      if (!solver.wins(s.heaps)) continue;
      checked++;
      const rng = new Rng(seed);
      while (!s.result) {
        const agent = s.toMove === 0 ? hard : random;
        s = nimEnv.applyAction(s, agent.selectAction(nimEnv, s, s.toMove, { rng }));
      }
      expect(s.result.winner).toBe(0);
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(nimEnv, preset('easy'), preset('random'), {
      games: 20,
      seed: 5,
      maxSteps: 60,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(nimEnv, preset('medium'), preset('easy'), {
      games: 20,
      seed: 5,
      maxSteps: 60,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  });

  it('new rounds draw a setup and alternate the first player; restart keeps the setup', () => {
    const cfg = NIM_GAME.match;
    const round = cfg.rules.create(1);
    expect(round.first).toBe(1);
    expect(round.toMove).toBe(1);
    const played = applyHeapsAction(VARIANT, round, legalHeapsActions(VARIANT, round)[0]!);
    const restarted = cfg.rules.restart!(played);
    expect(restarted.heaps).toEqual(round.start);
    expect(restarted.history).toEqual([]);
  });

  it('round-trips saves and rejects tampered games', () => {
    const cfg = NIM_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const first = legalHeapsActions(VARIANT, m.round)[0]!;
    const played = { ...m, round: applyHeapsAction(VARIANT, m.round, first) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const heaps = played.round.heaps.map((n) => n + 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, heaps } })).ok).toBe(
      false,
    );
  });
});
