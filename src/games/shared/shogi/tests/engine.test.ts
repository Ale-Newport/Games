import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  applyShogiAction,
  createShogiState,
  isValidShogiState,
  legalActions,
  positionOf,
  type ShogiState,
} from '../game';
import { formatHands, formatPlacement, parsePlacement, type Owner } from '../position';
import { ANIMAL, SHOGI, type ShogiVariant } from '../variants';

/** State from a placement (rank a first), side to move and hands, with no history. */
function at(v: ShogiVariant, placement: string, side: Owner = 0, hands = '-'): ShogiState {
  const pos = parsePlacement(v, placement, side, hands);
  return {
    board: Array.from(pos.board),
    hands: [Array.from(pos.hands[0]), Array.from(pos.hands[1])],
    toMove: side,
    history: [],
    notation: [],
    keys: [pos.key()],
    checks: [],
    result: null,
  };
}
const play = (v: ShogiVariant, s: ShogiState, moves: string[]) =>
  moves.reduce((st, a) => applyShogiAction(v, st, a), s);

describe('shogi move generation', () => {
  it('matches the published perft counts from the start position', () => {
    const pos = parsePlacement(SHOGI, SHOGI.start);
    expect([1, 2, 3, 4].map((d) => pos.perft(d))).toEqual([30, 900, 25470, 719731]);
    expect(formatPlacement(pos)).toBe(SHOGI.start);
  });

  it('round-trips placements and hands', () => {
    const pos = parsePlacement(
      SHOGI,
      'lnsgk2nl/1r4gs1/p1pppp1pp/6p2/1p7/2P6/PPBPPPPPP/7R1/LNSGKGSNL',
      1,
      'Bb2P',
    );
    expect(formatPlacement(pos)).toBe(
      'lnsgk2nl/1r4gs1/p1pppp1pp/6p2/1p7/2P6/PPBPPPPPP/7R1/LNSGKGSNL',
    );
    expect(formatHands(pos)).toBe('B2Pb');
  });

  it('forbids two unpromoted pawns on a file and dead drops', () => {
    const s = at(SHOGI, '4k4/9/9/9/9/9/4P4/9/4K4', 0, 'PLN');
    const drops = legalActions(SHOGI, s).filter((a) => a.includes('*'));
    expect(drops).not.toContain('P*5e'); // the 5-file already has a sente pawn
    expect(drops).toContain('P*4e');
    expect(drops.filter((a) => a.startsWith('P*') && a.endsWith('a'))).toEqual([]); // last rank
    expect(drops.filter((a) => a.startsWith('L*') && a.endsWith('a'))).toEqual([]);
    expect(drops.filter((a) => a.startsWith('N*') && /[ab]$/.test(a))).toEqual([]);
    expect(drops).toContain('N*4c');
  });

  it('forbids checkmate by a pawn drop but allows it with another piece', () => {
    // Gote king 1a; rook on 2e covers 2a/2b, gold on 1c guards 1b.
    const s = at(SHOGI, '8k/9/8G/9/7R1/9/9/9/K8', 0, 'PG');
    const legal = legalActions(SHOGI, s);
    expect(legal).not.toContain('P*1b');
    expect(legal).toContain('G*1b');
    expect(applyShogiAction(SHOGI, s, 'G*1b').result).toEqual({
      kind: 'win',
      winner: 0,
      reason: 'checkmate',
    });
  });

  it('makes promotion compulsory only for pieces that would be stuck', () => {
    const s = at(SHOGI, '4k4/P8/2S6/9/9/9/9/9/4K4', 0);
    const legal = legalActions(SHOGI, s);
    expect(legal).toContain('9b9a+');
    expect(legal).not.toContain('9b9a');
    expect(legal).toEqual(expect.arrayContaining(['7c7b+', '7c7b'])); // silver may decline
    const knight = at(SHOGI, '4k4/9/9/N8/9/9/9/9/4K4', 0);
    expect(legalActions(SHOGI, knight).filter((a) => a.startsWith('9d'))).toEqual(['9d8b+']);
  });

  it('never leaves the own king in check', () => {
    // The gote rook on 5a pins the sente gold on 5h to the king on 5i.
    const s = at(SHOGI, '4r3k/9/9/9/9/9/9/4G4/4K4', 0);
    const legal = legalActions(SHOGI, s);
    expect(legal.filter((a) => a.startsWith('5h'))).toEqual(['5h5g']);
  });
});

