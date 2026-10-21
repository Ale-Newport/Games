import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyMorrisAction, legalMorrisActions } from '../../shared/morris/engine';
import { morrisCodec } from '../../shared/morris/environment';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { sixEnv } from '../ai-adapter';
import { SIX_MENS_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(sixEnv, {
  configs: [undefined],
  playouts: 25,
  maxSteps: 2000,
  illegalActions: (s) =>
    ['z9', 'a7-g1', 'a7xa7', ''].filter((a) => !legalMorrisActions(VARIANT, s).includes(a)),
});

describe("Six Men's Morris integration", () => {
  it('encodes placements, moves and removals to unique indices', () => {
    const codec = morrisCodec(VARIANT);
    const seen = new Map<number, string>();
    let s = sixEnv.reset(0);
    for (let i = 0; i < 60 && !s.result; i++) {
      const legal = legalMorrisActions(VARIANT, s);
      for (const a of legal) {
        const code = codec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(codec.decode(code)).toBe(a);
      }
      s = applyMorrisAction(VARIANT, s, legal[(i * 7) % legal.length]!);
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(sixEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 2,
      maxSteps: 2000,
    }).agents[0];
    // Random sometimes survives by repetition on the small board; it never wins.
    expect(easy.wins).toBeGreaterThanOrEqual(4);
    expect(easy.losses).toBe(0);
    const medium = evaluateAgents(sixEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 2,
      maxSteps: 2000,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = SIX_MENS_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = {
      ...m,
      round: applyMorrisAction(VARIANT, m.round, legalMorrisActions(VARIANT, m.round)[0]!),
    };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, quiet: 9 } })).ok).toBe(
      false,
    );
  });
});
