import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c, suitOf } from '../../shared/cards/cards';
import {
  AGENT_PRESETS,
  estimateTricks,
  levelAction,
  mediumBid,
  mediumPlay,
  nilWorthy,
  sampleWorld,
} from '../ai';
import { spadesEnv } from '../ai-adapter';
import {
  applySpadesAction,
  createSpades,
  isValidSpadesState,
  legalSpadesActions,
  playableCards,
  replaySpades,
  scoreHand,
  type SpadesState,
} from '../engine';

const bidAll = (s: SpadesState, bids: number[]) =>
  bids.reduce((x, b) => applySpadesAction(x, `bid:${b}`), s);
const finish = (s: SpadesState) => {
  let x = s;
  while (x.phase === 'bid') x = applySpadesAction(x, `bid:${mediumBid(x)}`);
  while (x.phase === 'play') x = applySpadesAction(x, `play:${mediumPlay(x)}`);
  return x;
};

describe('Spades rules', () => {
  it('bids left of the dealer, then that player leads without spades until broken', () => {
    const s = createSpades(1);
    expect(s.dealer).toBe(3);
    expect(s.toAct).toBe(0);
    expect(legalSpadesActions(s)).toHaveLength(14);
    const x = bidAll(s, [3, 2, 4, 3]);
    expect(x.phase).toBe('play');
    expect(x.toAct).toBe(0);
    const hand = x.hands[0]!;
    if (hand.some((card) => suitOf(card) !== SPADES))
      expect(playableCards(x).every((card) => suitOf(card) !== SPADES)).toBe(true);
  });

  it('scores contracts, bags, sets and nils', () => {
    // Side 0 bids 3 + 2 and takes 6 (one bag); side 1 bids 4 + nil, takes 7, the nil takes 0.
    const r = scoreHand([3, 4, 2, 0], [4, 7, 2, 0], [0, 0]);
    expect(r.points).toEqual([51, 140 + 3]);
    expect(r.bags).toEqual([1, 3]);
    expect(r.nil).toEqual([null, null, null, true]);
    // A set costs ten per trick bid; a failed nil costs 100 and its tricks are bags.
    const set = scoreHand([5, 3, 4, 0], [3, 5, 3, 2], [0, 0]);
    expect(set.points[0]).toBe(-90);
    expect(set.points[1]).toBe(30 + 2 - 100);
    // The tenth bag costs 100.
    expect(scoreHand([3, 3, 3, 3], [4, 3, 3, 3], [9, 0]).points[0]).toBe(60 + 1 - 100);
  });

  it('plays hands to a winner at 500 and replays', () => {
    let s = createSpades(2);
    for (let k = 0; k < 60 && s.winner === null; k++) {
      s = finish(s);
      expect(s.tricks.reduce((a, b) => a + b, 0)).toBe(13);
      if (s.winner === null) s = applySpadesAction(s, 'next');
    }
    expect(s.winner).not.toBeNull();
    expect(Math.max(...s.scores) >= 500 || Math.min(...s.scores) <= -200).toBe(true);
    expect(replaySpades(2, s.history)).toEqual(s);
    expect(isValidSpadesState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });
});

describe('Spades opponents', () => {
  it('counts tricks and spots nil hands', () => {
    const strong = [
      c(SPADES, 1),
      c(SPADES, 13),
      c(SPADES, 12),
      c(SPADES, 9),
      c(SPADES, 5),
      c(HEARTS, 1),
      c(HEARTS, 13),
      c(CLUBS, 1),
      c(CLUBS, 4),
      c(DIAMONDS, 3),
      c(DIAMONDS, 6),
      c(DIAMONDS, 8),
      c(HEARTS, 2),
    ];
    expect(estimateTricks(strong)).toBeGreaterThan(6);
    const weak = [
      c(SPADES, 2),
      c(SPADES, 4),
      c(HEARTS, 3),
      c(HEARTS, 5),
      c(HEARTS, 7),
      c(CLUBS, 2),
      c(CLUBS, 6),
      c(CLUBS, 8),
      c(DIAMONDS, 2),
      c(DIAMONDS, 4),
      c(DIAMONDS, 9),
      c(DIAMONDS, 10),
      c(CLUBS, 11),
    ];
    expect(nilWorthy(weak)).toBe(true);
    expect(nilWorthy(strong)).toBe(false);
  });

  it('stays under a winning partner and wins cheaply when its side needs tricks', () => {
    let s = bidAll(createSpades(3), [3, 3, 3, 3]);
    s = structuredClone(s);
    s.toAct = 2;
    s.trick = [
      { seat: 0, card: c(HEARTS, 1) },
      { seat: 1, card: c(HEARTS, 5) },
    ];
    s.hands[2] = [c(HEARTS, 13), c(HEARTS, 3), c(CLUBS, 9)];
    expect(mediumPlay(s)).toBe(c(HEARTS, 3));
    s.trick = [{ seat: 1, card: c(HEARTS, 10) }];
    s.hands[2] = [c(HEARTS, 13), c(HEARTS, 12), c(HEARTS, 3)];
    expect(mediumPlay(s)).toBe(c(HEARTS, 12));
  });

  it('samples deals that respect shown-out suits', () => {
    const s = structuredClone(bidAll(createSpades(4), [3, 3, 3, 3]));
    s.shownOut = [[], [CLUBS], [], []];
    const rng = new Rng(1);
    for (let k = 0; k < 10; k++) {
      const w = sampleWorld(s, 0, rng);
      expect(w.hands[1]!.some((card) => suitOf(card) === CLUBS)).toBe(false);
      expect(new Set(w.hands.flat()).size).toBe(52);
    }
    expect(legalSpadesActions(s)).toContain(levelAction(s, 'hard', rng));
  });

  it('Medium beats Easy and Random (seeded hands)', () => {
    const agent = (id: string) => AGENT_PRESETS.find((p) => p.id === id)!.create();
    const vs = (a: string, b: string) =>
      evaluateAgents(spadesEnv, agent(a), agent(b), { games: 300, seed: 7, maxSteps: 200 })
        .agents[0].averageReturn;
    expect(vs('medium', 'random')).toBeGreaterThan(1);
    expect(vs('medium', 'easy')).toBeGreaterThan(0);
  }, 60_000);
});

describeAdapterContract(spadesEnv, {
  configs: [undefined],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) =>
    ['bid:14', 'play:99', 'x'].filter((a) => !legalSpadesActions(s).includes(a)),
  checkObservation: (s, player) => {
    const view = spadesEnv.getObservation(s, player) as SpadesState;
    view.hands.forEach((h, i) => {
      if (i !== player) expect(h.every((card) => card === -1)).toBe(true);
    });
  },
});
