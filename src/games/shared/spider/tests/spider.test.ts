import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../../ai/protocols/contract-suite';
import { Rng } from '../../../../core/game-engine/random';
import { HEARTS, SPADES, makeCard as c, suitOf, type Suit } from '../../cards/cards';
import { HIDDEN, maskSpider, planSpider } from '../ai';
import {
  applySpiderMove,
  dealSpider,
  isLegalSpiderMove,
  isValidSpiderState,
  legalSpiderMoves,
  replaySpider,
  type SpiderState,
} from '../engine';
import { createSpiderEnv } from '../environment';

const blank = (over: Partial<SpiderState>): SpiderState => ({
  seed: 1,
  suits: 2,
  stock: [],
  columns: Array.from({ length: 10 }, () => []),
  down: Array(10).fill(0),
  completed: [],
  history: [],
  score: 500,
  result: null,
  ...over,
});
/** King down to `low` of one suit, as card ids (copy k keeps them distinct). */
const run = (suit: Suit, low = 1, k = 0) =>
  Array.from({ length: 14 - low }, (_, i) => c(suit, 13 - i) + 52 * k);

describe('Spider deal', () => {
  it('deals 54 cards into 6 6 6 6 5 5 5 5 5 5 with 50 in the stock', () => {
    const s = dealSpider(3, 4);
    expect(s.columns.map((p) => p.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(s.stock).toHaveLength(50);
    expect(new Set([...s.stock, ...s.columns.flat()]).size).toBe(104);
    expect(
      dealSpider(3, 1)
        .columns.flat()
        .every((x) => suitOf(x) === SPADES),
    ).toBe(true);
    expect(new Set(dealSpider(3, 2).columns.flat().map(suitOf))).toEqual(new Set([0, 1]));
  });
});

describe('Spider rules', () => {
  it('builds on any suit but moves several cards only as a one-suit run', () => {
    const s = blank({
      columns: [
        [c(SPADES, 9), c(SPADES, 8), c(HEARTS, 7)],
        [c(HEARTS, 10)],
        [c(SPADES, 8) + 52],
        [c(HEARTS, 9) + 52, c(HEARTS, 8) + 52],
        ...Array.from({ length: 6 }, (_, i) => [c(SPADES, 1) + 52 * i]),
      ],
    });
    const legal = legalSpiderMoves(s);
    expect(legal).toContain('c0:2>c2'); // the 7♥ onto another 8♠: any suit will do
    expect(legal).not.toContain('c0:1>c1'); // 8♠ 7♥ is not one suit, so it cannot move together
    expect(legal).toContain('c3:0>c1'); // 9♥ 8♥ moves as a run onto the 10♥
    expect(isLegalSpiderMove(s, 'c2:0>c1')).toBe(false); // wrong rank
  });

  it('removes a complete run, scores it and turns up the card beneath', () => {
    const s = blank({
      columns: [
        [c(HEARTS, 4), ...run(SPADES, 2)],
        [c(SPADES, 1)],
        ...Array.from({ length: 8 }, (_, i) => [c(HEARTS, 9) + 52 * (i % 2)]),
      ],
      down: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    const after = applySpiderMove(s, 'c1:0>c0');
    expect(after.columns[0]).toEqual([c(HEARTS, 4)]);
    expect(after.down[0]).toBe(0);
    expect(after.completed).toEqual([c(SPADES, 13)]);
    expect(after.score).toBe(500 - 1 + 100);
  });

  it('does not deal while a column is empty, and deals one card per column', () => {
    const stock = Array.from({ length: 10 }, (_, i) => c(HEARTS, 2) + 52 * (i % 2));
    const s = blank({ stock, columns: [[], ...Array.from({ length: 9 }, () => [c(SPADES, 5)])] });
    expect(legalSpiderMoves(s)).not.toContain('deal');
    const full = blank({ stock, columns: Array.from({ length: 10 }, () => [c(SPADES, 5)]) });
    const dealt = applySpiderMove(full, 'deal');
    expect(dealt.columns.every((p) => p.length === 2)).toBe(true);
    expect(dealt.stock).toHaveLength(0);
  });

  it('wins with eight runs and loses with no move left', () => {
    const s = blank({
      completed: Array.from({ length: 7 }, (_, i) => c(SPADES, 13) + 52 * i),
      columns: [run(HEARTS, 2), [c(HEARTS, 1)], [], [], [], [], [], [], [], []],
    });
    expect(applySpiderMove(s, 'c1:0>c0').result).toBe('won');
    // Ten aces and nothing in the stock: no card can go anywhere.
    const dead = blank({ columns: Array.from({ length: 10 }, (_, i) => [c(SPADES, 1) + 52 * i]) });
    expect(legalSpiderMoves(dead)).toEqual([]);
  });

  it('agrees with the full move list when checking a single move', () => {
    const every = ['deal'];
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++) for (let k = 0; k < 60; k++) every.push(`c${i}:${k}>c${j}`);
    const rng = new Rng(4);
    let s = dealSpider(4, 2);
    for (let step = 0; step < 150 && !s.result; step++) {
      const legal = legalSpiderMoves(s).sort();
      expect(every.filter((m) => isLegalSpiderMove(s, m)).sort()).toEqual(legal);
      s = applySpiderMove(s, rng.pick(legal));
    }
  });

  it('validates saves by replay', () => {
    let s = dealSpider(6, 1);
    for (let i = 0; i < 15; i++) s = applySpiderMove(s, legalSpiderMoves(s)[i % 2]!);
    expect(replaySpider(6, 1, s.history)).toEqual(s);
    expect(isValidSpiderState(JSON.parse(JSON.stringify(s)), 1)).toBe(true);
    expect(isValidSpiderState(s, 2)).toBe(false);
    expect(isValidSpiderState({ ...s, score: 1 }, 1)).toBe(false);
  });
});

describe('Spider planner', () => {
  it('sees only face-up cards and finds moves that complete a run', () => {
    const s = dealSpider(2, 1);
    const view = maskSpider(s);
    expect(view.stock.every((x) => x === HIDDEN)).toBe(true);
    expect(view.columns[0]!.slice(0, 5).every((x) => x === HIDDEN)).toBe(true);
    const near = blank({
      columns: [run(SPADES, 2), [c(SPADES, 1)], ...Array.from({ length: 8 }, () => [c(HEARTS, 6)])],
    });
    expect(planSpider(near, 1000).path[0]).toBe('c1:0>c0');
  });
});

describeAdapterContract(
  createSpiderEnv(2, { id: 'spider-test', version: '1.0.0', rulesetId: 't' }),
  {
    configs: [undefined],
    playouts: 3,
    maxSteps: 300,
    allowTruncation: true,
    illegalActions: (s) =>
      ['c9:30>c0', 'deal2', 'x', ''].filter((a) => !legalSpiderMoves(s).includes(a)),
  },
);
