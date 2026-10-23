import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { yoteCodec, yoteEnv } from '../ai-adapter';
import { applyYoteAction, createYoteState, isValidYoteState, legalYoteActions } from '../engine';
import { YOTE } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) => moves.reduce((s, a) => applyYoteAction(s, a), createYoteState());

describeAdapterContract(yoteEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 250,
  illegalActions: (s) =>
    ['+30', 'x0', 'xh', '0-2', ''].filter((a) => !legalYoteActions(s).includes(a)),
});

describe('Yoté rules', () => {
  it('opens with 30 placements', () => {
    expect(legalYoteActions(createYoteState())).toHaveLength(30);
  });

  it('a jump captures and then demands a bonus removal by the same player', () => {
    // Light on c3 (14), dark on d3 (15); light jumps to e3 (16).
    const s = play(['+14', '+15', '+0', '+29']);
    expect(legalYoteActions(s)).toContain('14-16');
    const jumped = applyYoteAction(s, '14-16');
    expect(jumped.bonus).toBe(true);
    expect(jumped.toMove).toBe(0);
    expect(legalYoteActions(jumped)).toEqual(['x29']);
    const done = applyYoteAction(jumped, 'x29');
    expect(done.toMove).toBe(1);
    expect(done.board.filter((x) => x === 2)).toHaveLength(0);
    expect(done.hands).toEqual([10, 10]);
  });

  it('with no enemy piece on the board the bonus comes out of the hand', () => {
    const s = play(['+14', '+15']);
    const jumped = applyYoteAction(s, '14-16');
    expect(legalYoteActions(jumped)).toEqual(['xh']);
    expect(applyYoteAction(jumped, 'xh').hands).toEqual([11, 10]);
  });

  it('validates by replay and encodes actions uniquely', () => {
    const s = play(['+14', '+15']);
    expect(isValidYoteState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidYoteState({ ...s, hands: [12, 12] })).toBe(false);
    for (const a of ['+0', '+29', '14-16', '14-15', 'x7', 'xh'])
      expect(yoteCodec.decode(yoteCodec.encode(a))).toBe(a);
  });
});

describe('Yoté integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(yoteEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 250,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(yoteEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 250,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = YOTE.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyYoteAction(m.round, '+14') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(
        spec,
        wrap(spec, { ...played, round: { ...played.round, hands: [12, 12] as [number, number] } }),
      ).ok,
    ).toBe(false);
  });
});
