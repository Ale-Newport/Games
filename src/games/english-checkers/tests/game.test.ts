import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { EpsilonAgent } from '../../../ai/agents/random-agent';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyMove, initialState, legalMoves, replayMoves } from '../../shared/draughts/engine';
import { Rng } from '../../../core/game-engine/random';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { englishEnv } from '../ai-adapter';
import { ENGLISH_CHECKERS } from '../Game';
import { VARIANT, feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(englishEnv, {
  configs: [undefined],
  playouts: 40,
  maxSteps: 1000,
  illegalActions: () => [[0, 1], [5], [], [100, 101]],
});

describe('English checkers integration', () => {
  it('writes moves in standard 1–32 notation', () => {
    const first = legalMoves(VARIANT, initialState(VARIANT))[0]!;
    expect(englishEnv.actionToString!(first)).toMatch(/^\d{1,2}-\d{1,2}$/);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(englishEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 1,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(
      englishEnv,
      new EpsilonAgent(preset('medium'), 0.05),
      preset('easy'),
      { games: 6, seed: 1, maxSteps: 400 },
    ).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 60_000);

  it('detects crowning and triple jumps for achievements (cross-checked on random games)', () => {
    expect(feats(initialState(VARIANT), null)).toEqual({ crowned: false, tripleJump: false });
    const rng = new Rng(21);
    let sawCrown = false;
    for (let g = 0; g < 30; g++) {
      let s = initialState(VARIANT);
      const expected = { crowned: false, tripleJump: false };
      while (!s.result && s.history.length < 300) {
        const mover = s.toMove;
        const move = rng.pick(legalMoves(VARIANT, s));
        const before = s.board.filter((p) => p !== 0).length;
        const wasMan = s.board[move[0]!] === 1 || s.board[move[0]!] === 3;
        s = applyMove(VARIANT, s, move);
        const nowKing =
          s.board[move[move.length - 1]!] === 2 || s.board[move[move.length - 1]!] === 4;
        if (mover === 0 && wasMan && nowKing) expected.crowned = true;
        if (mover === 0 && before - s.board.filter((p) => p !== 0).length >= 3)
          expected.tripleJump = true;
      }
      expect(feats(s, 0)).toEqual(expected);
      sawCrown ||= expected.crowned;
    }
    expect(sawCrown).toBe(true);
  });

  it('round-trips saves and keeps Black as the first mover', () => {
    const cfg = ENGLISH_CHECKERS.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const moves = legalMoves(VARIANT, m.round);
    const played = { ...m, round: replayMoves(VARIANT, [moves[0]!]) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, noProgress: 5 } })).ok,
    ).toBe(false);
  });
});
