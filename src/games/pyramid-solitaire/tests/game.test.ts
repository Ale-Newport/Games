import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { AGENT_PRESETS, maskPyramid, planPyramid } from '../ai';
import { pyramidEnv } from '../ai-adapter';
import { PYRAMID as def } from '../definition';
import {
  applyPyramidMove,
  dealPyramid,
  isFree,
  isLegalPyramidMove,
  isValidPyramidState,
  legalPyramidMoves,
  replayPyramid,
  rowOf,
  type PyramidState,
} from '../engine';

/** A pyramid with every card removed except the given positions. */
const only = (cards: Record<number, number>, over: Partial<PyramidState> = {}): PyramidState => ({
  ...dealPyramid(1),
  pyramid: Array.from({ length: 28 }, (_, i) => cards[i] ?? -1),
  stock: [],
  waste: [],
  ...over,
});

describe('Pyramid engine', () => {
  it('deals 28 cards in seven rows and 24 in the stock; only the bottom row is free', () => {
    const s = dealPyramid(2);
    expect(s.pyramid).toHaveLength(28);
    expect(s.stock).toHaveLength(24);
    expect([0, 6, 20, 21, 27].map(rowOf)).toEqual([0, 3, 5, 6, 6]);
    expect(s.pyramid.map((_, i) => isFree(s, i)).filter(Boolean)).toHaveLength(7);
    expect(isFree(s, 0)).toBe(false);
  });

  it('frees a card once both cards below it are gone', () => {
    const s = only({ 15: c(SPADES, 3), 21: c(HEARTS, 6), 22: c(CLUBS, 7) });
    expect(isFree(s, 15)).toBe(false);
    const after = applyPyramidMove(s, 'p21+p22');
    expect(isFree(after, 15)).toBe(true);
  });

  it('removes pairs making 13 and kings alone (deal 2)', () => {
    const s = dealPyramid(2);
    expect(legalPyramidMoves(s)).toEqual(['p21', 'p24+p27', 'p25+p27', 'draw']);
    const king = applyPyramidMove(s, 'p21');
    expect(king.pyramid[21]).toBe(-1);
    expect(king.score).toBe(5);
    expect(applyPyramidMove(king, 'p24+p27').score).toBe(15);
    expect(isLegalPyramidMove(s, 'p22+p23')).toBe(false);
  });

  it('turns the waste back into the stock twice only', () => {
    let s = only({ 21: c(SPADES, 9), 22: c(SPADES, 9) + 0 }, { stock: [c(HEARTS, 2)] });
    s = { ...s, pyramid: s.pyramid.map((x, i) => (i === 22 ? c(CLUBS, 9) : x)) };
    for (let pass = 0; pass < 3; pass++) {
      s = applyPyramidMove(s, 'draw'); // turn the card
      if (pass < 2) s = applyPyramidMove(s, 'draw'); // turn the waste back
    }
    expect(s.recycles).toBe(2);
    expect(legalPyramidMoves(s)).toEqual([]);
    expect(s.result).toBe('lost');
  });

  it('wins by clearing the pyramid, stock or not', () => {
    const s = only({ 0: c(SPADES, 13) }, { stock: [c(HEARTS, 4)] });
    const won = applyPyramidMove(s, 'p0');
    expect(won.result).toBe('won');
    expect(won.score).toBe(5 + 50);
  });

  it('agrees with the full move list and validates by replay', () => {
    const every = ['draw', 'w'];
    for (let i = 0; i < 28; i++) {
      every.push(`p${i}`, `p${i}+w`);
      for (let j = i + 1; j < 28; j++) every.push(`p${i}+p${j}`);
    }
    const rng = new Rng(2);
    let s = dealPyramid(3);
    while (!s.result) {
      const legal = legalPyramidMoves(s).sort();
      expect(every.filter((m) => isLegalPyramidMove(s, m)).sort()).toEqual(legal);
      s = applyPyramidMove(s, rng.pick(legal));
    }
    expect(replayPyramid(3, s.history)).toEqual(s);
    expect(isValidPyramidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidPyramidState({ ...s, score: s.score + 5 })).toBe(false);
  });
});

describe('Pyramid agents', () => {
  it('hides the stock until it has been seen, and plans a clearing line', () => {
    const s = dealPyramid(2);
    expect(maskPyramid(s).stock.every((x) => x < -1)).toBe(true);
    expect(maskPyramid({ ...s, recycles: 1 }).stock).toEqual(s.stock);
    const near = only({ 6: c(SPADES, 13), 22: c(HEARTS, 1), 27: c(CLUBS, 12) });
    const plan = planPyramid(near, 1000);
    expect(plan.won).toBe(true);
  });

  it('the planner clears more pyramids than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(pyramidEnv, preset('planner'), preset('greedy'), {
      games: 12,
      seed: 1,
      maxSteps: 700,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 120_000);
});

describe('Pyramid definition', () => {
  it('lays out the pyramid and pairs taps', () => {
    const s = dealPyramid(2);
    const piles = def.piles(s);
    expect(piles).toHaveLength(30);
    expect(piles[27]!.y).toBeGreaterThan(piles[0]!.y!);
    expect(def.moveTo(s, { pile: 'p27', index: 0 }, 'p24')).toBe('p24+p27');
    expect(def.autoMove(s, { pile: 'p21', index: 0 })).toBe('p21');
    expect(def.autoMove(s, { pile: 'p27', index: 0 })).toMatch(/^p2[45]\+p27$/);
    expect(def.canPick(s, { pile: 'p0', index: 0 })).toBe(false);
  });
});

describeAdapterContract(pyramidEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 700,
  illegalActions: (s) => ['p40', 'p0+p0', 'x', ''].filter((a) => !legalPyramidMoves(s).includes(a)),
});
