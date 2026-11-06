import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { EpsilonAgent } from '../../../ai/agents/random-agent';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { legalActions, reversiFromHistory } from '../../shared/reversi/engine';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { r8Env } from '../ai-adapter';
import { REVERSI_8 } from '../Game';
import { R8, ownsAllCorners, wipeout } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(r8Env, {
  configs: [undefined],
  playouts: 40,
  // Off-board actions, occupied squares, and passing while a placement exists.
  illegalActions: (s) => [
    -1,
    65,
    ...s.board.flatMap((d, i) => (d ? [i] : [])).slice(0, 3),
    ...(legalActions(R8, s).includes(64) ? [] : [64]),
  ],
});

describe('Reversi 8×8', () => {
  it('declares a 65-action space (64 squares + pass)', () => {
    expect(r8Env.info.actionSpaceSize).toBe(65);
    expect(r8Env.actionToString!(64)).toBe('pass');
    expect(r8Env.actionToString!(19)).toBe('d3');
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(r8Env, preset('easy'), preset('random'), { games: 10, seed: 1 })
      .agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(8);
    const medium = evaluateAgents(r8Env, new EpsilonAgent(preset('medium'), 0.05), preset('easy'), {
      games: 10,
      seed: 1,
    }).agents[0];
    expect(medium.wins).toBeGreaterThanOrEqual(8);
  }, 60_000);

  it('detects wipeouts and four corners', () => {
    const s = reversiFromHistory(R8, []);
    expect(wipeout(s, 0)).toBe(false);
    const all = { ...s, board: s.board.map(() => 1 as const) };
    expect(wipeout(all, 0)).toBe(true);
    expect(ownsAllCorners(all, 0)).toBe(true);
    expect(ownsAllCorners(all, 1)).toBe(false);
  });

  it('round-trips saves and fixes Black as the first mover in every round', () => {
    const cfg = REVERSI_8.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: reversiFromHistory(R8, [19, 18]) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(played.round.toMove).toBe(0);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, toMove: 1 } })).ok).toBe(
      false,
    );
  });
});
