import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { easyAction, hardRuleAction, levelAction, mediumAction } from '../ai';
import { eightsEnv } from '../ai-adapter';
import {
  applyEightsAction,
  canPlay,
  createEights,
  isValidEightsState,
  legalEightsActions,
  penalty,
  replayEights,
  type EightsState,
} from '../engine';

const rig = (s: EightsState, top: number, hand: number[]) => {
  const x = structuredClone(s);
  x.discard = [top];
  x.suit = Math.floor(top / 13);
  x.hands[x.toAct] = hand;
  return x;
};

describe('Crazy Eights rules', () => {
  it('deals 7 to two players and 5 to more, and starts the pile', () => {
    expect(createEights(1, 2).hands.map((h) => h.length)).toEqual([7, 7]);
    expect(createEights(1, 4).hands.map((h) => h.length)).toEqual([5, 5, 5, 5]);
    const s = createEights(1, 3);
    expect(s.discard).toHaveLength(1);
    expect(s.stock).toHaveLength(52 - 15 - 1);
  });

  it('plays matching suits or ranks and eights with a named suit', () => {
    const s = rig(createEights(2, 2), c(HEARTS, 10), [
      c(HEARTS, 3),
      c(SPADES, 10),
      c(CLUBS, 8),
      c(DIAMONDS, 2),
    ]);
    expect(canPlay(s, c(HEARTS, 3))).toBe(true);
    expect(canPlay(s, c(SPADES, 10))).toBe(true);
    expect(canPlay(s, c(DIAMONDS, 2))).toBe(false);
    const legal = legalEightsActions(s);
    expect(legal).toContain(`play:${c(CLUBS, 8)}:2`);
    expect(legal).not.toContain('draw');
    const x = applyEightsAction(s, `play:${c(CLUBS, 8)}:2`);
    expect(x.suit).toBe(DIAMONDS);
    expect(canPlay(x, c(DIAMONDS, 2))).toBe(true);
  });

  it('draws when stuck, then plays the drawn card or passes', () => {
    let s = rig(createEights(3, 2), c(HEARTS, 10), [c(SPADES, 2), c(CLUBS, 3)]);
    expect(legalEightsActions(s)).toEqual(['draw']);
    s = applyEightsAction(s, 'draw');
    expect(s.drawn).not.toBeNull();
    expect(s.lacked[s.toAct]).toEqual([HEARTS]);
    expect(legalEightsActions(s)).toContain('pass');
    const me = s.toAct;
    s = applyEightsAction(s, 'pass');
    expect(s.toAct).toBe((me + 1) % 2);
  });

  it('scores the other hands for going out and plays to 100 with replay validation', () => {
    expect(penalty(c(SPADES, 8))).toBe(50);
    expect(penalty(c(SPADES, 13))).toBe(10);
    expect(penalty(c(SPADES, 1))).toBe(1);
    const out = rig(createEights(4, 2), c(HEARTS, 10), [c(HEARTS, 3)]);
    const done = applyEightsAction(out, `play:${c(HEARTS, 3)}`);
    expect(done.result!.winner).toBe(out.toAct);
    expect(done.result!.points).toBe(
      done.hands[1 - out.toAct]!.reduce((a, x) => a + penalty(x), 0),
    );
    let s = createEights(5, 3);
    for (let k = 0; k < 6000 && s.winner === null; k++) s = applyEightsAction(s, mediumAction(s));
    expect(s.winner).not.toBeNull();
    expect(replayEights(5, 3, s.history)).toEqual(s);
    expect(isValidEightsState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidEightsState({ ...s, scores: [1, 2, 3] })).toBe(false);
  });
});

describe('Crazy Eights opponents', () => {
  it('keeps eights for last and names its longest suit', () => {
    const s = rig(createEights(6, 2), c(HEARTS, 10), [
      c(HEARTS, 4),
      c(CLUBS, 8),
      c(SPADES, 2),
      c(SPADES, 5),
    ]);
    expect(easyAction(s)).toBe(`play:${c(HEARTS, 4)}`);
    expect(mediumAction(s)).toBe(`play:${c(HEARTS, 4)}`);
    const only = rig(createEights(6, 2), c(HEARTS, 10), [c(CLUBS, 8), c(SPADES, 2), c(SPADES, 5)]);
    expect(mediumAction(only)).toBe(`play:${c(CLUBS, 8)}:0`);
  });

  it('keeps the next player on the suit they could not follow', () => {
    const s = rig(createEights(7, 2), c(HEARTS, 10), [
      c(HEARTS, 4),
      c(DIAMONDS, 10),
      c(DIAMONDS, 3),
    ]);
    s.lacked[(s.toAct + 1) % 2] = [HEARTS];
    expect(hardRuleAction(s)).toBe(`play:${c(HEARTS, 4)}`);
    s.lacked[(s.toAct + 1) % 2] = [DIAMONDS];
    expect(hardRuleAction(s)).toBe(`play:${c(DIAMONDS, 10)}`);
    expect(legalEightsActions(s)).toContain(levelAction(s, 'hard'));
  });
});

describeAdapterContract(eightsEnv, {
  configs: [undefined, { players: 4 }],
  playouts: 20,
  maxSteps: 150,
  allowTruncation: true,
  illegalActions: (s) =>
    ['play:99', 'draw:1', 'x'].filter((a) => !legalEightsActions(s).includes(a)),
});
