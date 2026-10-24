import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../../ai/protocols/contract-suite';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import { HIDDEN, maskKlondike, planKlondike, usefulMoves } from '../ai';
import {
  applyKlondikeMove,
  dealKlondike,
  fitsFoundation,
  fitsTableau,
  isLegalKlondikeMove,
  isValidKlondikeState,
  legalKlondikeMoves,
  replayKlondike,
  type KlondikeState,
} from '../engine';
import { createKlondikeEnv } from '../environment';

const blank = (over: Partial<KlondikeState>): KlondikeState => ({
  seed: 1,
  draw: 1,
  stock: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: [[], [], [], [], [], [], []],
  down: [0, 0, 0, 0, 0, 0, 0],
  history: [],
  score: 0,
  recycles: 0,
  quiet: 0,
  result: null,
  ...over,
});
const suit = (s: 0 | 1 | 2 | 3, upTo = 13) => Array.from({ length: upTo }, (_, i) => c(s, i + 1));

describe('Klondike deal', () => {
  it('deals 1…7 cards with only the top face up and 24 in the stock, by seed', () => {
    const s = dealKlondike(42, 1);
    expect(s.tableau.map((p) => p.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(s.down).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(s.stock).toHaveLength(24);
    const all = [...s.stock, ...s.tableau.flat()];
    expect(new Set(all).size).toBe(52);
    expect(dealKlondike(42, 1)).toEqual(s);
    expect(dealKlondike(43, 1)).not.toEqual(s);
  });
});

describe('Klondike rules', () => {
  it('builds tableau down in alternating colors and foundations up by suit', () => {
    expect(fitsTableau([c(SPADES, 10)], c(HEARTS, 9))).toBe(true);
    expect(fitsTableau([c(SPADES, 10)], c(CLUBS, 9))).toBe(false);
    expect(fitsTableau([], c(DIAMONDS, 13))).toBe(true);
    expect(fitsTableau([], c(DIAMONDS, 12))).toBe(false);
    expect(fitsFoundation([], c(CLUBS, 1))).toBe(true);
    expect(fitsFoundation([c(CLUBS, 1)], c(CLUBS, 2))).toBe(true);
    expect(fitsFoundation([c(CLUBS, 1)], c(SPADES, 2))).toBe(false);
  });

  it('draws one or three, recycles with a penalty', () => {
    const one = blank({
      stock: [c(SPADES, 9), c(SPADES, 8)],
      tableau: [[c(HEARTS, 2)], [], [], [], [], [], []],
    });
    const d1 = applyKlondikeMove(one, 'draw');
    expect(d1.waste).toEqual([c(SPADES, 8)]);
    const d2 = applyKlondikeMove(applyKlondikeMove(d1, 'draw'), 'draw');
    expect(d2.stock).toEqual([c(SPADES, 9), c(SPADES, 8)]);
    expect(d2.recycles).toBe(1);
    const three = blank({
      draw: 3,
      stock: [1, 2, 3, 4],
      tableau: [[c(HEARTS, 2)], [], [], [], [], [], []],
    });
    expect(applyKlondikeMove(three, 'draw').waste).toEqual([4, 3, 2]);
    // −100 in draw one (but never below zero).
    expect(applyKlondikeMove({ ...d2, score: 150, stock: [], waste: [5] }, 'draw').score).toBe(50);
  });

  it('moves runs, turns the uncovered card up and scores', () => {
    const s = blank({
      tableau: [[c(CLUBS, 4), c(SPADES, 10), c(HEARTS, 9)], [c(DIAMONDS, 11)], [], [], [], [], []],
      down: [1, 0, 0, 0, 0, 0, 0],
      waste: [c(DIAMONDS, 9)],
      stock: [c(SPADES, 1)],
    });
    expect(legalKlondikeMoves(s)).not.toContain('w>t1'); // a red 9 cannot go on a red jack
    const run = applyKlondikeMove(s, 't0:1>t1');
    expect(run.tableau[1]).toEqual([c(DIAMONDS, 11), c(SPADES, 10), c(HEARTS, 9)]);
    expect(run.down[0]).toBe(0); // the 4 of clubs turned up
    expect(run.score).toBe(5);
    const home = applyKlondikeMove(blank({ waste: [c(HEARTS, 1)], stock: [2] }), 'w>f2');
    expect(home.foundations[2]).toEqual([c(HEARTS, 1)]);
    expect(home.score).toBe(10);
    const back = applyKlondikeMove(
      { ...home, score: 40, tableau: [[c(SPADES, 2)], [], [], [], [], [], []] },
      'f2>t0',
    );
    expect(back.score).toBe(25);
  });

  it('wins with every card home', () => {
    const s = blank({
      foundations: [suit(SPADES, 12), suit(HEARTS), suit(DIAMONDS), suit(CLUBS)],
      tableau: [[c(SPADES, 13)], [], [], [], [], [], []],
    });
    const won = applyKlondikeMove(s, 't0>f0');
    expect(won.result).toBe('won');
    expect(legalKlondikeMoves(won)).toEqual([]);
  });

  it('declares the deal lost only after a full pass with nothing but draws', () => {
    const tops = [
      c(SPADES, 2),
      c(CLUBS, 2),
      c(SPADES, 4),
      c(CLUBS, 4),
      c(SPADES, 6),
      c(CLUBS, 6),
      c(SPADES, 8),
    ];
    let s = blank({ tableau: tops.map((t) => [t]), stock: [c(SPADES, 10), c(CLUBS, 10)] });
    expect(legalKlondikeMoves(s)).toEqual(['draw']);
    for (let i = 0; i < 3; i++) {
      s = applyKlondikeMove(s, 'draw');
      expect(s.result).toBeNull();
    }
    s = applyKlondikeMove(s, 'draw');
    expect(s.result).toBe('lost');
  });

  it('agrees with the full move list when checking a single move', () => {
    const every: string[] = ['draw'];
    for (let i = 0; i < 7; i++) {
      every.push(`w>t${i}`);
      for (let j = 0; j < 4; j++) every.push(`t${i}>f${j}`, `f${j}>t${i}`);
      for (let j = 0; j < 7; j++) for (let k = 0; k < 20; k++) every.push(`t${i}:${k}>t${j}`);
    }
    for (let j = 0; j < 4; j++) every.push(`w>f${j}`);
    for (const seed of [1, 2, 3]) {
      let s = dealKlondike(seed, 1);
      for (let step = 0; step < 120 && !s.result; step++) {
        const legal = legalKlondikeMoves(s).sort();
        expect(every.filter((m) => isLegalKlondikeMove(s, m)).sort()).toEqual(legal);
        s = applyKlondikeMove(s, legal[(step * 7) % legal.length]!);
      }
    }
  });

  it('validates saves by replaying the deal', () => {
    let s = dealKlondike(7, 3);
    for (let i = 0; i < 12; i++) s = applyKlondikeMove(s, legalKlondikeMoves(s)[0]!);
    expect(replayKlondike(7, 3, s.history)).toEqual(s);
    expect(isValidKlondikeState(JSON.parse(JSON.stringify(s)), 3)).toBe(true);
    expect(isValidKlondikeState(s, 1)).toBe(false);
    expect(isValidKlondikeState({ ...s, score: s.score + 1 }, 3)).toBe(false);
    expect(() => applyKlondikeMove(s, 't9>f0')).toThrow();
  });
});

describe('Klondike agents', () => {
  it('hides face-down cards and the unseen stock from the planner', () => {
    const s = dealKlondike(5, 1);
    const view = maskKlondike(s);
    expect(view.tableau[6]!.slice(0, 6).every((x) => x === HIDDEN)).toBe(true);
    expect(view.tableau[6]![6]).toBe(s.tableau[6]![6]);
    expect(view.stock.every((x) => x === HIDDEN)).toBe(true);
    expect(maskKlondike({ ...s, recycles: 1 }).stock).toEqual(s.stock);
  });

  it('skips moves that only shuffle cards and finds a winning line', () => {
    const s = blank({
      foundations: [suit(SPADES, 11), suit(HEARTS, 12), suit(DIAMONDS), suit(CLUBS)],
      tableau: [[c(SPADES, 13), c(HEARTS, 13)], [c(SPADES, 12)], [], [], [], [], []],
    });
    expect(usefulMoves(s)).not.toContain('f1>t1');
    const plan = planKlondike(s, 2000);
    expect(plan.won).toBe(true);
    let end = s;
    for (const m of plan.path) end = applyKlondikeMove(end, m);
    expect(end.result).toBe('won');
  });
});

describeAdapterContract(
  createKlondikeEnv(1, { id: 'klondike-test', version: '1.0.0', rulesetId: 't' }),
  {
    configs: [undefined],
    playouts: 3,
    maxSteps: 1600,
    illegalActions: (s) =>
      ['t9>f0', 'w>t9', 'x', ''].filter((a) => !legalKlondikeMoves(s).includes(a)),
  },
);
