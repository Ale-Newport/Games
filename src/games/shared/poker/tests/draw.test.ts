import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import {
  DRAW,
  applyPokerAction,
  createPoker,
  drawOptions,
  isValidPokerState,
  legalPokerActions,
  raiseRange,
  replayPoker,
  type PokerState,
} from '../engine';

const play = (s: PokerState, ...actions: string[]) =>
  actions.reduce((x, a) => applyPokerAction(x, a), s);

describe('five-card draw', () => {
  it('deals five cards and bets one big blind at a time before the draw', () => {
    const s = createPoker(DRAW, 1, 3);
    expect(s.seats.every((x) => x.hole.length === 5)).toBe(true);
    expect(legalPokerActions(s)).toEqual(['fold', 'call', 'raise:40']);
    // Four bets at most: the blind, then three raises.
    const capped = play(s, 'raise:40', 'raise:60', 'raise:80');
    expect(capped.bets).toBe(4);
    expect(legalPokerActions(capped)).toEqual(['fold', 'call']);
  });

  it('lets everyone still in draw up to three cards, then bets two big blinds', () => {
    let s = createPoker(DRAW, 2, 3);
    s = play(s, 'call', 'call', 'check');
    expect(s.street).toBe('draw');
    expect(s.toAct).toBe(1); // left of the button
    expect(drawOptions(5)).toHaveLength(26);
    expect(legalPokerActions(s)).toEqual(drawOptions(5));
    expect(() => play(s, 'draw:0123')).toThrow();
    expect(() => play(s, 'draw:20')).toThrow();
    const before = s.seats[1]!.hole.slice();
    s = play(s, 'draw:02');
    expect(s.seats[1]!.drew).toBe(2);
    expect(s.seats[1]!.hole[1]).toBe(before[1]);
    expect(s.seats[1]!.hole[0]).not.toBe(before[0]);
    s = play(s, 'draw:', 'draw:4');
    expect(s.street).toBe('final');
    expect(s.seats.map((x) => x.drew)).toEqual([1, 2, 0]);
    expect(raiseRange(s)).toEqual([40, 40]);
    s = play(s, 'raise:40', 'call', 'fold');
    expect(s.street).toBe('done');
    expect(s.result!.shown).toEqual([1, 2]);
    expect(s.seats.reduce((a, x) => a + x.stack, 0)).toBe(4500);
  });

  it('still lets an all-in player draw before the showdown', () => {
    const s = createPoker(DRAW, 3, 2);
    s.seats[0]!.stack = 30;
    s.seats[0]!.hole = [c(SPADES, 1), c(HEARTS, 1), c(CLUBS, 1), c(DIAMONDS, 5), c(SPADES, 9)];
    let x = play(s, 'raise:40', 'call');
    expect(x.seats[0]!.allIn).toBe(true);
    expect(x.street).toBe('draw');
    expect(x.toAct).toBe(1);
    x = play(x, 'draw:012', 'draw:34');
    expect(x.street).toBe('done');
    expect(x.result!.shown).toEqual([0, 1]);
  });

  it('replays random tournaments', () => {
    const rng = new Rng(5);
    let s = createPoker(DRAW, 9, 4);
    for (let k = 0; k < 3000 && s.champion === null; k++) {
      const legal = legalPokerActions(s);
      s = applyPokerAction(s, rng.pick(legal));
    }
    expect(replayPoker(DRAW, 9, 4, 1500, s.history)).toEqual(s);
    expect(isValidPokerState(DRAW, JSON.parse(JSON.stringify(s)))).toBe(true);
  });
});
