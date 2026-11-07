import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c, suitOf } from '../../shared/cards/cards';
import { AGENT_PRESETS, choosePass, levelAction, mediumPlay, sampleWorld, searchPlay } from '../ai';
import { heartsEnv } from '../ai-adapter';
import {
  QUEEN_OF_SPADES,
  TWO_OF_CLUBS,
  applyHeartsAction,
  createHearts,
  isValidHeartsState,
  legalHeartsActions,
  passOffset,
  playableCards,
  replayHearts,
  type HeartsState,
} from '../engine';

const play = (s: HeartsState, ...actions: string[]) =>
  actions.reduce((x, a) => applyHeartsAction(x, a), s);
const autoPass = (s: HeartsState) => {
  let x = s;
  while (x.phase === 'pass')
    x = applyHeartsAction(x, `pass:${choosePass(x.hands[x.toAct]!, false).join('.')}`);
  return x;
};
/** Plays the hand out with Medium. */
const finish = (s: HeartsState) => {
  let x = autoPass(s);
  while (x.phase === 'play') x = applyHeartsAction(x, `play:${mediumPlay(x)}`);
  return x;
};

describe('Hearts rules', () => {
  it('deals 13 cards each and passes three to the left on the first hand', () => {
    const s = createHearts(1);
    expect(s.hands.map((h) => h.length)).toEqual([13, 13, 13, 13]);
    expect(s.phase).toBe('pass');
    expect(passOffset(1)).toBe(1);
    expect(passOffset(4)).toBe(0);
    const mine = s.hands[0]!.slice(0, 3).sort((a, b) => a - b);
    let x = applyHeartsAction(s, `pass:${mine.join('.')}`);
    expect(x.toAct).toBe(1);
    expect(() => applyHeartsAction(x, 'pass:1.2')).toThrow();
    x = autoPass(x);
    expect(x.phase).toBe('play');
    expect(x.received[1]).toEqual(mine);
    expect(x.hands[1]).toEqual(expect.arrayContaining(mine));
    expect(x.hands[x.toAct]).toContain(TWO_OF_CLUBS);
    expect(legalHeartsActions(x)).toEqual([`play:${TWO_OF_CLUBS}`]);
  });

  it('keeps points off the first trick and hearts unled until broken', () => {
    const s = autoPass(createHearts(2));
    let x = play(s, `play:${TWO_OF_CLUBS}`);
    // Whoever follows without clubs may not drop hearts or the queen on the first trick.
    for (let k = 0; k < 3; k++) {
      const options = playableCards(x);
      const hand = x.hands[x.toAct]!;
      if (
        !hand.some((card) => suitOf(card) === CLUBS) &&
        hand.some((card) => suitOf(card) !== HEARTS && card !== QUEEN_OF_SPADES)
      )
        expect(options.every((card) => suitOf(card) !== HEARTS && card !== QUEEN_OF_SPADES)).toBe(
          true,
        );
      x = applyHeartsAction(x, `play:${options[0]}`);
    }
    expect(x.tricks).toBe(1);
    const leader = x.hands[x.toAct]!;
    if (!x.heartsBroken && leader.some((card) => suitOf(card) !== HEARTS))
      expect(playableCards(x).some((card) => suitOf(card) === HEARTS)).toBe(false);
  });

  it('scores hearts and the queen, and a moon shot gives the others 26', () => {
    const done = finish(createHearts(3));
    expect(done.phase).toBe('done');
    expect(done.handPoints!.reduce((a, b) => a + b, 0)).toBe(done.moon === null ? 26 : 78);
    expect(done.scores).toEqual(done.handPoints);
    // A rigged hand: seat 0 gets every heart and the queen in its tricks.
    const rigged = structuredClone(done);
    rigged.taken = [
      [...Array(13).keys()].map((r) => c(HEARTS, r + 1)).concat(QUEEN_OF_SPADES),
      [],
      [],
      [],
    ];
    const pts = rigged.taken.map((cards) =>
      cards.reduce(
        (a, card) => a + (card === QUEEN_OF_SPADES ? 13 : suitOf(card) === HEARTS ? 1 : 0),
        0,
      ),
    );
    expect(pts[0]).toBe(26);
  });

  it('ends the game at 100 with the lowest score winning, and replays', () => {
    let s = createHearts(4);
    for (let hand = 0; hand < 40 && s.winner === null; hand++) {
      s = finish(s);
      if (s.winner === null) s = applyHeartsAction(s, 'next');
    }
    expect(s.winner).not.toBeNull();
    expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(100);
    expect(s.scores[s.winner!]).toBe(Math.min(...s.scores));
    expect(replayHearts(4, s.history)).toEqual(s);
    expect(isValidHeartsState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidHeartsState({ ...s, scores: [0, 0, 0, 0] })).toBe(false);
  });
});

