import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { dealSpider, legalSpiderMoves } from '../../shared/spider/engine';
import { AGENT_PRESETS, spiderEnv } from '../ai-adapter';
import { SPIDER as def } from '../Game';

describe('Spider Four Suits definition', () => {
  it('lays out eight run slots, the stock and ten columns', () => {
    const s = dealSpider(1, 4);
    const piles = def.piles(s);
    expect(piles).toHaveLength(19);
    expect(piles.find((p) => p.id === 'stock')!.cards).toHaveLength(50);
    expect(def.info!(s, (k, p) => `${k}:${p?.n}`)).toBe('info.deals:5');
    expect(def.mode).toBe('suits-4');
  });

  it('maps taps and drops to moves', () => {
    const s = dealSpider(1, 4);
    // Deal 1: the 4♠ on column 3 goes onto the 5♠ of column 7.
    expect(def.moveTo(s, { pile: 'c2', index: 5 }, 'c6')).toBe('c2:5>c6');
    expect(def.autoMove(s, { pile: 'c2', index: 5 })).toBe('c2:5>c6');
    expect(def.canPick(s, { pile: 'c2', index: 4 })).toBe(false); // face down
    expect(def.stockMove(s)).toBe('deal');
    expect(def.sound(s, 'deal', def.apply(s, 'deal'))).toBe('draw');
  });
});

describeAdapterContract(spiderEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 300,
  allowTruncation: true,
  illegalActions: (s) => ['c9:40>c0', 'x', ''].filter((a) => !legalSpiderMoves(s).includes(a)),
});

describe('Spider Four Suits agents', () => {
  it('the planner completes more runs than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(spiderEnv, preset('planner'), preset('greedy'), {
      games: 4,
      seed: 1,
      maxSteps: 1600,
      timeLimitMs: 100,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 240_000);
});
