import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { dealColumns, legalColumnsMoves } from '../../shared/columns/engine';
import { AGENT_PRESETS, yukonEnv } from '../ai-adapter';
import { YUKON_GAME as def } from '../Game';
import { VARIANT } from '../rules';

describe('Yukon definition', () => {
  it('lays out four foundations over seven columns', () => {
    const s = dealColumns(VARIANT, 1);
    const piles = def.piles(s);
    expect(piles.map((p) => p.id)).toEqual([
      'f0',
      'f1',
      'f2',
      'f3',
      'c0',
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
      'c6',
    ]);
    expect(def.info).toBeUndefined();
  });

  it('moves a face-up card with the cards on it (deal 1)', () => {
    const s = dealColumns(VARIANT, 1);
    expect(legalColumnsMoves(VARIANT, s)).toEqual(['c3:5>c1', 'c5:5>c1']);
    expect(def.moveTo(s, { pile: 'c3', index: 5 }, 'c1')).toBe('c3:5>c1');
    expect(def.autoMove(s, { pile: 'c5', index: 5 })).toBe('c5:5>c1');
    expect(def.canPick(s, { pile: 'c3', index: 2 })).toBe(false);
  });
});

describe('Yukon agents', () => {
  it('the planner brings more cards home than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(yukonEnv, preset('planner'), preset('greedy'), {
      games: 10,
      seed: 1,
      maxSteps: 1010,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 180_000);
});

describeAdapterContract(yukonEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 300,
  allowTruncation: true,
  illegalActions: (s) =>
    ['c9:0>c0', 'deal', 'x'].filter((a) => !legalColumnsMoves(VARIANT, s).includes(a)),
});