describe('Hearts opponents', () => {
  it('passes the queen of spades when short in spades', () => {
    const hand = [
      QUEEN_OF_SPADES,
      c(SPADES, 4),
      c(HEARTS, 1),
      c(HEARTS, 13),
      c(CLUBS, 2),
      c(CLUBS, 5),
      c(CLUBS, 9),
      c(DIAMONDS, 3),
      c(DIAMONDS, 6),
      c(DIAMONDS, 8),
      c(DIAMONDS, 10),
      c(DIAMONDS, 11),
      c(CLUBS, 7),
    ];
    expect(choosePass(hand, true)).toEqual(
      [QUEEN_OF_SPADES, c(HEARTS, 1), c(HEARTS, 13)].sort((a, b) => a - b),
    );
  });

  it('ducks under the winning card and dumps the queen when void', () => {
    const s = autoPass(createHearts(5));
    const x = structuredClone(s);
    x.tricks = 3;
    x.toAct = 1;
    x.trick = [{ seat: 0, card: c(DIAMONDS, 10) }];
    x.hands[1] = [c(DIAMONDS, 4), c(DIAMONDS, 9), c(DIAMONDS, 12), c(CLUBS, 3)];
    expect(mediumPlay(x)).toBe(c(DIAMONDS, 9));
    x.hands[1] = [QUEEN_OF_SPADES, c(CLUBS, 3), c(HEARTS, 7)];
    expect(mediumPlay(x)).toBe(QUEEN_OF_SPADES);
  });

  it('samples deals that respect hand sizes and the suits players showed out of', () => {
    const s = autoPass(createHearts(6));
    const x = structuredClone(s);
    x.shownOut = [[], [HEARTS], [], []];
    const rng = new Rng(2);
    for (let k = 0; k < 20; k++) {
      const w = sampleWorld(x, 0, rng);
      expect(w.hands.map((h) => h.length)).toEqual(x.hands.map((h) => h.length));
      expect(w.hands[0]).toEqual(x.hands[0]);
      // Only the hearts we passed to seat 1 ourselves may still be there.
      expect(
        w.hands[1]!.filter((card) => suitOf(card) === HEARTS).every((card) =>
          x.passes[0]!.includes(card),
        ),
      ).toBe(true);
      expect(new Set(w.hands.flat()).size).toBe(52);
    }
    expect(playableCards(x)).toContain(Number(levelAction(x, 'hard', rng).slice(5)));
    expect(searchPlay(x, 4, rng).nodes).toBeGreaterThanOrEqual(0);
  });

  it('Medium takes fewer points than Easy and Random (seeded hands)', () => {
    const agent = (id: string) => AGENT_PRESETS.find((p) => p.id === id)!.create();
    const vs = (a: string, b: string) =>
      evaluateAgents(heartsEnv, agent(a), agent(b), { games: 200, seed: 7, maxSteps: 200 })
        .agents[0].averageReturn;
    expect(vs('medium', 'random')).toBeGreaterThan(0.1);
    expect(vs('medium', 'easy')).toBeGreaterThan(0);
  }, 60_000);
});

describeAdapterContract(heartsEnv, {
  configs: [undefined],
  playouts: 10,
  maxSteps: 100,
  illegalActions: (s) =>
    ['play:99', 'pass:1', 'x'].filter((a) => !legalHeartsActions(s).includes(a)),
  checkObservation: (s, player) => {
    const view = heartsEnv.getObservation(s, player) as HeartsState;
    view.hands.forEach((h, i) => {
      if (i !== player) expect(h.every((card) => card === -1)).toBe(true);
    });
  },
});
