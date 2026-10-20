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
import { kothEnv } from '../ai-adapter';
import { KOTH_GAME } from '../Game';
import { VARIANT } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const at = (fen: string) => replayChess(VARIANT, fen, []);

describeAdapterContract(kothEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 3000,
  illegalActions: (s) =>
    ['e2e5', 'e1g1', 'O-O', 'a7a6', 'z9z9', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('King of the Hill integration', () => {
  it('wins as soon as a king lands on a center square', () => {
    for (const to of ['d4', 'e4']) {
      const s = applyChessAction(VARIANT, at('4k3/8/8/8/8/4K3/8/8 w - - 0 1'), `e3${to}`);
      expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'hill' });
    }
    const black = applyChessAction(VARIANT, at('8/8/3k4/8/8/8/8/4K3 b - - 0 1'), 'd6d5');
    expect(black.result).toEqual({ kind: 'win', winner: 1, reason: 'hill' });
    // A bare king against a bare king is not a dead draw here: both can still reach the hill.
    expect(applyChessAction(VARIANT, at('4k3/8/8/8/8/8/4K3/8 w - - 0 1'), 'e2e3').result).toBe(
      null,
    );
  });

  it('never lets the king step onto an attacked hill square', () => {
    // The rook on a4 covers d4 and e4.
    const legal = legalActions(VARIANT, at('4k3/8/8/8/r7/4K3/8/8 w - - 0 1'));
    expect(legal).not.toContain('e3d4');
    expect(legal).not.toContain('e3e4');
    expect(legal).toContain('e3d3');
  });

  it('still wins by checkmate', () => {
    let s = createChessState(VARIANT);
    for (const a of ['f2f3', 'e7e5', 'g2g4', 'd8h4']) s = applyChessAction(VARIANT, s, a);
    expect(s.result).toEqual({ kind: 'win', winner: 1, reason: 'checkmate' });
  });

  it('the engine races its king to the hill when nothing can stop it', () => {
    const agent = new ChessSearchAgent(VARIANT, { id: 't', label: 't', maxDepth: 3 });
    let s = at('k7/8/8/8/8/8/3K4/8 w - - 0 1');
    const rng = new Rng(2);
    for (let ply = 0; ply < 4 && !s.result; ply++) {
      const side = s.fen.split(' ')[1] === 'b' ? 1 : 0;
      s = applyChessAction(VARIANT, s, agent.selectAction(kothEnv, s, side, { rng }));
    }
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'hill' });
    expect(s.history.length).toBe(3);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(kothEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 6,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(kothEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 6,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves', () => {
    const cfg = KOTH_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyChessAction(VARIANT, m.round, 'e2e4') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(
      unwrap(spec, wrap(spec, { ...played, round: { ...played.round, result: null, san: [] } })).ok,
    ).toBe(false);
  });
});
