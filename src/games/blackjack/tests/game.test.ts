import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { AGENT_PRESETS, basicStrategy } from '../ai';
import { blackjackEnv } from '../ai-adapter';
import {
  START_BANKROLL,
  applyBlackjackAction,
  createBlackjack,
  handValue,
  isValidBlackjackState,
  legalBlackjackActions,
  replayBlackjack,
  roundNet,
  type BlackjackState,
} from '../engine';

const deal = (seed: number, bet = 10) => applyBlackjackAction(createBlackjack(seed), `bet:${bet}`);
const play = (s: BlackjackState, ...actions: string[]) =>
  actions.reduce((x, a) => applyBlackjackAction(x, a), s);

describe('Blackjack hands', () => {
  it('counts aces as 1 or 11', () => {
    expect(handValue([c(SPADES, 1), c(HEARTS, 6)])).toEqual({ total: 17, soft: true });
    expect(handValue([c(SPADES, 1), c(HEARTS, 6), c(CLUBS, 9)])).toEqual({
      total: 16,
      soft: false,
    });
    expect(handValue([c(SPADES, 1), c(HEARTS, 1), c(CLUBS, 13)])).toEqual({
      total: 12,
      soft: false,
    });
  });
});

describe('Blackjack rounds', () => {
  it('pays a natural 3 to 2 at once (shoe 21)', () => {
    const s = deal(21, 10);
    expect(s.phase).toBe('settled');
    expect(s.hands[0]!.outcome).toBe('blackjack');
    expect(roundNet(s)).toBe(15);
    expect(s.bankroll).toBe(START_BANKROLL + 15);
  });

  it('peeks for the dealer’s blackjack with a ten up (shoe 6) and pushes two naturals (shoe 210)', () => {
    const lost = deal(6);
    expect(lost.phase).toBe('settled');
    expect(lost.revealed).toBe(true);
    expect(roundNet(lost)).toBe(-10);
    const push = deal(210);
    expect(
      push.phase === 'insurance'
        ? play(push, 'no-insure').hands[0]!.outcome
        : push.hands[0]!.outcome,
    ).toBe('push');
  });

  it('offers insurance with an ace up (shoe 12) and loses it when the dealer has no blackjack', () => {
    const s = deal(12);
    expect(legalBlackjackActions(s)).toEqual(['insure', 'no-insure']);
    const insured = play(s, 'insure');
    expect(insured.insurance).toBe(5);
    expect(insured.phase).toBe('play');
    expect(insured.bankroll).toBe(START_BANKROLL - 15);
  });

  it('doubles for one card (shoe 25: 11 against a 2)', () => {
    const s = deal(25);
    expect(legalBlackjackActions(s)).toContain('double');
    const d = play(s, 'double');
    expect(d.hands[0]!.cards).toHaveLength(3);
    expect(d.hands[0]!.bet).toBe(20);
    expect(d.phase).toBe('settled');
  });

  it('splits aces into two hands of one card each (shoe 3)', () => {
    const s = deal(3);
    expect(legalBlackjackActions(s)).toContain('split');
    const split = play(s, 'split');
    expect(split.hands).toHaveLength(2);
    expect(split.hands.every((h) => h.cards.length === 2 && h.fromSplit)).toBe(true);
    expect(split.phase).toBe('settled');
    // A split ace with a ten is 21, not a blackjack.
    expect(split.hands.some((h) => h.outcome === 'blackjack')).toBe(false);
  });

  it('makes the dealer draw to 17 and stand on soft 17', () => {
    let s = deal(1);
    s = play(s, 'stand');
    expect(handValue(s.dealer).total).toBeGreaterThanOrEqual(17);
    expect(s.phase).toBe('settled');
  });

  it('refills an empty bankroll and validates sessions by replay', () => {
    let s = createBlackjack(7);
    for (let r = 0; r < 30; r++) {
      if (s.phase === 'bet') s = applyBlackjackAction(s, legalBlackjackActions(s).at(-1)!);
      while (s.phase !== 'settled' && s.phase !== 'bet')
        s = applyBlackjackAction(s, legalBlackjackActions(s)[0]!);
      if (s.phase === 'settled') s = applyBlackjackAction(s, 'next');
    }
    expect(s.bankroll).toBeGreaterThanOrEqual(10);
    expect(replayBlackjack(7, s.history)).toEqual(s);
    expect(isValidBlackjackState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidBlackjackState({ ...s, bankroll: s.bankroll + 1 })).toBe(false);
    expect(() => applyBlackjackAction(s, 'bet:7')).toThrow();
  });
});

describe('Blackjack basic strategy', () => {
  it('follows the textbook chart', () => {
    expect(basicStrategy([c(SPADES, 8), c(HEARTS, 8)], c(CLUBS, 10), true)).toBe('split');
    expect(basicStrategy([c(SPADES, 10), c(HEARTS, 10)], c(CLUBS, 6), true)).toBe('stand');
    expect(basicStrategy([c(SPADES, 6), c(HEARTS, 5)], c(CLUBS, 1), true)).toBe('double');
    expect(basicStrategy([c(SPADES, 10), c(HEARTS, 2)], c(CLUBS, 3), true)).toBe('hit');
    expect(basicStrategy([c(SPADES, 10), c(HEARTS, 2)], c(CLUBS, 4), true)).toBe('stand');
    expect(basicStrategy([c(SPADES, 1), c(HEARTS, 7)], c(CLUBS, 9), true)).toBe('hit');
    expect(basicStrategy([c(SPADES, 1), c(HEARTS, 7)], c(DIAMONDS, 7), true)).toBe('stand');
    expect(basicStrategy([c(SPADES, 9), c(HEARTS, 9)], c(DIAMONDS, 7), true)).toBe('stand');
  });

  it('loses far less than playing like the dealer (seeded rounds)', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(blackjackEnv, preset('basic'), preset('mimic'), {
      games: 20000,
      seed: 1,
      maxSteps: 30,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
    expect(report.agents[0].averageReturn).toBeGreaterThan(-0.03);
  }, 120_000);
});

describeAdapterContract(blackjackEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 30,
  illegalActions: (s) =>
    ['bet:7', 'fold', 'x'].filter((a) => !legalBlackjackActions(s).includes(a)),
});
