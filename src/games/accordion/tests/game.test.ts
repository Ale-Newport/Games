import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { AGENT_PRESETS, planAccordion } from '../ai';
import { accordionEnv } from '../ai-adapter';
import { ACCORDION as def } from '../definition';
import {
  applyAccordionMove,
  dealAccordion,
  isLegalAccordionMove,
  isValidAccordionState,
  legalAccordionMoves,
  pilesLeft,
  replayAccordion,
  type AccordionState,
} from '../engine';

const dealt = (seed: number, n: number) => {
  let s = dealAccordion(seed);
  for (let i = 0; i < n; i++) s = applyAccordionMove(s, 'deal');
  return s;
};

describe('Accordion engine', () => {
  it('deals one card at a time to the right of the row', () => {
    const s = dealt(1, 6);
    expect(s.piles).toHaveLength(6);
    expect(s.stock).toHaveLength(46);
    expect(pilesLeft(s)).toBe(52);
  });

  it('moves a pile one or three to the left on a matching suit or rank (deal 1)', () => {
    const s = dealt(1, 6); // K♦ Q♣ 9♥ 6♣ 6♥ K♣
    expect(legalAccordionMoves(s)).toEqual(['p4-1', 'deal']);
    const a = applyAccordionMove(s, 'p4-1'); // 6♥ on 6♣
    expect(a.piles).toHaveLength(5);
    expect(legalAccordionMoves(a)).toContain('p4-3'); // K♣ onto Q♣, three to the left
    const b = applyAccordionMove(a, 'p4-3');
    expect(b.piles[1]).toHaveLength(2);
    expect(isLegalAccordionMove(b, 'p3-2')).toBe(false);
  });

  it('wins with one pile and nothing to deal, loses when stuck', () => {
    const base: AccordionState = { ...dealAccordion(1), stock: [] };
    const won = applyAccordionMove({ ...base, piles: [[c(SPADES, 2)], [c(SPADES, 9)]] }, 'p1-1');
    expect(won.result).toBe('won');
    const stuck = applyAccordionMove(
      { ...base, stock: [c(DIAMONDS, 5)], piles: [[c(SPADES, 2)], [c(HEARTS, 9)]] },
      'deal',
    );
    expect(stuck.result).toBe('lost');
    expect(pilesLeft(stuck)).toBe(3);
    void CLUBS;
  });

  it('agrees with the full move list over a random game and validates by replay', () => {
    const rng = new Rng(3);
    let s = dealAccordion(3);
    while (!s.result) {
      const legal = legalAccordionMoves(s).sort();
      const every = ['deal', ...s.piles.flatMap((_, i) => [`p${i}-1`, `p${i}-3`])];
      expect(every.filter((m) => isLegalAccordionMove(s, m)).sort()).toEqual(legal);
      s = applyAccordionMove(s, rng.pick(legal));
    }
    expect(replayAccordion(3, s.history)).toEqual(s);
    expect(isValidAccordionState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidAccordionState({ ...s, seed: 4 })).toBe(false);
  });
});

describe('Accordion agents', () => {
  it('plans the shortest row among the dealt cards', () => {
    const plan = planAccordion(dealt(1, 6), 500);
    // Six piles close up into two: K♦ Q♣ 9♥ 6♣ 6♥ K♣ → four moves.
    let s = dealt(1, 6);
    for (const m of plan.path) s = applyAccordionMove(s, m);
    expect(s.piles).toHaveLength(2);
    expect(plan.path[0]).toBe('p4-1');
  });

  it('the planner leaves fewer piles than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(accordionEnv, preset('planner'), preset('greedy'), {
      games: 20,
      seed: 1,
      maxSteps: 200,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 120_000);
});

describe('Accordion definition', () => {
  it('wraps the row onto lines of eight and maps taps to moves', () => {
    const s = dealt(1, 12);
    const piles = def.piles(s);
    expect(piles).toHaveLength(13);
    expect(piles[9]!.y).toBeGreaterThan(piles[1]!.y!);
    const six = dealt(1, 6);
    expect(def.moveTo(six, { pile: 'p4', index: 0 }, 'p3')).toBe('p4-1');
    expect(def.moveTo(six, { pile: 'p4', index: 0 }, 'p2')).toBeNull();
    expect(def.canPick(six, { pile: 'p0', index: 0 })).toBe(false);
  });
});

describeAdapterContract(accordionEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 200,
  illegalActions: (s) => ['p0-1', 'p60-3', 'x'].filter((a) => !legalAccordionMoves(s).includes(a)),
});
