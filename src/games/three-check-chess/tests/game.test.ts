import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { applyChessAction, legalActions, replayChess } from '../../shared/chess/game';
import { ChessSearchAgent } from '../../shared/chess/search';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { threeCheckEnv } from '../ai-adapter';
import { THREE_CHECK_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const from = (fen: string, moves: string[] = []) => replayChess(VARIANT, fen, moves);

describeAdapterContract(threeCheckEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 3000,
  illegalActions: (s) =>
    ['e2e5', 'e1g1', 'O-O', 'a7a6', 'z9z9', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('Three-Check integration', () => {
  it('counts checks and ends the game on the third one', () => {
    const fen = '4k3/8/8/8/8/8/8/R3K3 w - - 0 1';
    const two = from(fen, ['a1a8', 'e8d7', 'a8a7', 'd7d6']);
    expect(two.checks).toEqual([2, 0]);
    expect(two.result).toBe(null);
    const three = applyChessAction(VARIANT, two, 'a7a6');
    expect(three.checks).toEqual([3, 0]);
    expect(three.result).toEqual({ kind: 'win', winner: 0, reason: 'three-check' });
    expect(three.san[three.san.length - 1]).toBe('Ra6+');
  });

  it('a double check counts once', () => {
    // Bc6+ uncovers the e1 rook as well: two pieces give check with one move.
    const s = applyChessAction(VARIANT, from('4k3/8/8/8/4B3/8/8/K3R3 w - - 0 1'), 'e4c6');
    expect(s.checks).toEqual([1, 0]);
  });

  it('only two bare kings are a dead draw; a lone minor piece can still give checks', () => {
    const bare = applyChessAction(VARIANT, from('4k3/8/8/8/8/8/3n4/4K3 w - - 0 1'), 'e1d2');
    expect(bare.result).toEqual({ kind: 'draw', reason: 'insufficient-material' });
    const knight = applyChessAction(VARIANT, from('4k3/8/8/8/8/8/1N6/K7 w - - 0 1'), 'a1a2');
    expect(knight.result).toBe(null);
  });

  it('the engine gives the winning third check', () => {
    const s = { ...from('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), checks: [2, 0] as [number, number] };
    const agent = new ChessSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: 2 });
    expect(agent.selectAction(threeCheckEnv, s, 0, { rng: new Rng(1) })).toBe('a1a8');
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(threeCheckEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 8,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(threeCheckEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 8,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects forged check counts', () => {
    const cfg = THREE_CHECK_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyChessAction(VARIANT, m.round, 'e2e4') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, checks: [2, 0] } })).ok,
    ).toBe(false);
  });
});
