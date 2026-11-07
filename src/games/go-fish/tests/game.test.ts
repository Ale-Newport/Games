import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c, rankOf } from '../../shared/cards/cards';
import { chanceHolds, easyAction, hardAction, knowledge, levelAction, mediumAction } from '../ai';
import { fishEnv, fishOutcome } from '../ai-adapter';
import {
  applyFishAction,
  createFish,
  isValidFishState,
  legalFishActions,
  replayFish,
  type FishState,
} from '../engine';

const rig = (s: FishState, hands: number[][], pond?: number[]) => {
  const x = structuredClone(s);
  x.hands = hands;
  if (pond) x.pond = pond;
  return x;
};

describe('Go Fish rules', () => {
  it('deals seven to two or three players and five to four', () => {
    expect(createFish(1, 2).hands.map((h) => h.length)).toEqual([7, 7]);
    expect(createFish(1, 3).hands.map((h) => h.length)).toEqual([7, 7, 7]);
    const four = createFish(1, 4);
    expect(four.hands.map((h) => h.length)).toEqual([5, 5, 5, 5]);
    expect(four.pond).toHaveLength(32);
  });

  it('hands over every card of the asked rank and keeps the turn', () => {
    const s = rig(createFish(2, 2), [
      [c(SPADES, 7), c(HEARTS, 2)],
      [c(HEARTS, 7), c(CLUBS, 7), c(SPADES, 9)],
    ]);
    expect(legalFishActions(s)).toEqual(['ask:1:2', 'ask:1:7']);
    const x = applyFishAction(s, 'ask:1:7');
    expect(x.hands[0]!.filter((k) => rankOf(k) === 7)).toHaveLength(3);
    expect(x.hands[1]).toEqual([c(SPADES, 9)]);
    expect(x.toAct).toBe(0);
    expect(x.asks.at(-1)).toEqual({ asker: 0, target: 1, rank: 7, got: 2, lucky: false });
  });

  it('goes fishing: a miss passes the turn, the asked rank keeps it', () => {
    const base = createFish(3, 2);
    const miss = applyFishAction(
      rig(base, [[c(SPADES, 7)], [c(HEARTS, 9)]], [c(CLUBS, 3), c(CLUBS, 4)]),
      'ask:1:7',
    );
    expect(miss.hands[0]).toEqual([c(SPADES, 7), c(CLUBS, 3)]);
    expect(miss.toAct).toBe(1);
    const lucky = applyFishAction(
      rig(base, [[c(SPADES, 7)], [c(HEARTS, 9)]], [c(CLUBS, 7), c(CLUBS, 4)]),
      'ask:1:7',
    );
    expect(lucky.asks.at(-1)!.lucky).toBe(true);
    expect(lucky.toAct).toBe(0);
  });

  it('lays down books, lets an empty hand draw, and ends when all thirteen are down', () => {
    const s = rig(createFish(4, 2), [
      [c(SPADES, 5), c(HEARTS, 5), c(CLUBS, 5), c(SPADES, 1)],
      [c(DIAMONDS, 5), c(SPADES, 9)],
    ]);
    const x = applyFishAction(s, 'ask:1:5');
    expect(x.books[0]).toEqual([5]);
    expect(x.hands[0]).toEqual([c(SPADES, 1)]);
    const empty = rig(createFish(4, 2), [[], [c(SPADES, 9)]]);
    expect(legalFishActions(empty)).toEqual(['draw']);
    let g = createFish(5, 3);
    for (let k = 0; k < 3000 && !g.over; k++) g = applyFishAction(g, mediumAction(g));
    expect(g.over).toBe(true);
    expect(g.books.flat().sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    const most = Math.max(...g.books.map((b) => b.length));
    expect(g.winners.every((p) => g.books[p]!.length === most)).toBe(true);
    expect(fishOutcome(g)!.scores).toEqual(g.books.map((b) => b.length));
    expect(replayFish(5, 3, g.history)).toEqual(g);
    expect(isValidFishState(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidFishState({ ...g, books: [[], [], []] })).toBe(false);
  });
});

describe('Go Fish opponents', () => {
  it('works out from the asks who holds what and who lacks it', () => {
    let s = rig(createFish(6, 2), [
      [c(SPADES, 7), c(HEARTS, 2)],
      [c(HEARTS, 9), c(CLUBS, 4)],
    ]);
    s.pond = [c(CLUBS, 3), ...s.pond.filter((k) => k !== c(CLUBS, 3))];
    s = applyFishAction(s, 'ask:1:7');
    const k = knowledge(s);
    expect(k.known[0]![7]).toBe(1);
    expect(k.since[1]![7]).toBe(0);
    // Player 1 now asks player 0 — and Medium and Hard know player 0 holds a seven.
    s.hands[1] = [c(CLUBS, 7), c(CLUBS, 4)];
    expect(mediumAction(s)).toBe('ask:0:7');
    expect(hardAction(s)).toBe('ask:0:7');
    expect(legalFishActions(s)).toContain(easyAction(s, new Rng(1)));
    expect(legalFishActions(s)).toContain(levelAction(s, 'hard', new Rng(1)));
  });

  it('weighs the chance that a hand holds an unseen card', () => {
    expect(chanceHolds(0, 7, 40)).toBe(0);
    expect(chanceHolds(3, 0, 40)).toBe(0);
    expect(chanceHolds(1, 10, 10)).toBe(1);
    expect(chanceHolds(1, 7, 45)).toBeCloseTo(7 / 45, 6);
    expect(chanceHolds(3, 7, 45)).toBeGreaterThan(chanceHolds(1, 7, 45));
  });
});

describeAdapterContract(fishEnv, {
  configs: [undefined, { players: 4 }],
  playouts: 20,
  maxSteps: 400,
  allowTruncation: true,
  illegalActions: (s) =>
    ['ask:9:1', 'ask:0:14', 'x'].filter((a) => !legalFishActions(s).includes(a)),
});
