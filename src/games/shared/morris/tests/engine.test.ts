import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  NINE_MENS,
  SIX_MENS,
  THREE_MENS,
  applyMorrisAction,
  createMorrisState,
  isValidMorrisState,
  legalMorrisActions,
  type MorrisState,
  type MorrisVariant,
} from '../engine';

const play = (v: MorrisVariant, moves: string[], s: MorrisState = createMorrisState(v)) =>
  moves.reduce((st, a) => applyMorrisAction(v, st, a), s);

describe('morris boards', () => {
  it('has the classic geometry', () => {
    expect(NINE_MENS.points).toHaveLength(24);
    expect(NINE_MENS.mills).toHaveLength(16);
    expect(NINE_MENS.edges).toHaveLength(32);
    expect(SIX_MENS.points).toHaveLength(16);
    expect(SIX_MENS.edges).toHaveLength(20);
    expect(THREE_MENS.edges).toHaveLength(16);
  });
});

describe('nine men’s morris', () => {
  const v = NINE_MENS;
  it('removes an opponent piece when a mill closes, but not one from a mill', () => {
    // White builds a7-d7-g7 while Black builds a1-d1 (not yet a mill) and b6.
    const s = play(v, ['a7', 'a1', 'd7', 'd1']);
    const closing = legalMorrisActions(v, s).filter((a) => a.startsWith('g7'));
    expect(closing.sort()).toEqual(['g7xa1', 'g7xd1']);
    const after = applyMorrisAction(v, s, 'g7xa1');
    expect(after.board[v.points.indexOf('a1')]).toBe(0);
    // Pieces in a mill are protected while the opponent has others: Black's a1-d1-g1 mill is
    // safe and only b4 can be taken when White closes a7-d7-g7.
    const t = play(v, ['a7', 'a1', 'd7', 'd1', 'b6', 'g1xb6', 'f6', 'b4']);
    expect(legalMorrisActions(v, t).filter((a) => a.startsWith('g7'))).toEqual(['g7xb4']);
  });

  it('moves along lines after placement and flies with three pieces', () => {
    // Eighteen placements with no mill for either side.
    const s = play(v, [
      'a7',
      'd7',
      'g7',
      'd6',
      'b6',
      'a4',
      'f6',
      'g4',
      'c4',
      'c5',
      'e4',
      'e3',
      'b2',
      'd2',
      'f2',
      'a1',
      'd1',
      'g1',
    ]);
    expect(s.inHand).toEqual([0, 0]);
    expect(s.toMove).toBe(0);
    const moves = legalMorrisActions(v, s);
    expect(moves.every((a) => a.includes('-'))).toBe(true);
    expect(moves).toEqual(expect.arrayContaining(['c4-c3', 'b6-b4', 'e4-e5']));
    // e4-f4 closes f6-f4-f2, so it only exists together with a removal.
    expect(moves).not.toContain('e4-f4');
    expect(moves.filter((a) => a.startsWith('e4-f4x'))).toHaveLength(9);
    expect(moves).not.toContain('c4-d5'); // not joined by a line
    expect(moves).not.toContain('b6-d6'); // occupied
    // With three pieces left a player may fly to any empty point.
    const flying: MorrisState = {
      ...s,
      board: v.points.map((p) =>
        ['a7', 'g7', 'a1'].includes(p) ? 1 : ['d6', 'd2', 'g4', 'c5'].includes(p) ? 2 : 0,
      ),
      result: null,
    };
    expect(legalMorrisActions(v, flying).filter((a) => a.startsWith('a7-'))).toHaveLength(17);
  });

  it('wins when the opponent is left with two pieces or cannot move', () => {
    // A tiny endgame: Black has three pieces; White closes a mill and removes one.
    const s: MorrisState = {
      board: v.points.map((p) =>
        ['a7', 'd7', 'g4'].includes(p) ? 1 : ['b2', 'd2', 'f2'].includes(p) ? 2 : 0,
      ),
      toMove: 0,
      inHand: [0, 0],
      history: [],
      keys: ['x'],
      quiet: 0,
      result: null,
    };
    // g4-g7 closes a7-d7-g7; every black piece is in a mill (b2-d2-f2), so any may go.
    expect(
      legalMorrisActions(v, s)
        .filter((a) => a.startsWith('g4-g7'))
        .sort(),
    ).toEqual(['g4-g7xb2', 'g4-g7xd2', 'g4-g7xf2']);
    expect(applyMorrisAction(v, s, 'g4-g7xd2').result).toEqual({
      kind: 'win',
      winner: 0,
      reason: 'two-pieces',
    });
  });

  it('plays random games that end and validate by replay', () => {
    const rng = new Rng(13);
    for (const variant of [NINE_MENS, SIX_MENS, THREE_MENS]) {
      for (let g = 0; g < 15; g++) {
        let s = createMorrisState(variant);
        while (!s.result)
          s = applyMorrisAction(variant, s, rng.pick(legalMorrisActions(variant, s)));
        expect(isValidMorrisState(variant, JSON.parse(JSON.stringify(s)))).toBe(true);
        expect(isValidMorrisState(variant, { ...s, quiet: s.quiet + 1 })).toBe(false);
      }
    }
  });
});

describe('three men’s morris', () => {
  it('wins with a row or column, but not with a diagonal', () => {
    const v = THREE_MENS;
    expect(play(v, ['a1', 'a2', 'b1', 'b2', 'c1']).result).toEqual({
      kind: 'win',
      winner: 0,
      reason: 'mill',
    });
    const diag = play(v, ['a1', 'a2', 'b2', 'c2', 'c3']);
    expect(diag.result).toBe(null);
    // After placement pieces slide along the lines, diagonals included.
    expect(legalMorrisActions(v, play(v, ['a3'], diag))).toEqual(expect.arrayContaining(['b2-b3']));
  });
});
