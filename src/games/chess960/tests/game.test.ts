import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import {
  applyChessAction,
  chess960Fen,
  chess960Number,
  createChessState,
  legalActions,
  replayChess,
} from '../../shared/chess/game';
import { defaultSetup, matchSaveSpec, newMatch, restartRound } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { chess960Env } from '../ai-adapter';
import { CHESS960_GAME } from '../Game';
import { VARIANT, castled, startNumber } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(chess960Env, {
  configs: [undefined],
  playouts: 10,
  maxSteps: 3000,
  illegalActions: (s) =>
    ['e2e5', 'O-O', 'O-O-O', 'a7a6', 'z9z9', ''].filter(
      (a) => !legalActions(VARIANT, s).includes(a),
    ),
});

describe('Chess960 integration', () => {
  it('reset(seed) picks start position seed mod 960 and every start is a legal setup', () => {
    expect(startNumber(chess960Env.reset(518))).toBe(518);
    expect(startNumber(chess960Env.reset(960 + 7))).toBe(7);
    for (let n = 0; n < 960; n += 37) {
      const back = chess960Fen(n).split(' ')[0]!.split('/')[7]!;
      const bishops = [...back].flatMap((c, i) => (c === 'B' ? [i % 2] : []));
      expect(bishops.sort()).toEqual([0, 1]);
      expect(back.indexOf('R')).toBeLessThan(back.indexOf('K'));
      expect(back.lastIndexOf('R')).toBeGreaterThan(back.indexOf('K'));
      // Black mirrors White; 16 pawn moves plus at least one move per knight.
      expect(chess960Fen(n).split('/')[0]).toBe(back.toLowerCase());
      expect(legalActions(VARIANT, createChessState(VARIANT, n)).length).toBeGreaterThanOrEqual(18);
    }
  });

  it('castles to the classical squares from a shuffled setup', () => {
    // King b1 with rooks a1 and h1 (Shredder castling letters H and A).
    const s = replayChess(VARIANT, '4k3/8/8/8/8/8/8/RK5R w HA - 0 1', []);
    expect(legalActions(VARIANT, s)).toEqual(expect.arrayContaining(['O-O', 'O-O-O', 'b1c1']));
    const long = applyChessAction(VARIANT, s, 'O-O-O');
    expect(long.fen.split(' ')[0]).toBe('4k3/8/8/8/8/8/8/2KR3R');
    expect(long.san).toEqual(['O-O-O']);
    const short = applyChessAction(VARIANT, s, 'O-O');
    expect(short.fen.split(' ')[0]).toBe('4k3/8/8/8/8/8/8/R4RK1');
    expect(castled(short, 0)).toBe(true);
    expect(castled(short, 1)).toBe(false);
  });

  it('restart keeps the start position; a new round draws a new one', () => {
    const cfg = CHESS960_GAME.match;
    const m = newMatch(cfg, defaultSetup(cfg));
    const n = startNumber(m.round);
    expect(n).toBeGreaterThanOrEqual(0);
    const moved = {
      ...m,
      round: applyChessAction(VARIANT, m.round, legalActions(VARIANT, m.round)[0]!),
    };
    expect(startNumber(restartRound(cfg, moved).round)).toBe(n);
    expect(restartRound(cfg, moved).round.history).toEqual([]);
  });

  it('easy beats random and medium beats easy (seeded)', () => {
    const easy = evaluateAgents(chess960Env, preset('easy'), preset('random'), {
      games: 4,
      seed: 11,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(chess960Env, preset('medium'), preset('easy'), {
      games: 4,
      seed: 11,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects a start that is not a Chess960 setup', () => {
    const cfg = CHESS960_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, m)))).ok).toBe(true);
    const odd = replayChess(VARIANT, '4k3/8/8/8/8/8/8/RK5R w HA - 0 1', []);
    expect(chess960Number(odd.startFen)).toBe(null);
    expect(unwrap(spec, wrap(spec, { ...m, round: odd })).ok).toBe(false);
  });
});
