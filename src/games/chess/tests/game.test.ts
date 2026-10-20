import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { chessActionCodec } from '../../shared/chess/environment';
import {
  applyChessAction,
  createChessState,
  legalActions,
  replayChess,
} from '../../shared/chess/game';
import { ChessSearchAgent } from '../../shared/chess/search';
import {
  defaultSetup,
  flagFall,
  matchSaveSpec,
  newMatch,
  roundOutcome,
} from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { chessEnv } from '../ai-adapter';
import { CHESS } from '../Game';
import { VARIANT, feats } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const at = (fen: string) => replayChess(VARIANT, fen, []);
const bestMove = (fen: string, depth: number) => {
  const s = at(fen);
  const agent = new ChessSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: depth });
  return agent.selectAction(chessEnv, s, fen.split(' ')[1] === 'b' ? 1 : 0, { rng: new Rng(5) });
};

describeAdapterContract(chessEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 3000,
  illegalActions: (s) =>
    ['e2e5', 'e1g1', 'O-O', 'a7a6', 'e7e8n', 'z9z9', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('Chess integration', () => {
  it('encodes every move of random games to a unique index and back', () => {
    const codec = chessActionCodec(VARIANT);
    const rng = new Rng(3);
    let s = createChessState(VARIANT);
    const seen = new Map<number, string>();
    for (let i = 0; i < 200 && !s.result; i++) {
      for (const a of legalActions(VARIANT, s)) {
        const code = codec.encode(a);
        expect(seen.get(code) ?? a).toBe(a);
        seen.set(code, a);
        expect(codec.decode(code)).toBe(a);
      }
      s = applyChessAction(VARIANT, s, rng.pick(legalActions(VARIANT, s)));
    }
    expect(chessEnv.info.actionSpaceSize).toBe(64 * 64 * 6 + 2);
  });

  it('finds mates, wins material and avoids stalemating a lone king', () => {
    expect(bestMove('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', 3)).toBe('e1e8');
    expect(bestMove('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', 3)).toBe(
      'h5f7',
    );
    expect(bestMove('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1', 3)).toBe('d2d5');
    // King and queen against king: the engine mates instead of stalemating.
    const mate = bestMove('k7/8/1K6/8/8/8/8/7Q w - - 0 1', 3);
    const after = applyChessAction(VARIANT, at('k7/8/1K6/8/8/8/8/7Q w - - 0 1'), mate);
    expect(after.result).toEqual({ kind: 'win', winner: 0, reason: 'checkmate' });
  });

  it('converts king and rook against king within the fifty-move rule', () => {
    let s = at('8/8/8/4k3/8/8/8/R3K3 w - - 0 1');
    const hard = new ChessSearchAgent(VARIANT, { id: 'h', label: 'h', maxDepth: 5 });
    const rng = new Rng(2);
    while (!s.result) {
      const side = s.fen.split(' ')[1] === 'b' ? 1 : 0;
      // Black defends by keeping its king as central as possible.
      const action =
        side === 0
          ? hard.selectAction(chessEnv, s, 0, { rng })
          : new ChessSearchAgent(VARIANT, { id: 'd', label: 'd', maxDepth: 2 }).selectAction(
              chessEnv,
              s,
              1,
              { rng },
            );
      s = applyChessAction(VARIANT, s, action);
    }
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'checkmate' });
  }, 60_000);

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(chessEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 1,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(chessEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 1,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('counts moves and promotions for achievements', () => {
    // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# — White mated in 4 moves.
    let s = createChessState(VARIANT);
    for (const a of ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6', 'h5f7']) {
      s = applyChessAction(VARIANT, s, a);
    }
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'checkmate' });
    expect(feats(s, 0)).toEqual({ moves: 4, promoted: false });
    expect(feats(s, 1)).toEqual({ moves: 3, promoted: false });
    const promo = applyChessAction(VARIANT, at('8/4P3/8/8/8/8/k7/4K3 w - - 0 1'), 'e7e8q');
    expect(feats(promo, 0).promoted).toBe(true);
  });

  it('round-trips saves, rejects tampered games and draws a flag fall without mating material', () => {
    const cfg = CHESS.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, { ...defaultSetup(cfg, 'Ana'), timeControl: '5+0' });
    const played = { ...m, round: applyChessAction(VARIANT, m.round, 'e2e4') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, fen: m.round.fen } })).ok,
    ).toBe(false);
    // White's flag falls while Black has only a king: a draw, not a loss.
    const bare = { ...m, round: at('4k3/8/8/8/8/8/8/R3K3 w - - 0 1') };
    expect(roundOutcome(cfg, flagFall(cfg, bare, 0))).toEqual({ winner: null, reason: 'timeout' });
    expect(roundOutcome(cfg, flagFall(cfg, bare, 1))).toEqual({ winner: 0, reason: 'timeout' });
  });
});
