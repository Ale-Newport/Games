import { describe, expect, it } from 'vitest';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import { bestScore, categoryOf, omahaScore, score5 } from '../hands';

const S = (...r: number[]) => r.map((x) => c(SPADES, x));

describe('poker hands', () => {
  it('ranks every category in order', () => {
    const hands = [
      [c(SPADES, 2), c(HEARTS, 5), c(CLUBS, 9), c(DIAMONDS, 11), c(SPADES, 13)], // high card
      [c(SPADES, 2), c(HEARTS, 2), c(CLUBS, 9), c(DIAMONDS, 11), c(SPADES, 13)], // pair
      [c(SPADES, 2), c(HEARTS, 2), c(CLUBS, 9), c(DIAMONDS, 9), c(SPADES, 13)], // two pair
      [c(SPADES, 2), c(HEARTS, 2), c(CLUBS, 2), c(DIAMONDS, 9), c(SPADES, 13)], // trips
      [c(SPADES, 1), c(HEARTS, 2), c(CLUBS, 3), c(DIAMONDS, 4), c(SPADES, 5)], // wheel
      S(2, 6, 9, 11, 13), // flush
      [c(SPADES, 2), c(HEARTS, 2), c(CLUBS, 2), c(DIAMONDS, 9), c(SPADES, 9)], // full house
      [c(SPADES, 2), c(HEARTS, 2), c(CLUBS, 2), c(DIAMONDS, 2), c(SPADES, 9)], // quads
      S(9, 10, 11, 12, 13), // straight flush
    ];
    const scores = hands.map(score5);
    expect(scores.map(categoryOf)).toEqual([
      'high-card',
      'pair',
      'two-pair',
      'three-of-a-kind',
      'straight',
      'flush',
      'full-house',
      'four-of-a-kind',
      'straight-flush',
    ]);
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
  });

  it('breaks ties by kickers and treats the wheel as five high', () => {
    const kingKicker = score5([
      c(SPADES, 9),
      c(HEARTS, 9),
      c(CLUBS, 13),
      c(DIAMONDS, 4),
      c(SPADES, 2),
    ]);
    const queenKicker = score5([
      c(CLUBS, 9),
      c(DIAMONDS, 9),
      c(CLUBS, 12),
      c(HEARTS, 4),
      c(HEARTS, 2),
    ]);
    expect(kingKicker).toBeGreaterThan(queenKicker);
    const wheel = score5([c(SPADES, 1), c(HEARTS, 2), c(CLUBS, 3), c(DIAMONDS, 4), c(SPADES, 5)]);
    const six = score5([c(SPADES, 6), c(HEARTS, 2), c(CLUBS, 3), c(DIAMONDS, 4), c(SPADES, 5)]);
    expect(six).toBeGreaterThan(wheel);
    // Same hand in other suits ties.
    expect(score5(S(2, 6, 9, 11, 13))).toBe(score5([2, 6, 9, 11, 13].map((r) => c(HEARTS, r))));
  });

  it('finds the best five of seven, and plays Omaha with exactly two hole cards', () => {
    const seven = [
      c(SPADES, 1),
      c(SPADES, 13),
      c(SPADES, 12),
      c(SPADES, 11),
      c(SPADES, 10),
      c(HEARTS, 2),
      c(CLUBS, 3),
    ];
    expect(categoryOf(bestScore(seven))).toBe('straight-flush');
    // Four spades in hand and one on the board is no flush in Omaha.
    const hole = [c(SPADES, 2), c(SPADES, 5), c(SPADES, 9), c(SPADES, 12)];
    const board = [c(SPADES, 13), c(HEARTS, 3), c(CLUBS, 7), c(DIAMONDS, 8), c(HEARTS, 10)];
    expect(categoryOf(omahaScore(hole, board))).toBe('high-card');
    expect(categoryOf(bestScore([...hole, ...board]))).toBe('flush');
  });
});
