import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import {
  applyChessAction,
  createChessState,
  legalActions,
  replayChess,
} from '../../shared/chess/game';
import { ChessSearchAgent } from '../../shared/chess/search';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { antichessEnv } from '../ai-adapter';
import { ANTICHESS_GAME } from '../Game';
import { VARIANT, feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const at = (fen: string) => replayChess(VARIANT, fen, []);

describeAdapterContract(antichessEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 3000,
  illegalActions: (s) =>
    ['O-O', 'e1g1', 'e2e5', 'a7a6', 'z9z9', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('Antichess integration', () => {
  it('has no castling, check or royal king, and forces captures', () => {
    const s = createChessState(VARIANT);
    expect(s.startFen.split(' ')[2]).toBe('-');
    // 1. e3 b5 2. Bxb5 — forced, the only capture available.
    const a = applyChessAction(VARIANT, applyChessAction(VARIANT, s, 'e2e3'), 'b7b5');
    expect(legalActions(VARIANT, a)).toEqual(['f1b5']);
    // A queen attacking the king is not check: the king may stay and other pieces may move.
    const k = at('4k3/8/8/8/8/8/8/4Q2K b - - 0 1');
    expect(legalActions(VARIANT, k)).toContain('e8d8');
    const taken = applyChessAction(VARIANT, at('4k3/4Q3/8/8/8/8/8/7K b - - 0 1'), 'e8e7');
    expect(taken.san).toEqual(['Kxe7']);
  });

  it('wins by losing every piece or by having no legal move', () => {
    // White's last piece is captured: White, to move with nothing left, wins.
    const gone = applyChessAction(VARIANT, at('8/8/8/8/8/8/1p6/2B5 b - - 0 1'), 'b2c1q');
    expect(gone.result).toEqual({ kind: 'win', winner: 0, reason: 'no-pieces-or-moves' });
    // White captures Black's last piece: Black wins.
    const empty = applyChessAction(VARIANT, at('8/8/8/8/8/2p5/1B6/8 w - - 0 1'), 'b2c3');
    expect(empty.result).toEqual({ kind: 'win', winner: 1, reason: 'no-pieces-or-moves' });
    // Blocked pawns: the side to move has pieces but no legal move and wins.
    const blocked = applyChessAction(VARIANT, at('8/8/8/8/p7/8/P7/8 w - - 0 1'), 'a2a3');
    expect(blocked.result).toEqual({ kind: 'win', winner: 1, reason: 'no-pieces-or-moves' });
    expect(feats(blocked, 1)).toEqual({ kingPromotion: false, blockedWin: true });
  });

  it('promotes to a king and records it', () => {
    const s = applyChessAction(VARIANT, at('8/P7/8/8/8/8/8/7r w - - 0 1'), 'a7a8k');
    expect(s.san).toEqual(['a8=K']);
    expect(feats(s, 0).kingPromotion).toBe(true);
  });

  it('the engine hands over its last piece when that wins', () => {
    // Only Ra2 lets the b3 pawn capture White's last piece (b3xa2), which wins for White.
    const agent = new ChessSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: 4 });
    const s = at('8/8/8/8/8/1p6/8/R7 w - - 0 1');
    expect(agent.selectAction(antichessEnv, s, 0, { rng: new Rng(1) })).toBe('a1a2');
    const won = applyChessAction(VARIANT, applyChessAction(VARIANT, s, 'a1a2'), 'b3a2');
    expect(won.result).toEqual({ kind: 'win', winner: 0, reason: 'no-pieces-or-moves' });
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(antichessEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 4,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(4);
    const medium = evaluateAgents(antichessEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 4,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves', () => {
    const cfg = ANTICHESS_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyChessAction(VARIANT, m.round, 'e2e3') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, checks: [1, 0] } })).ok,
    ).toBe(false);
  });
});
