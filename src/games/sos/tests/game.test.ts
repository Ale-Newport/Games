import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { sosCodec, sosEnv } from '../ai-adapter';
import { applySosAction, createSosState, isValidSosState, legalSosActions } from '../engine';
import { SOS } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[], first: 0 | 1 = 0) =>
  moves.reduce((s, a) => applySosAction(s, a), createSosState(first));

describeAdapterContract(sosEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 80,
  illegalActions: (s) =>
    ['X3', 'S36', 'O-1', 'S', ''].filter((a) => !legalSosActions(s).includes(a)),
});

describe('SOS rules', () => {
  it('spelling S-O-S scores and the writer goes again', () => {
    const s = play(['S0', 'S2', 'O1']); // Red S a6, Blue S c6, Red O b6 completes a6-b6-c6
    expect(s.scores).toEqual([1, 0]);
    expect(s.toMove).toBe(0);
    expect(s.lines).toEqual([{ cells: [0, 1, 2], seat: 0 }]);
    expect(s.movers).toEqual([0, 1, 0]);
  });

  it('one letter can complete several lines, in every direction', () => {
    // An O at c4 (14) between S's across, down and on both diagonals.
    const setup = ['S13', 'S15', 'S8', 'S20', 'S7', 'S21', 'S9', 'S19'];
    const s = play([...setup, 'O14']);
    expect(s.lines.filter((l) => l.cells[1] === 14)).toHaveLength(4);
    expect(s.scores[0]).toBe(4);
    // An S finishes a line from either end.
    const t = play(['S0', 'O1', 'S2']);
    expect(t.scores).toEqual([1, 0]);
  });

  it('ends on a full grid; equal scores draw', () => {
    let s = createSosState(0);
    while (!s.result) s = applySosAction(s, `O${s.cells.indexOf('')}`);
    expect(s.result).toEqual({ winner: null });
    expect(s.scores).toEqual([0, 0]);
  });

  it('validates by replay and encodes moves uniquely', () => {
    const s = play(['S0', 'O7'], 1);
    expect(isValidSosState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidSosState({ ...s, scores: [1, 0] })).toBe(false);
    for (const a of ['S0', 'O0', 'S35', 'O35']) expect(sosCodec.decode(sosCodec.encode(a))).toBe(a);
  });
});

describe('SOS integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(sosEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 80,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(sosEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 80,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = SOS.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applySosAction(m.round, 'S14') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const cells = played.round.cells.map(() => 'O' as const);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, cells } })).ok).toBe(
      false,
    );
  });
});
