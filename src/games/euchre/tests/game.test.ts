import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c, suitOf } from '../../shared/cards/cards';
import { handValue, levelAction, mediumPlay, sampleWorld, worstCard } from '../ai';
import { euchreEnv } from '../ai-adapter';
import {
  EUCHRE_DECK,
  applyEuchreAction,
  cardPower,
  createEuchre,
  effectiveSuit,
  isValidEuchreState,
  legalEuchreActions,
  replayEuchre,
  sittingOut,
} from '../engine';

describe('Euchre cards', () => {
  it('uses 24 cards and ranks the bowers on top of trump', () => {
    expect(EUCHRE_DECK).toHaveLength(24);
    const trump = HEARTS;
    expect(cardPower(c(HEARTS, 11), trump, null)).toBe(100);
    expect(cardPower(c(DIAMONDS, 11), trump, null)).toBe(99);
    expect(cardPower(c(HEARTS, 1), trump, null)).toBeGreaterThan(
      cardPower(c(HEARTS, 13), trump, null),
    );
    expect(effectiveSuit(c(DIAMONDS, 11), trump)).toBe(HEARTS);
    expect(effectiveSuit(c(CLUBS, 11), SPADES)).toBe(SPADES);
    expect(effectiveSuit(c(DIAMONDS, 11), SPADES)).toBe(DIAMONDS);
  });
});

describe('Euchre rules', () => {
  it('deals five each with an upcard and offers the order from the dealer’s left', () => {
    const s = createEuchre(1);
    expect(s.hands.every((h) => h.length === 5)).toBe(true);
    expect(s.toAct).toBe((s.dealer + 1) % 4);
    expect(legalEuchreActions(s)).toEqual(['pass', 'order', 'order-alone']);
  });

  it('lets the dealer take the upcard and throw one when ordered', () => {
    let s = createEuchre(2);
    s = applyEuchreAction(s, 'order');
    expect(s.trump).toBe(suitOf(s.upcard));
    expect(s.phase).toBe('throw');
    expect(s.hands[s.dealer]).toHaveLength(6);
    s = applyEuchreAction(s, legalEuchreActions(s)[0]!);
    expect(s.hands[s.dealer]).toHaveLength(5);
    expect(s.phase).toBe('play');
    expect(s.toAct).toBe((s.dealer + 1) % 4);
  });

  it('sticks the dealer in round two and forbids the upcard suit', () => {
    let s = createEuchre(3);
    for (let k = 0; k < 4; k++) s = applyEuchreAction(s, 'pass');
    expect(s.phase).toBe('round2');
    expect(legalEuchreActions(s)).not.toContain(`name:${suitOf(s.upcard)}`);
    for (let k = 0; k < 3; k++) s = applyEuchreAction(s, 'pass');
    expect(s.toAct).toBe(s.dealer);
    expect(legalEuchreActions(s)).not.toContain('pass');
  });

  it('plays alone with the partner sitting out and scores four for a lone march', () => {
    let s = createEuchre(4);
    s = applyEuchreAction(s, 'order-alone');
    expect(s.alone).toBe(true);
    const out = sittingOut(s);
    if (s.phase === 'throw') s = applyEuchreAction(s, legalEuchreActions(s)[0]!);
    const rng = new Rng(1);
    while (s.phase === 'play') {
      expect(s.toAct).not.toBe(out);
      s = applyEuchreAction(s, levelAction(s, 'medium', rng));
    }
    expect(s.tricks[0] + s.tricks[1]).toBe(5);
    const r = s.result!;
    if (r.march) expect(r.points[r.makers]).toBe(4);
    if (r.euchred) expect(r.points[(1 - r.makers) as 0 | 1]).toBe(2);
  });

  it('plays a game to 10 and replays', () => {
    const rng = new Rng(2);
    let s = createEuchre(5);
    for (let k = 0; k < 3000 && s.winner === null; k++)
      s = applyEuchreAction(s, levelAction(s, 'medium', rng));
    expect(s.winner).not.toBeNull();
    expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(10);
    expect(replayEuchre(5, s.history)).toEqual(s);
    expect(isValidEuchreState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidEuchreState({ ...s, scores: [9, 9] })).toBe(false);
  });
});

describe('Euchre opponents', () => {
  it('values bowers, throws the weakest card, and stays under a winning partner', () => {
    const strong = [c(HEARTS, 11), c(DIAMONDS, 11), c(HEARTS, 1), c(SPADES, 1), c(CLUBS, 9)];
    expect(handValue(strong, HEARTS)).toBeGreaterThan(8);
    expect(handValue(strong, CLUBS)).toBeLessThan(3);
    expect(worstCard([...strong, c(CLUBS, 10)], HEARTS)).toBe(c(CLUBS, 9));
    let s = createEuchre(6);
    s = applyEuchreAction(s, 'order');
    if (s.phase === 'throw') s = applyEuchreAction(s, legalEuchreActions(s)[0]!);
    s = structuredClone(s);
    s.trump = HEARTS;
    s.toAct = 2;
    s.trick = [
      { seat: 0, card: c(SPADES, 1) },
      { seat: 1, card: c(SPADES, 9) },
    ];
    s.hands[2] = [c(SPADES, 13), c(SPADES, 10), c(CLUBS, 12)];
    expect(mediumPlay(s)).toBe(c(SPADES, 10));
  });

  it('samples hidden hands that respect shown-out suits', () => {
    let s = createEuchre(7);
    s = applyEuchreAction(s, 'order');
    if (s.phase === 'throw') s = applyEuchreAction(s, legalEuchreActions(s)[0]!);
    const x = structuredClone(s);
    const other = (x.toAct + 1) % 4;
    x.shownOut[other] = [CLUBS];
    const w = sampleWorld(x, new Rng(3));
    expect(w.hands[other]!.some((card) => effectiveSuit(card, x.trump) === CLUBS)).toBe(false);
    expect(w.hands.map((h) => h.length)).toEqual(x.hands.map((h) => h.length));
  });
});

describeAdapterContract(euchreEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 40,
  illegalActions: (s) =>
    ['play:99', 'name:9', 'x'].filter((a) => !legalEuchreActions(s).includes(a)),
});
