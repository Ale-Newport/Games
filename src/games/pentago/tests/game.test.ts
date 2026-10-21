import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { pentagoCodec, pentagoEnv } from '../ai-adapter';
import {
  LINES5,
  applyPentagoAction,
  createPentagoState,
  legalPentagoActions,
  twist,
  type PentagoState,
} from '../engine';
import { PENTAGO } from '../Game';
import { PentagoSearchAgent } from '../search';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const with_ = (cells: Record<number, number>, toMove: 0 | 1 = 0): PentagoState => ({
  ...createPentagoState(),
  board: Array.from({ length: 36 }, (_, p) => cells[p] ?? 0),
  toMove,
});

describeAdapterContract(pentagoEnv, {
  configs: [undefined],
  playouts: 25,
  maxSteps: 40,
  illegalActions: (s) =>
    ['36:0R', '5:4R', '5:0X', ''].filter((a) => !legalPentagoActions(s).includes(a)),
});

describe('Pentago rules', () => {
  it('has 32 lines of five and twists a quadrant a quarter turn', () => {
    expect(LINES5).toHaveLength(32);
    const b = new Array<number>(36).fill(0);
    b[0] = 1; // top-left corner of quadrant 0
    expect(twist(b, 0, true)[2]).toBe(1); // clockwise: to the top-right corner
    expect(twist(b, 0, false)[12]).toBe(1); // counter-clockwise: to the bottom-left corner
    expect(twist(twist(b, 0, true), 0, false)).toEqual(b);
  });

  it('wins by placement without twisting, and by a twist', () => {
    const four = with_({ 0: 1, 1: 1, 2: 1, 3: 1 });
    expect(legalPentagoActions(four)).toContain('4');
    expect(applyPentagoAction(four, '4').result).toEqual({
      kind: 'win',
      winner: 0,
      line: [0, 1, 2, 3, 4],
    });
    // White has a7..c7 (cells 0–2); a clockwise twist of quadrant 1 brings cells 15 and 9 to
    // cells 3 and 4, completing row 0.
    const s = with_({ 0: 1, 1: 1, 2: 1, 9: 1, 15: 1, 30: 2, 31: 2, 32: 2, 33: 2 });
    const won = applyPentagoAction(s, '35:1R');
    expect(won.result).toEqual({ kind: 'win', winner: 0, line: [0, 1, 2, 3, 4] });
  });

  it('a twist that makes five for both players is a draw', () => {
    // The same twist also turns Black's 17 and 11 into cells 15 and 16, completing row 2.
    const s = with_({ 0: 1, 1: 1, 2: 1, 9: 1, 15: 1, 12: 2, 13: 2, 14: 2, 11: 2, 17: 2 });
    expect(applyPentagoAction(s, '35:1R').result).toEqual({ kind: 'draw' });
  });

  it('the engine takes a win and blocks a four', () => {
    const agent = new PentagoSearchAgent({ id: 't', label: 't', maxDepth: 2, beam: 12 });
    const win = with_({ 6: 1, 7: 1, 8: 1, 9: 1, 30: 2, 31: 2 });
    const move = agent.selectAction(pentagoEnv, win, 0, { rng: new Rng(1) });
    expect(applyPentagoAction(win, move).result).toMatchObject({ kind: 'win', winner: 0 });
    // Black to move faces a white four on row 1 that a single placement would finish.
    const block = with_({ 6: 1, 7: 1, 8: 1, 9: 1, 30: 2 }, 1);
    const reply = agent.selectAction(pentagoEnv, block, 1, { rng: new Rng(1) });
    const next = applyPentagoAction(block, reply);
    const whiteWins = legalPentagoActions(next).some((a) => {
      const r = applyPentagoAction(next, a).result;
      return r?.kind === 'win' && r.winner === 0;
    });
    expect(whiteWins).toBe(false);
  });

  it('encodes every action to a unique index', () => {
    const seen = new Map<number, string>();
    for (const a of legalPentagoActions(createPentagoState())) {
      const code = pentagoCodec.encode(a);
      expect(seen.has(code)).toBe(false);
      seen.set(code, a);
      expect(pentagoCodec.decode(code)).toBe(a);
    }
    expect(pentagoCodec.decode(pentagoCodec.encode('4'))).toBe('4');
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(pentagoEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 3,
      maxSteps: 40,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(pentagoEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 3,
      maxSteps: 40,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = PENTAGO.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyPentagoAction(m.round, '14:2R') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, toMove: 0 as const } })).ok,
    ).toBe(false);
  });
});
