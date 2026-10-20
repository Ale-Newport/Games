import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import { parseFen } from '../fen';
import {
  applyChessAction,
  chess960BackRank,
  createChessState,
  insufficientMaterial,
  isValidChessState,
  legalActions,
  replayChess,
  type ChessState,
  type ChessVariant,
} from '../game';
import { ANTICHESS, CHESS960, GARDNER, KING_OF_THE_HILL, STANDARD, THREE_CHECK } from '../variants';

const play = (v: ChessVariant, moves: string[], s: ChessState = createChessState(v)) =>
  moves.reduce((st, m) => applyChessAction(v, st, m), s);
const from = (v: ChessVariant, fen: string, moves: string[] = []) => replayChess(v, fen, moves);

describe('standard chess rules', () => {
  it('detects checkmate (fool’s mate) with SAN and a result', () => {
    const s = play(STANDARD, ['f2f3', 'e7e5', 'g2g4', 'd8h4']);
    expect(s.san).toEqual(['f3', 'e5', 'g4', 'Qh4#']);
    expect(s.result).toEqual({ kind: 'win', winner: 1, reason: 'checkmate' });
    expect(legalActions(STANDARD, s)).toEqual([]);
    expect(() => applyChessAction(STANDARD, s, 'e2e4')).toThrow();
  });

  it('detects stalemate', () => {
    // Qc7 leaves the a8 king with no move and no check: stalemate. Qb5 does not.
    expect(from(STANDARD, 'k7/8/1Q6/8/8/8/8/7K w - - 0 1', ['b6c7']).result).toEqual({
      kind: 'draw',
      reason: 'stalemate',
    });
    expect(from(STANDARD, 'k7/8/1Q6/8/8/8/8/7K w - - 0 1', ['b6b5']).result).toBeNull();
    expect(from(STANDARD, '7k/8/6Q1/8/8/8/8/K7 w - - 0 1', ['g6f7']).result).toEqual({
      kind: 'draw',
      reason: 'stalemate',
    });
  });

  it('castles both ways with SAN and moves the rook', () => {
    const s = from(STANDARD, 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', ['O-O', 'O-O-O']);
    expect(s.san).toEqual(['O-O', 'O-O-O']);
    expect(s.fen.split(' ')[0]).toBe('2kr3r/8/8/8/8/8/8/R4RK1');
    // Castling through an attacked square is illegal.
    const attacked = from(
      STANDARD,
      'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'.replace('8/8/8/8/8/8/R3K2R', '8/8/8/8/8/5r2/R3K2R'),
    );
    expect(legalActions(STANDARD, attacked)).not.toContain('O-O');
    expect(legalActions(STANDARD, attacked)).toContain('O-O-O');
  });

  it('captures en passant and promotes with SAN', () => {
    const ep = play(STANDARD, ['e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6']);
    expect(ep.san[4]).toBe('exd6');
    expect(ep.fen.split(' ')[0]).toBe('rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR');
    const promo = from(STANDARD, '8/P6k/8/8/8/8/8/K7 w - - 0 1');
    expect(
      legalActions(STANDARD, promo)
        .filter((a) => a.startsWith('a7a8'))
        .sort(),
    ).toEqual(['a7a8b', 'a7a8n', 'a7a8q', 'a7a8r']);
    expect(applyChessAction(STANDARD, promo, 'a7a8q').san.at(-1)).toBe('a8=Q');
  });

  it('disambiguates SAN', () => {
    const s = from(STANDARD, '7k/8/8/8/8/8/8/R3R2K w - - 0 1', ['a1c1']);
    expect(s.san).toEqual(['Rac1']);
  });

  it('draws by threefold repetition, the fifty-move rule and insufficient material', () => {
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'];
    const rep = play(STANDARD, shuffle);
    expect(rep.result).toEqual({ kind: 'draw', reason: 'repetition' });
    const fifty = from(STANDARD, '7k/8/8/8/8/8/8/R6K w - - 99 80', ['a1a2']);
    expect(fifty.result).toEqual({ kind: 'draw', reason: 'fifty-move' });
    const bare = from(STANDARD, '7k/8/8/8/8/8/8/r6K w - - 0 1', ['h1g2', 'a1a2', 'g2f3']);
    expect(bare.result).toBeNull();
    const kxk = from(STANDARD, '7k/8/8/8/8/8/1r6/K7 w - - 0 1', ['a1b2']);
    expect(kxk.result).toEqual({ kind: 'draw', reason: 'insufficient-material' });
    expect(insufficientMaterial(parseFen(STANDARD.rules, '7k/8/8/8/8/8/8/KB6 w - - 0 1'))).toBe(
      true,
    );
    // Same-colored bishops (g8 and b1 are both light): dead. Opposite colors (f8 dark): not dead.
    expect(insufficientMaterial(parseFen(STANDARD.rules, '6bk/8/8/8/8/8/8/KB6 w - - 0 1'))).toBe(
      true,
    );
    expect(insufficientMaterial(parseFen(STANDARD.rules, '5b1k/8/8/8/8/8/8/KB6 w - - 0 1'))).toBe(
      false,
    );
    expect(insufficientMaterial(parseFen(STANDARD.rules, '7k/8/8/8/8/8/8/KNN5 w - - 0 1'))).toBe(
      false,
    );
  });
});

describe('variants', () => {
  it('Chess960 numbering: #518 is the classical setup and all 960 are valid', () => {
    expect(chess960BackRank(518)).toBe('RNBQKBNR');
    const seen = new Set<string>();
    for (let n = 0; n < 960; n++) {
      const r = chess960BackRank(n);
      seen.add(r);
      const bishops = [...r].flatMap((c, i) => (c === 'B' ? [i] : []));
      expect(bishops[0]! % 2).not.toBe(bishops[1]! % 2);
      const k = r.indexOf('K');
      expect(r.indexOf('R')).toBeLessThan(k);
      expect(r.lastIndexOf('R')).toBeGreaterThan(k);
    }
    expect(seen.size).toBe(960);
    const s = createChessState(CHESS960, 7);
    expect(legalActions(CHESS960, s).length).toBeGreaterThan(15);
  });

  it('Antichess: captures are compulsory, the king can be captured, and running out of moves wins', () => {
    const s = play(ANTICHESS, ['e2e3', 'b7b5']);
    expect(legalActions(ANTICHESS, s)).toEqual(['f1b5']);
    const last = from(ANTICHESS, '8/8/8/8/8/8/1p6/8 b - - 0 1');
    const won = applyChessAction(
      ANTICHESS,
      from(ANTICHESS, '8/8/8/8/8/8/p7/1R6 b - - 0 1'),
      'a2b1q',
    );
    expect(won.result).toEqual({ kind: 'win', winner: 0, reason: 'no-pieces-or-moves' });
    expect(legalActions(ANTICHESS, last).some((a) => a.endsWith('k'))).toBe(true);
  });

  it('King of the Hill: a king reaching a center square wins', () => {
    const s = from(KING_OF_THE_HILL, '7k/8/8/8/8/4K3/8/8 w - - 0 1', ['e3e4']);
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'hill' });
  });

  it('Three-check: the third check wins', () => {
    const s = from(THREE_CHECK, '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', [
      'a1a8',
      'e8e7',
      'a8a7',
      'e7e6',
      'a7a6',
    ]);
    expect(s.checks).toEqual([3, 0]);
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'three-check' });
  });

  it('Gardner minichess: 5×5 start with 7 opening moves and no double pushes', () => {
    const s = createChessState(GARDNER);
    expect(legalActions(GARDNER, s).sort()).toEqual(
      ['a2a3', 'b1a3', 'b1c3', 'b2b3', 'c2c3', 'd2d3', 'e2e3'].sort(),
    );
  });

  it('random games in every variant end and replay identically (randomized)', () => {
    for (const v of [STANDARD, CHESS960, ANTICHESS, KING_OF_THE_HILL, THREE_CHECK, GARDNER]) {
      const rng = new Rng(3);
      for (let g = 0; g < 6; g++) {
        let s = createChessState(v, g * 97);
        while (!s.result && s.history.length < 600)
          s = applyChessAction(v, s, rng.pick(legalActions(v, s)));
        expect(isValidChessState(v, JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
  }, 60_000);
});
