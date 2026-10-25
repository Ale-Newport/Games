import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { dealColumns, legalColumnsMoves } from '../../shared/columns/engine';
import { AGENT_PRESETS, scorpionEnv } from '../ai-adapter';
import { SCORPION_GAME as def } from '../Game';
import { VARIANT } from '../rules';

describe('Scorpion definition', () => {
  it('lays out the reserve, four run slots and seven columns', () => {
    const s = dealColumns(VARIANT, 1);
    expect(def.piles(s).map((p) => p.id)).toEqual([
      'stock',
      'done0',
      'done1',
      'done2',
      'done3',
      'c0',
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
      'c6',
    ]);
    expect(def.info!(s, (k, p) => `${k}:${p?.n}`)).toBe('info.stock:3');
    expect(def.stockMove(s)).toBe('deal');
  });

  it('builds by suit (deal 1: the 5♣ onto the 6♣)', () => {
    const s = dealColumns(VARIANT, 1);
    expect(legalColumnsMoves(VARIANT, s)).toContain('c0:6>c6');
    expect(def.autoMove(s, { pile: 'c0', index: 6 })).toBe('c0:6>c6');
    expect(def.finishMove(s)).toBeNull();
  });
});

describe('Scorpion agents', () => {
  it('the planner gets further than random play', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(scorpionEnv, preset('planner'), preset('random'), {
      games: 6,
      seed: 1,
      maxSteps: 1010,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThanOrEqual(report.agents[1].averageReturn);
  }, 180_000);
});

describeAdapterContract(scorpionEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 300,
  allowTruncation: true,
  illegalActions: (s) =>
    ['c9:0>c0', 'w>c0', 'x'].filter((a) => !legalColumnsMoves(VARIANT, s).includes(a)),
});
