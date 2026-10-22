import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { teekoCodec, teekoEnv } from '../ai-adapter';
import { SHAPES, applyTeekoAction, createTeekoState, legalTeekoActions } from '../engine';
import { TEEKO } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyTeekoAction(s, a), createTeekoState());

describeAdapterContract(teekoEnv, {
  configs: [undefined],
  playouts: 25,
  maxSteps: 220,
  illegalActions: (s) => ['25', '0-12', '-1', ''].filter((a) => !legalTeekoActions(s).includes(a)),
});

describe('Teeko rules', () => {
  it('has 28 lines and 16 squares', () => {
    expect(SHAPES).toHaveLength(44);
    expect(SHAPES.filter((s) => s[1]! - s[0]! === 1 && s[2]! - s[0]! === 5)).toHaveLength(16);
  });

  it('wins with a square during the drop and moves one step after it', () => {
    const square = play(['0', '20', '1', '21', '5', '22', '6']);
    expect(square.result).toEqual({ kind: 'win', winner: 0, shape: [0, 1, 5, 6] });
    const moving = play(['0', '24', '2', '23', '4', '22', '12', '18']);
    expect(legalTeekoActions(moving).every((a) => a.includes('-'))).toBe(true);
    expect(legalTeekoActions(moving)).toContain('12-13');
    expect(legalTeekoActions(moving)).not.toContain('12-14'); // two steps
  });

  it('encodes drops and moves to unique indices', () => {
    for (const a of ['0', '24', '12-13', '24-18'])
      expect(teekoCodec.decode(teekoCodec.encode(a))).toBe(a);
    expect(new Set(['0', '24', '12-13', '13-12'].map(teekoCodec.encode)).size).toBe(4);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(teekoEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 5,
      maxSteps: 220,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(teekoEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 5,
      maxSteps: 220,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = TEEKO.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyTeekoAction(m.round, '12') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, toMove: 0 as const } })).ok,
    ).toBe(false);
  });
});
