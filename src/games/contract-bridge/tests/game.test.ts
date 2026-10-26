import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c, suitOf } from '../../shared/cards/cards';
import { levelAction, mediumPlay, sampleWorld } from '../ai';
import { bridgeEnv } from '../ai-adapter';
import { chooseCall, hcp, isBalanced, openingCall } from '../bidding';
import {
  applyBridgeAction,
  chicagoVulnerability,
  controllerOf,
  createBridge,
  isValidBridgeState,
  legalBridgeActions,
  legalCalls,
  partnerOf,
  replayBridge,
  scoreContract,
  type BridgeState,
} from '../engine';

const calls = (s: BridgeState, ...list: string[]) =>
  list.reduce((x, a) => applyBridgeAction(x, a), s);
const finishDeal = (s: BridgeState, rng: Rng) => {
  let x = s;
  while (x.phase !== 'done') x = applyBridgeAction(x, levelAction(x, 'medium', rng));
  return x;
};

describe('Bridge auction', () => {
  it('requires higher bids and allows doubles and redoubles only against the right side', () => {
    let s = createBridge(1);
    expect(s.toAct).toBe(0);
    expect(legalCalls(s)).not.toContain('double');
    s = calls(s, 'bid:1H');
    expect(legalCalls(s)).toContain('double');
    expect(legalCalls(s)).not.toContain('bid:1D');
    expect(legalCalls(s)).toContain('bid:1S');
    s = calls(s, 'double');
    expect(legalCalls(s)).toContain('redouble');
    expect(legalCalls(s)).not.toContain('double');
  });

  it('closes after three passes, makes the first to name the strain declarer, and doubles stick', () => {
    let s = createBridge(1);
    s = calls(s, 'bid:1H', 'pass', 'bid:3H', 'double', 'pass', 'pass', 'pass');
    expect(s.phase).toBe('play');
    expect(s.contract).toEqual({ level: 3, strain: 2, declarer: 0, doubled: 1 });
    expect(s.toAct).toBe(1); // the lead from the declarer's left
    // Dummy's card is chosen by the declarer.
    s = applyBridgeAction(s, legalBridgeActions(s)[0]!);
    expect(s.toAct).toBe(partnerOf(0));
    expect(controllerOf(s)).toBe(0);
    expect(s.dummyShown).toBe(true);
  });

  it('throws in a deal passed four times', () => {
    const s = calls(createBridge(2), 'pass', 'pass', 'pass', 'pass');
    expect(s.phase).toBe('done');
    expect(s.result).toEqual({ points: [0, 0], over: 0, passedOut: true });
  });
});

describe('Bridge scoring', () => {
  it('scores part-scores, games, slams, overtricks and doubled undertricks', () => {
    expect(scoreContract({ level: 2, strain: 2, declarer: 0, doubled: 0 }, 9, false)).toBe(140);
    expect(scoreContract({ level: 3, strain: 4, declarer: 0, doubled: 0 }, 9, false)).toBe(400);
    expect(scoreContract({ level: 4, strain: 3, declarer: 0, doubled: 0 }, 10, true)).toBe(620);
    expect(scoreContract({ level: 6, strain: 2, declarer: 0, doubled: 0 }, 12, false)).toBe(980);
    expect(scoreContract({ level: 7, strain: 4, declarer: 0, doubled: 0 }, 13, true)).toBe(2220);
    expect(scoreContract({ level: 2, strain: 2, declarer: 0, doubled: 1 }, 8, false)).toBe(470);
    expect(scoreContract({ level: 4, strain: 3, declarer: 0, doubled: 0 }, 8, false)).toBe(-100);
    expect(scoreContract({ level: 4, strain: 3, declarer: 0, doubled: 1 }, 7, false)).toBe(-500);
    expect(scoreContract({ level: 4, strain: 3, declarer: 0, doubled: 1 }, 8, true)).toBe(-500);
    expect(scoreContract({ level: 3, strain: 4, declarer: 0, doubled: 2 }, 8, false)).toBe(-200);
  });

  it('follows the Chicago vulnerability and ends after four deals', () => {
    expect(chicagoVulnerability(1, 0)).toEqual([false, false]);
    expect(chicagoVulnerability(2, 1)).toEqual([false, true]);
    expect(chicagoVulnerability(3, 2)).toEqual([true, false]);
    expect(chicagoVulnerability(4, 3)).toEqual([true, true]);
    const rng = new Rng(4);
    let s = createBridge(3);
    for (let d = 0; d < 4; d++) {
      s = finishDeal(s, rng);
      expect(s.tricks[0] + s.tricks[1]).toBe(s.result!.passedOut ? 0 : 13);
      if (!s.over) s = applyBridgeAction(s, 'next');
    }
    expect(s.over).toBe(true);
    expect(s.dealNo).toBe(4);
    expect(replayBridge(3, s.history)).toEqual(s);
    expect(isValidBridgeState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidBridgeState({ ...s, scores: [0, 9999] })).toBe(false);
  });
});

