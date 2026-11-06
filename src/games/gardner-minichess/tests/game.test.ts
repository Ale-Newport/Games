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
import { gardnerEnv } from '../ai-adapter';
import { GARDNER_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const at = (fen: string) => replayChess(VARIANT, fen, []);

describeAdapterContract(gardnerEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 3000,
  illegalActions: (s) =>
    ['a2a4', 'e1g1', 'O-O', 'f2f3', 'a1a6', 'z9z9', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('Gardner minichess integration', () => {
  it('uses a 5×5 board with single pawn steps and no castling', () => {
    const s = createChessState(VARIANT);
    expect(s.startFen).toBe('rnbqk/ppppp/5/PPPPP/RNBQK w - - 0 1');
    expect(legalActions(VARIANT, s).sort()).toEqual(
      ['a2a3', 'b1a3', 'b1c3', 'b2b3', 'c2c3', 'd2d3', 'e2e3'].sort(),
    );
    expect(gardnerEnv.info.observationShape).toEqual([12, 5, 5]);
    expect(gardnerEnv.info.actionSpaceSize).toBe(25 * 25 * 6 + 2);
  });

  it('promotes on the fifth rank', () => {
    const s = applyChessAction(VARIANT, at('4k/P4/5/5/K4 w - - 0 1'), 'a4a5q');
    expect(s.san).toEqual(['a5=Q+']);
  });

  it('the engine finds a mate on the small board', () => {
    const agent = new ChessSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: 3 });
    const s = at('k4/5/1K3/5/4R w - - 0 1');
    const move = agent.selectAction(gardnerEnv, s, 0, { rng: new Rng(1) });
    expect(move).toBe('e1e5');
    expect(applyChessAction(VARIANT, s, move).result).toEqual({
      kind: 'win',
      winner: 0,
      reason: 'checkmate',
    });
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(gardnerEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 2,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(gardnerEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 2,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves', () => {
    const cfg = GARDNER_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyChessAction(VARIANT, m.round, 'b1c3') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, history: ['b1a3'] } })).ok,
    ).toBe(false);
  });
});
