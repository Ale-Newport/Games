import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  PASS,
  applyJanggiAction,
  createJanggiState,
  isValidJanggiState,
  janggiLegalActions,
  janggiPlacement,
} from '../janggi';

const state = (placement: string) => createJanggiState(placement);
const movesFrom = (placement: string, from: string) =>
  janggiLegalActions(state(placement))
    .filter((a) => a.startsWith(from))
    .map((a) => a.slice(2))
    .sort();
const play = (placement: string, moves: string[]) =>
  moves.reduce((s, a) => applyJanggiAction(s, a), state(placement));

describe('janggi moves', () => {
  it('has 31 moves plus a pass from the EHEH/EHEH start', () => {
    const s = state(janggiPlacement('EHEH', 'EHEH'));
    expect(s.startPlacement).toBe(
      'rnba1anbr/4k4/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/4K4/RBNA1ABNR',
    );
    const actions = janggiLegalActions(s);
    expect(actions).toHaveLength(32);
    expect(actions).toContain(PASS);
    expect(actions.filter((a) => a.startsWith('e1')).sort()).toEqual(
      ['e1d1', 'e1d2', 'e1e0', 'e1e2', 'e1f1', 'e1f2'].sort(),
    );
    expect(actions.some((a) => a.startsWith('b2') || a.startsWith('h2'))).toBe(false); // cannons
  });

  it('cannons need a non-cannon screen and never capture cannons', () => {
    expect(movesFrom('r3k4/9/9/9/9/9/P8/9/4K4/C8', 'a0')).toEqual([
      'a4',
      'a5',
      'a6',
      'a7',
      'a8',
      'a9',
    ]);
    expect(movesFrom('c3k4/9/9/9/9/9/P8/9/4K4/C8', 'a0')).toEqual(['a4', 'a5', 'a6', 'a7', 'a8']);
    expect(movesFrom('r3k4/9/9/9/9/9/C8/9/4K4/C8', 'a0')).toEqual([]);
  });

  it('moves the long elephant, blocked by any point on its path', () => {
    expect(movesFrom('4k4/9/9/9/9/9/9/3P5/9/2B2K3', 'c0')).toEqual(['a3', 'f2']);
  });

  it('uses the palace diagonals for chariots and for soldiers in the enemy palace', () => {
    expect(movesFrom('4k4/9/9/9/9/9/9/9/9/3R1K3', 'd0')).toEqual(
      expect.arrayContaining(['e1', 'f2']),
    );
    expect(movesFrom('4k4/9/3P5/9/9/9/9/9/3K5/9', 'd7')).toEqual(['c7', 'd8', 'e7', 'e8']);
  });
});

describe('janggi results', () => {
  it('detects checkmate', () => {
    const s = play('4k4/R8/9/9/9/9/9/9/3K5/1R7', ['b0b9']);
    expect(s.result).toEqual({ kind: 'win', winner: 0, reason: 'checkmate' });
  });

  it('forbids passing in check, and two passes end the game on points', () => {
    const check = state('4k4/9/9/9/9/9/9/9/9/3r1K3'); // the Han chariot on d0 checks along the rank;
    expect(janggiLegalActions(check)).not.toContain(PASS);
    const passes = play(janggiPlacement('EHEH', 'EHEH'), [PASS, PASS]);
    expect(passes.result).toEqual({ kind: 'win', winner: 1, reason: 'points', points: [72, 73.5] });
  });

  it('ends a bikjang left standing on points', () => {
    const s = play('4k4/9/9/p8/9/9/8P/9/3K5/9', ['d1e1', 'a6a5']);
    expect(s.result).toEqual({ kind: 'win', winner: 1, reason: 'points', points: [2, 3.5] });
  });

  it('plays random games that end and validate by replay', () => {
    const rng = new Rng(4);
    for (let g = 0; g < 4; g++) {
      let s = state(janggiPlacement('HEEH', 'EHHE'));
      while (!s.result) s = applyJanggiAction(s, rng.pick(janggiLegalActions(s)));
      expect(isValidJanggiState(JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(isValidJanggiState({ ...s, startPlacement: '9/9/9/9/9/9/9/9/9/9' })).toBe(false);
    }
  }, 60_000);
});