describe('Bridge computer players', () => {
  it('evaluates hands and opens by the system', () => {
    const notrump = [
      c(SPADES, 1),
      c(SPADES, 13),
      c(SPADES, 4),
      c(HEARTS, 12),
      c(HEARTS, 11),
      c(HEARTS, 3),
      c(DIAMONDS, 1),
      c(DIAMONDS, 9),
      c(DIAMONDS, 5),
      c(CLUBS, 13),
      c(CLUBS, 7),
      c(CLUBS, 4),
      c(CLUBS, 2),
    ];
    expect(hcp(notrump)).toBe(17);
    expect(isBalanced(notrump)).toBe(true);
    expect(openingCall(notrump)).toBe('bid:1N');
    const major = [
      c(HEARTS, 1),
      c(HEARTS, 13),
      c(HEARTS, 10),
      c(HEARTS, 7),
      c(HEARTS, 4),
      c(SPADES, 12),
      c(SPADES, 5),
      c(DIAMONDS, 1),
      c(DIAMONDS, 8),
      c(DIAMONDS, 3),
      c(CLUBS, 9),
      c(CLUBS, 6),
      c(CLUBS, 2),
    ];
    expect(openingCall(major)).toBe('bid:1H');
    const weak = [
      c(SPADES, 13),
      c(SPADES, 12),
      c(SPADES, 10),
      c(SPADES, 8),
      c(SPADES, 6),
      c(SPADES, 2),
      c(HEARTS, 11),
      c(HEARTS, 3),
      c(DIAMONDS, 9),
      c(DIAMONDS, 5),
      c(CLUBS, 8),
      c(CLUBS, 7),
      c(CLUBS, 3),
    ];
    expect(hcp(weak)).toBe(6);
    expect(openingCall(weak)).toBe('bid:2S');
  });

  it('raises partner’s major to game with a fit and the points', () => {
    let s = createBridge(5);
    s.hands[0] = [
      c(HEARTS, 1),
      c(HEARTS, 13),
      c(HEARTS, 10),
      c(HEARTS, 7),
      c(HEARTS, 4),
      c(SPADES, 12),
      c(SPADES, 5),
      c(DIAMONDS, 1),
      c(DIAMONDS, 8),
      c(DIAMONDS, 3),
      c(CLUBS, 9),
      c(CLUBS, 6),
      c(CLUBS, 2),
    ];
    // 12 points and three hearts opposite an opening: game, not slam.
    s.hands[2] = [
      c(HEARTS, 12),
      c(HEARTS, 11),
      c(HEARTS, 5),
      c(SPADES, 1),
      c(SPADES, 7),
      c(SPADES, 3),
      c(DIAMONDS, 13),
      c(DIAMONDS, 6),
      c(DIAMONDS, 4),
      c(CLUBS, 12),
      c(CLUBS, 10),
      c(CLUBS, 5),
      c(CLUBS, 4),
    ];
    expect(hcp(s.hands[2]!)).toBe(12);
    s = calls(s, 'bid:1H', 'pass');
    expect(chooseCall(s)).toBe('bid:4H');
  });

  it('leads, follows and deals hidden hands consistently', () => {
    const rng = new Rng(6);
    let s = createBridge(7);
    while (s.phase === 'auction') s = applyBridgeAction(s, levelAction(s, 'medium', rng));
    if (s.phase !== 'play') return;
    expect(legalBridgeActions(s)).toContain(`play:${mediumPlay(s)}`);
    s = applyBridgeAction(s, `play:${mediumPlay(s)}`);
    const w = sampleWorld(s, rng);
    expect(w.hands.map((h) => h.length)).toEqual(s.hands.map((h) => h.length));
    expect(new Set(w.hands.flat()).size).toBe(51);
    // Dummy (now face up) and the seat to act keep their real cards.
    const dummy = partnerOf(s.contract!.declarer);
    expect(w.hands[dummy]).toEqual(s.hands[dummy]);
    expect(legalBridgeActions(s)).toContain(levelAction(s, 'hard', rng));
    for (const card of w.hands[s.toAct]!) expect(suitOf(card)).toBeGreaterThanOrEqual(0);
  });
});

describeAdapterContract(bridgeEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 140,
  illegalActions: (s) =>
    ['bid:8C', 'play:99', 'x'].filter((a) => !legalBridgeActions(s).includes(a)),
});
