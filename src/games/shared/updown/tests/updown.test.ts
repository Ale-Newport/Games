import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../../ai/protocols/contract-suite';
import { Rng } from '../../../../core/game-engine/random';
import { CLUBS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import { UNKNOWN, maskUpDown, planUpDown } from '../ai';
import {
  GOLF,
  TRIPEAKS,
  applyUpDownMove,
  dealUpDown,
  fits,
  isFree,
  isLegalUpDownMove,
  isValidUpDownState,
  legalUpDownMoves,
  replayUpDown,
  type UpDownState,
} from '../engine';
import { createUpDownEnv } from '../environment';

describe('up-or-down layouts', () => {
  it('builds three peaks of 28 cards and seven golf columns of five', () => {
    expect(TRIPEAKS.coveredBy).toHaveLength(28);
    const s = dealUpDown(TRIPEAKS, 4);
    expect(s.tableau.map((_, i) => isFree(TRIPEAKS, s, i)).filter(Boolean)).toHaveLength(10);
    expect(s.stock).toHaveLength(23);
    expect(s.waste).toHaveLength(1);
    expect(TRIPEAKS.coveredBy[0]).toEqual([3, 4]);
    expect(TRIPEAKS.coveredBy[17]).toEqual([26, 27]);
    const g = dealUpDown(GOLF, 4);
    expect(g.stock).toHaveLength(16);
    expect(g.tableau.map((_, i) => isFree(GOLF, g, i)).filter(Boolean)).toHaveLength(7);
    expect(g.score).toBe(35);
  });

  it('plays one rank up or down, wrapping only in TriPeaks', () => {
    expect(fits(TRIPEAKS, c(SPADES, 13), c(HEARTS, 1))).toBe(true);
    expect(fits(GOLF, c(SPADES, 13), c(HEARTS, 1))).toBe(false);
    expect(fits(GOLF, c(SPADES, 7), c(CLUBS, 8))).toBe(true);
    expect(fits(GOLF, c(SPADES, 7), c(CLUBS, 7))).toBe(false);
  });
});

describe('up-or-down rules', () => {
  const golf = (over: Partial<UpDownState>): UpDownState => ({
    ...dealUpDown(GOLF, 1),
    tableau: Array(35).fill(-1),
    stock: [],
    waste: [c(SPADES, 5)],
    ...over,
  });

  it('scores golf strokes and wins with the stock left as a bonus', () => {
    const t = Array(35).fill(-1);
    t[4] = c(HEARTS, 6);
    const s = golf({ tableau: t, stock: [c(CLUBS, 2), c(CLUBS, 3)], score: 1 });
    const won = applyUpDownMove(GOLF, s, 'p4');
    expect(won.result).toBe('won');
    expect(won.score).toBe(-2);
  });

  it('loses with an empty stock and nothing that fits', () => {
    const t = Array(35).fill(-1);
    t[4] = c(HEARTS, 9);
    const s = golf({ tableau: t, stock: [c(CLUBS, 2)] });
    const lost = applyUpDownMove(GOLF, s, 'draw');
    expect(lost.result).toBe('lost');
  });

  it('scores TriPeaks runs and peak tops, and resets the run on a draw', () => {
    let s = dealUpDown(TRIPEAKS, 7);
    const play = legalUpDownMoves(TRIPEAKS, s).find((m) => m !== 'draw');
    if (play) {
      s = applyUpDownMove(TRIPEAKS, s, play);
      expect(s.run).toBe(1);
      expect(s.score).toBe(1);
    }
    s = applyUpDownMove(TRIPEAKS, s, 'draw');
    expect(s.run).toBe(0);
  });

  it('agrees with the full move list over random games and validates by replay', () => {
    for (const L of [TRIPEAKS, GOLF]) {
      const rng = new Rng(9);
      let s = dealUpDown(L, 9);
      const every = ['draw', ...L.coveredBy.map((_, i) => `p${i}`)];
      while (!s.result) {
        const legal = legalUpDownMoves(L, s).sort();
        expect(every.filter((m) => isLegalUpDownMove(L, s, m)).sort()).toEqual(legal);
        s = applyUpDownMove(L, s, rng.pick(legal));
      }
      expect(replayUpDown(L, 9, s.history)).toEqual(s);
      expect(isValidUpDownState(L, JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(isValidUpDownState(L, { ...s, score: s.score + 1 })).toBe(false);
    }
  });
});

describe('up-or-down agents', () => {
  it('hide covered TriPeaks cards and the stock, and plan chains', () => {
    const s = dealUpDown(TRIPEAKS, 2);
    const view = maskUpDown(TRIPEAKS, s);
    expect(view.tableau.slice(0, 18).every((x) => x === UNKNOWN)).toBe(true);
    expect(view.tableau.slice(18)).toEqual(s.tableau.slice(18));
    expect(view.stock.every((x) => x === UNKNOWN)).toBe(true);
    const t = Array(35).fill(-1);
    t[4] = c(HEARTS, 6);
    t[9] = c(HEARTS, 7);
    const chain = planUpDown(
      GOLF,
      { ...dealUpDown(GOLF, 1), tableau: t, stock: [], waste: [c(SPADES, 5)] },
      100,
    );
    expect(chain.path).toEqual(['p4', 'p9']);
  });
});

describeAdapterContract(
  createUpDownEnv(TRIPEAKS, { id: 'updown-test', version: '1.0.0', rulesetId: 't' }),
  {
    configs: [undefined],
    playouts: 6,
    maxSteps: 200,
    illegalActions: (s) =>
      ['p99', 'p-1', 'x', ''].filter((a) => !legalUpDownMoves(TRIPEAKS, s).includes(a)),
  },
);
