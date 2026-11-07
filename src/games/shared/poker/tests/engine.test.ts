import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../../ai/evaluation/evaluate';
import { Rng } from '../../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import { STYLES, estimateEquity, pokerPresets } from '../ai';
import {
  HOLDEM,
  OMAHA,
  applyPokerAction,
  createPoker,
  isValidPokerState,
  legalPokerActions,
  raiseRange,
  replayPoker,
  type PokerState,
} from '../engine';
import { createPokerEnv, maskPoker, UNKNOWN } from '../environment';

const play = (s: PokerState, ...actions: string[]) =>
  actions.reduce((x, a) => applyPokerAction(x, a), s);
const chips = (s: PokerState) => s.seats.reduce((a, x) => a + x.stack, 0);

const env = createPokerEnv(HOLDEM, { id: 'poker-test', version: '1.0.0', rulesetId: 'test' });

describe('poker betting', () => {
  it('posts the blinds heads-up with the button on the small blind, acting first pre-flop only', () => {
    const s = createPoker(HOLDEM, 1, 2);
    expect(s.button).toBe(0);
    expect(s.seats.map((x) => x.bet)).toEqual([10, 20]);
    expect(s.toAct).toBe(0);
    expect(legalPokerActions(s)).toEqual(['fold', 'call', 'raise:40', 'raise:60', 'raise:1500']);
    const flop = play(s, 'call', 'check');
    expect(flop.street).toBe('flop');
    expect(flop.board).toHaveLength(3);
    expect(flop.toAct).toBe(1);
  });

  it('gives the pot to the last player in and moves the button', () => {
    const s = createPoker(HOLDEM, 2, 3);
    expect([s.button, s.toAct]).toEqual([0, 0]);
    const done = play(s, 'fold', 'fold');
    expect(done.street).toBe('done');
    expect(done.result!.won).toEqual([0, 0, 30]);
    expect(done.seats.map((x) => x.stack)).toEqual([1500, 1490, 1510]);
    expect(legalPokerActions(done)).toEqual(['next']);
    const next = play(done, 'next');
    expect(next.button).toBe(1);
    expect(next.seats.map((x) => x.bet)).toEqual([20, 0, 10]);
  });

  it('requires full raises and does not reopen the betting after a short all-in', () => {
    let s = createPoker(HOLDEM, 3, 3);
    expect(raiseRange(s)).toEqual([40, 1500]);
    s = play(s, 'raise:100');
    expect(raiseRange(s)![0]).toBe(180);
    s.seats[1]!.stack = 140; // the small blind can only go all-in to 150: a short raise
    s = play(s, 'raise:150');
    expect(s.seats[1]!.allIn).toBe(true);
    // The big blind had not acted yet and may still raise; the opener may only call or fold.
    expect(raiseRange(s)).not.toBeNull();
    s = play(s, 'call');
    expect(s.toAct).toBe(0);
    expect(legalPokerActions(s)).toEqual(['fold', 'call']);
    expect(() => play(s, 'raise:400')).toThrow();
  });

  it('caps pot-limit raises at the size of the pot', () => {
    const s = createPoker(OMAHA, 4, 2);
    expect(s.seats[0]!.hole).toHaveLength(4);
    // Call 10 first, then raise the pot of 40: to 60.
    expect(raiseRange(s)).toEqual([40, 60]);
  });

  it('splits side pots between the short stack and the rest', () => {
    const s = createPoker(HOLDEM, 5, 3);
    s.seats[0]!.stack = 100;
    s.seats[0]!.hole = [c(SPADES, 1), c(HEARTS, 1)];
    s.seats[1]!.hole = [c(SPADES, 13), c(HEARTS, 13)];
    s.seats[2]!.hole = [c(SPADES, 12), c(HEARTS, 12)];
    const board = [c(CLUBS, 2), c(DIAMONDS, 7), c(CLUBS, 9), c(HEARTS, 4), c(DIAMONDS, 11)];
    s.deck.splice(s.dealt, 5, ...board);
    let x = play(s, 'raise:100', 'raise:400', 'call');
    expect(x.street).toBe('flop');
    x = play(x, 'check', 'check', 'check', 'check', 'check', 'check');
    expect(x.street).toBe('done');
    expect(x.result!.shown).toEqual([0, 1, 2]);
    expect(x.result!.won).toEqual([300, 600, 0]);
    expect(x.seats.map((y) => y.stack)).toEqual([300, 1700, 1100]);
  });

  it('runs the board out when everyone is all-in and splits a tie', () => {
    const s = createPoker(HOLDEM, 6, 2);
    s.seats[0]!.hole = [c(SPADES, 2), c(HEARTS, 3)];
    s.seats[1]!.hole = [c(CLUBS, 2), c(DIAMONDS, 3)];
    const board = [c(CLUBS, 10), c(DIAMONDS, 11), c(SPADES, 12), c(HEARTS, 13), c(CLUBS, 1)];
    s.deck.splice(s.dealt, 5, ...board);
    const x = play(s, 'raise:1500', 'call');
    expect(x.board).toEqual(board);
    expect(x.result!.won).toEqual([1500, 1500]);
  });

  it('plays a tournament to a champion, conserving chips, and validates it by replay', () => {
    const rng = new Rng(9);
    let s = createPoker(HOLDEM, 11, 4);
    for (let k = 0; k < 4000 && s.champion === null; k++) {
      const legal = legalPokerActions(s);
      // Aggressive random play so the tournament ends quickly.
      const raise = legal.filter((a) => a.startsWith('raise'));
      s = applyPokerAction(s, raise.length && rng.chance(0.4) ? raise.at(-1)! : rng.pick(legal));
      if (s.street === 'done') expect(chips(s)).toBe(6000);
    }
    expect(s.champion).not.toBeNull();
    if (s.champion! >= 0) expect(s.seats[s.champion!]!.stack).toBe(6000);
    expect(replayPoker(HOLDEM, 11, 4, 1500, s.history)).toEqual(s);
    expect(isValidPokerState(HOLDEM, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidPokerState(HOLDEM, { ...s, button: (s.button + 1) % 4 })).toBe(false);
    expect(isValidPokerState(OMAHA, s)).toBe(false);
  });
});

describe('poker environment and opponents', () => {
  it('hides the other hands until the showdown', () => {
    const s = createPoker(HOLDEM, 7, 3);
    const view = maskPoker(s, 1);
    expect(view.deck).toEqual([]);
    expect(view.seats[1]!.hole).toEqual(s.seats[1]!.hole);
    expect(view.seats[0]!.hole).toEqual([UNKNOWN, UNKNOWN]);
  });

  it('estimates equity sensibly', () => {
    const s = createPoker(HOLDEM, 8, 2);
    s.seats[0]!.hole = [c(SPADES, 1), c(HEARTS, 1)];
    s.seats[1]!.hole = [c(SPADES, 7), c(HEARTS, 2)];
    const rng = new Rng(1);
    expect(estimateEquity(s, 0, 2000, rng)).toBeGreaterThan(0.8);
    expect(estimateEquity(s, 1, 2000, rng)).toBeLessThan(0.4);
    // Against five opponents aces win far less often.
    const six = createPoker(HOLDEM, 8, 6);
    six.seats[0]!.hole = [c(SPADES, 1), c(HEARTS, 1)];
    const e = estimateEquity(six, 0, 2000, rng);
    expect(e).toBeGreaterThan(0.4);
    expect(e).toBeLessThan(0.6);
  });

  it('ranks the opponents: Medium beats Random and Easy (seeded heads-up hands)', () => {
    const agent = (id: string) =>
      pokerPresets()
        .find((p) => p.id === id)!
        .create();
    const vsRandom = evaluateAgents(env, agent('medium'), agent('random'), {
      games: 300,
      seed: 1,
      maxSteps: 60,
    });
    expect(vsRandom.agents[0].averageReturn).toBeGreaterThan(2);
    const vsEasy = evaluateAgents(env, agent('medium'), agent('easy'), {
      games: 300,
      seed: 1,
      maxSteps: 60,
    });
    expect(vsEasy.agents[0].averageReturn).toBeGreaterThan(0);
    expect(STYLES.hard.samples).toBeGreaterThan(STYLES.medium.samples);
  }, 120_000);
});

describeAdapterContract(env, {
  configs: [undefined, { players: 6 }],
  playouts: 20,
  maxSteps: 80,
  illegalActions: (s) =>
    ['raise:1', 'raise:999999', 'bet', 'x'].filter((a) => !legalPokerActions(s).includes(a)),
  checkObservation: (s, player) => {
    const view = env.getObservation(s, player);
    view.seats.forEach((x, i) => {
      if (i !== player && !(s.result?.shown ?? []).includes(i))
        expect(x.hole.every((h) => h === UNKNOWN)).toBe(true);
    });
  },
});
