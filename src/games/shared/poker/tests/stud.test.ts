import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import {
  STUD,
  applyPokerAction,
  createPoker,
  isUpCard,
  isValidPokerState,
  legalPokerActions,
  raiseRange,
  replayPoker,
  upScore,
  type PokerState,
} from '../engine';
import { maskPoker, UNKNOWN } from '../environment';

const play = (s: PokerState, ...actions: string[]) =>
  actions.reduce((x, a) => applyPokerAction(x, a), s);

describe('seven card stud', () => {
  it('takes antes, deals two down and one up, and brings it in from the lowest up card', () => {
    const s = createPoker(STUD, 3, 4);
    expect(s.street).toBe('third');
    expect(s.seats.every((x) => x.hole.length === 3)).toBe(true);
    // Ante 2 each, plus a bring-in of 10 from one seat.
    expect(s.seats.reduce((a, x) => a + x.total, 0)).toBe(4 * 2 + 10);
    const bringIn = s.seats.findIndex((x) => x.bet === 10);
    const low = s.seats
      .map((x, i) => ({ i, up: x.hole[2]! }))
      .sort((a, b) => {
        const v = (card: number) => ((card % 13) + 12) % 13; // ace high
        return v(a.up) - v(b.up) || Math.floor(b.up / 13) - Math.floor(a.up / 13);
      })[0]!.i;
    expect(bringIn).toBe(low);
    expect(s.toAct).toBe((bringIn + 1) % 4);
    // The next player may call the bring-in or complete to a full small bet.
    expect(legalPokerActions(s)).toEqual(['fold', 'call', 'raise:20']);
  });

  it('completes, raises by small bets, then doubles the bet on fifth street', () => {
    let s = createPoker(STUD, 3, 3);
    s = play(s, 'raise:20');
    expect(raiseRange(s)).toEqual([40, 40]);
    // Calls all round: fourth street, one more up card each.
    while (s.street === 'third')
      s = play(s, legalPokerActions(s).includes('call') ? 'call' : 'check');
    expect(s.street).toBe('fourth');
    expect(s.seats.every((x) => x.hole.length === 4)).toBe(true);
    expect(raiseRange(s)).toEqual([20, 20]);
    while (s.street === 'fourth') s = play(s, 'check');
    expect(s.street).toBe('fifth');
    expect(raiseRange(s)).toEqual([40, 40]);
  });

  it('lets the best showing hand open later streets', () => {
    expect(upScore([c(SPADES, 9), c(HEARTS, 9)])).toBeGreaterThan(
      upScore([c(SPADES, 1), c(HEARTS, 13)]),
    );
    expect(upScore([c(SPADES, 1), c(HEARTS, 4)])).toBeGreaterThan(
      upScore([c(SPADES, 13), c(HEARTS, 12)]),
    );
    // Seat 2 pairs its up card on fourth street: it opens the betting.
    let s = createPoker(STUD, 5, 3);
    s.seats[0]!.hole[2] = c(SPADES, 2);
    s.seats[1]!.hole[2] = c(HEARTS, 13);
    s.seats[2]!.hole[2] = c(CLUBS, 6);
    s.deck.splice(s.dealt, 3, c(HEARTS, 3), c(CLUBS, 9), c(DIAMONDS, 6));
    while (s.street === 'third')
      s = play(s, legalPokerActions(s).includes('call') ? 'call' : 'check');
    expect(s.street).toBe('fourth');
    expect(s.seats[2]!.hole[3]).toBe(c(DIAMONDS, 6));
    expect(s.toAct).toBe(2);
  });

  it('shows up cards to everyone and hides the down cards', () => {
    const s = createPoker(STUD, 7, 3);
    const view = maskPoker(s, 0);
    expect(
      view.seats[1]!.hole.map((h, k) => (isUpCard(k) ? h !== UNKNOWN : h === UNKNOWN)),
    ).toEqual([true, true, true]);
    expect(view.seats[0]!.hole).toEqual(s.seats[0]!.hole);
  });

  it('deals seven cards by the showdown and replays random tournaments', () => {
    const rng = new Rng(8);
    let s = createPoker(STUD, 9, 5);
    let showdowns = 0;
    for (let k = 0; k < 4000 && s.champion === null; k++) {
      s = applyPokerAction(s, rng.pick(legalPokerActions(s)));
      if (s.street === 'done' && s.result!.shown.length) {
        showdowns++;
        for (const i of s.result!.shown) expect(s.seats[i]!.hole).toHaveLength(7);
        expect(s.seats.reduce((a, x) => a + x.stack, 0)).toBe(7500);
      }
    }
    expect(showdowns).toBeGreaterThan(0);
    expect(replayPoker(STUD, 9, 5, 1500, s.history)).toEqual(s);
    expect(isValidPokerState(STUD, JSON.parse(JSON.stringify(s)))).toBe(true);
  });
});