describe('shogi game results and notation', () => {
  it('writes Western notation with captures, promotions and declined promotions', () => {
    const s = play(SHOGI, createShogiState(SHOGI), ['7g7f', '3c3d', '8h2b+', '3a2b']);
    expect(s.notation).toEqual(['P-7f', 'P-3d', 'Bx2b+', 'Sx2b']);
    const declined = applyShogiAction(SHOGI, at(SHOGI, '4k4/9/2S6/9/9/9/9/9/4K4'), '7c7b');
    expect(declined.notation).toEqual(['S-7b=']);
    const drop = applyShogiAction(SHOGI, at(SHOGI, '4k4/9/9/9/9/9/9/9/4K4', 0, 'P'), 'P*5e');
    expect(drop.notation).toEqual(['P*5e']);
  });

  it('draws by fourfold repetition and makes perpetual check lose', () => {
    const quiet = at(SHOGI, '8k/9/9/9/9/9/9/9/K8', 0);
    const cycle = ['9i9h', '1a1b', '9h9i', '1b1a'];
    let s = quiet;
    for (let i = 0; i < 3 && !s.result; i++) s = play(SHOGI, s, cycle);
    expect(s.result).toEqual({ kind: 'draw', reason: 'repetition' });
    expect(s.history).toHaveLength(12);

    const checking = at(SHOGI, '8k/9/9/9/7R1/9/9/9/K8', 0);
    const checks = ['2e1e', '1a2a', '1e2e', '2a1a'];
    let c = checking;
    for (let i = 0; i < 3 && !c.result; i++) c = play(SHOGI, c, checks);
    expect(c.checks.filter((x, i) => i % 2 === 0 && x)).toHaveLength(6);
    expect(c.result).toEqual({ kind: 'win', winner: 1, reason: 'perpetual-check' });
  });

  it('plays random games that end and validate by replay', () => {
    const rng = new Rng(5);
    for (let g = 0; g < 3; g++) {
      let s = createShogiState(SHOGI);
      while (!s.result) s = applyShogiAction(SHOGI, s, rng.pick(legalActions(SHOGI, s)));
      expect(s.history.length).toBeLessThanOrEqual(SHOGI.maxPlies);
      expect(isValidShogiState(SHOGI, JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(isValidShogiState(SHOGI, { ...s, toMove: 1 - s.toMove })).toBe(false);
    }
  }, 60_000);
});

describe('animal shogi', () => {
  it('starts with four moves and promotes the chick on the far row', () => {
    const s = createShogiState(ANIMAL);
    expect(legalActions(ANIMAL, s).sort()).toEqual(['1d1c', '2c2b', '2d1c', '2d3c'].sort());
    const chick = at(ANIMAL, '2l/C2/3/2L', 0);
    expect(legalActions(ANIMAL, chick).filter((a) => a.startsWith('3b'))).toEqual(['3b3a+']);
  });

  it('wins by capturing the lion', () => {
    const s = applyShogiAction(ANIMAL, at(ANIMAL, '1l1/1G1/3/2L', 0), '2b2a');
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'capture' });
  });

  it('wins by a safe try, and the try only counts if the lion survives', () => {
    const safe = applyShogiAction(ANIMAL, at(ANIMAL, 'l2/2L/3/3', 0), '1b1a');
    expect(safe.result).toEqual({ kind: 'win', winner: 0, reason: 'try' });
    // The gote elephant on 2b covers 1a: no win yet; capturing wins for gote, anything else
    // lets the try succeed.
    const risky = applyShogiAction(ANIMAL, at(ANIMAL, 'l2/1eL/3/3', 0), '1b1a');
    expect(risky.result).toBe(null);
    expect(applyShogiAction(ANIMAL, risky, '2b1a').result).toEqual({
      kind: 'win',
      winner: 1,
      reason: 'capture',
    });
    expect(applyShogiAction(ANIMAL, risky, '3a3b').result).toEqual({
      kind: 'win',
      winner: 0,
      reason: 'try',
    });
  });

  it('lets a captured chick be dropped anywhere, even on the far row', () => {
    const s = at(ANIMAL, 'l2/3/3/2L', 0, 'C');
    const drops = legalActions(ANIMAL, s).filter((a) => a.startsWith('C*'));
    expect(drops).toContain('C*2a');
    expect(drops).toHaveLength(10);
    expect(positionOf(ANIMAL, s).hands[0][4]).toBe(1);
  });
});
