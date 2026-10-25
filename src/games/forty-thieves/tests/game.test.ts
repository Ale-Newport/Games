import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { dealColumns, legalColumnsMoves } from '../../shared/columns/engine';
import { AGENT_PRESETS, fortyThievesEnv } from '../ai-adapter';
import { FORTY_THIEVES_GAME as def } from '../Game';
import { VARIANT } from '../rules';

describe('Forty Thieves definition', () => {
  it('lays out stock, waste, eight foundations and ten columns', () => {
    const s = dealColumns(VARIANT, 2);
    const ids = def.piles(s).map((p) => p.id);
    expect(ids.slice(0, 10)).toEqual([
      'stock',
      'waste',
      'f0',
      'f1',
      'f2',
      'f3',
      'f4',
      'f5',
      'f6',
      'f7',
    ]);
    expect(ids).toHaveLength(20);
    expect(def.info!(s, (k, p) => `${k}:${p?.n}`)).toBe('info.stock:64');
  });

  it('moves single cards in suit (deal 2: the 2♥ onto the 3♥)', () => {
    const s = dealColumns(VARIANT, 2);
    expect(legalColumnsMoves(VARIANT, s)).toEqual(['c5:3>c0', 'deal']);
    expect(def.autoMove(s, { pile: 'c5', index: 3 })).toBe('c5:3>c0');
    expect(def.canPick(s, { pile: 'c5', index: 2 })).toBe(false); // one card at a time
    expect(def.stockMove(s)).toBe('deal');
  });
});

describe('Forty Thieves agents', () => {
  it('the planner brings more cards home than random play', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(fortyThievesEnv, preset('planner'), preset('random'), {
      games: 4,
      seed: 1,
      maxSteps: 1510,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 180_000);
});

describeAdapterContract(fortyThievesEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 300,
  allowTruncation: true,
  illegalActions: (s) =>
    ['c10:0>c0', 'w>f9', 'x'].filter((a) => !legalColumnsMoves(VARIANT, s).includes(a)),
});
