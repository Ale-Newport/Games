import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { chooseCrib, choosePlay, cribWorth, levelAction } from '../ai';
import { cribbageEnv } from '../ai-adapter';
import {
  applyCribbageAction,
  countOf,
  createCribbage,
  isValidCribbageState,
  legalCribbageActions,
  playable,
  replayCribbage,
} from '../engine';
import { pegPoints, scoreShow } from '../scoring';

describe('Cribbage scoring', () => {
  it('counts the perfect 29 hand', () => {
    const hand = [c(HEARTS, 5), c(DIAMONDS, 5), c(CLUBS, 5), c(SPADES, 11)];
    const show = scoreShow(hand, c(SPADES, 5));
    expect(show).toEqual({ fifteens: 16, pairs: 12, runs: 0, flush: 0, nobs: 1, total: 29 });
  });

  it('counts double runs, flushes and crib flushes', () => {
    // 4-5-5-6 with a 7 starter: runs 4·2 = 8, pair 2, fifteens 4+5+6, 4+5+6, 5+5... = 6 points.
    const double = scoreShow(
      [c(HEARTS, 4), c(HEARTS, 5), c(SPADES, 5), c(CLUBS, 6)],
      c(DIAMONDS, 7),
    );
    expect(double.runs).toBe(8);
    expect(double.pairs).toBe(2);
    const flush = [c(HEARTS, 2), c(HEARTS, 4), c(HEARTS, 9), c(HEARTS, 12)];
    expect(scoreShow(flush, c(SPADES, 13)).flush).toBe(4);
    expect(scoreShow(flush, c(HEARTS, 13)).flush).toBe(5);
    expect(scoreShow(flush, c(SPADES, 13), true).flush).toBe(0);
    expect(scoreShow(flush, c(HEARTS, 13), true).flush).toBe(5);
  });

  it('pegs fifteens, 31, pairs and runs in any order', () => {
    expect(pegPoints([c(HEARTS, 7), c(SPADES, 8)])).toBe(2);
    expect(pegPoints([c(HEARTS, 10), c(SPADES, 12), c(CLUBS, 1), c(DIAMONDS, 10)])).toBe(2);
    expect(pegPoints([c(HEARTS, 10), c(SPADES, 1), c(CLUBS, 10), c(DIAMONDS, 10)])).toBe(2 + 2);
    expect(pegPoints([c(HEARTS, 4), c(SPADES, 4), c(CLUBS, 4)])).toBe(6);
    expect(pegPoints([c(HEARTS, 3), c(SPADES, 5), c(CLUBS, 4)])).toBe(3);
    expect(pegPoints([c(HEARTS, 3), c(SPADES, 5), c(CLUBS, 4), c(CLUBS, 6)])).toBe(4);
    expect(pegPoints([c(HEARTS, 3), c(SPADES, 5), c(CLUBS, 9)])).toBe(0);
  });
});

describe('Cribbage rules', () => {
  it('builds the crib, cuts the starter and pegs to the show', () => {
    let s = createCribbage(1);
    expect(s.hands.map((h) => h.length)).toEqual([6, 6]);
    expect(s.toAct).toBe(0); // the non-dealer throws and leads first
    expect(legalCribbageActions(s)).toHaveLength(15);
    s = applyCribbageAction(s, legalCribbageActions(s)[0]!);
    s = applyCribbageAction(s, legalCribbageActions(s)[0]!);
    expect(s.crib).toHaveLength(4);
    expect(s.starter).not.toBeNull();
    expect(s.phase).toBe('peg');
    while (s.phase === 'peg') {
      for (const a of legalCribbageActions(s))
        expect(countOf(s.pile) + Math.min(10, (Number(a.slice(5)) % 13) + 1)).toBeLessThanOrEqual(
          31,
        );
      s = applyCribbageAction(s, levelAction(s, 'medium'));
    }
    expect(['show', 'done']).toContain(s.phase);
    expect(s.played).toHaveLength(8);
    if (s.show) expect(s.show.crib.total).toBe(scoreShow(s.crib, s.starter!, true).total);
  });

  it('plays a game to 121, alternating the deal, and replays it', () => {
    let s = createCribbage(2);
    for (let k = 0; k < 4000 && s.winner === null; k++)
      s = applyCribbageAction(s, levelAction(s, 'medium'));
    expect(s.winner).not.toBeNull();
    expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(121);
    expect(s.handNo).toBeGreaterThan(3);
    expect(replayCribbage(2, s.history)).toEqual(s);
    expect(isValidCribbageState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidCribbageState({ ...s, scores: [0, 0] })).toBe(false);
  });
});

describe('Cribbage opponents', () => {
  it('throws its own crib fives and keeps scoring cards', () => {
    const s = createCribbage(3);
    s.toAct = s.dealer;
    s.hands[s.dealer] = [
      c(HEARTS, 5),
      c(SPADES, 5),
      c(CLUBS, 10),
      c(DIAMONDS, 11),
      c(HEARTS, 1),
      c(CLUBS, 2),
    ];
    const hard = chooseCrib(s, 'hard');
    expect(hard.startsWith('crib:')).toBe(true);
    expect(cribWorth(c(HEARTS, 5), c(SPADES, 5))).toBeGreaterThan(
      cribWorth(c(HEARTS, 1), c(CLUBS, 2)),
    );
  });

  it('pegs the fifteen and avoids leaving 21', () => {
    let s = createCribbage(4);
    s = applyCribbageAction(s, legalCribbageActions(s)[0]!);
    s = applyCribbageAction(s, legalCribbageActions(s)[0]!);
    s = structuredClone(s);
    s.pile = [{ seat: 1, card: c(SPADES, 8) }];
    s.hands[s.toAct] = [c(HEARTS, 7), c(CLUBS, 4), c(DIAMONDS, 13)];
    expect(choosePlay(s, 'medium')).toBe(c(HEARTS, 7));
    expect(playable(s)).toHaveLength(3);
  });
});

describeAdapterContract(cribbageEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 40,
  illegalActions: (s) =>
    ['play:99', 'crib:1.1', 'x'].filter((a) => !legalCribbageActions(s).includes(a)),
});
