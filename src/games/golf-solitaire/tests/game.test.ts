import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { dealUpDown, legalUpDownMoves } from '../../shared/updown/engine';
import { AGENT_PRESETS, golfEnv } from '../ai-adapter';
import { GOLF_GAME as def } from '../Game';
import { LAYOUT } from '../rules';

describe('Golf definition', () => {
  it('lays out seven fanned columns of face-up cards over the stock and waste', () => {
    const s = dealUpDown(LAYOUT, 3);
    const piles = def.piles(s);
    expect(piles).toHaveLength(37);
    expect(piles.slice(0, 35).every((p) => p.cards[0]!.up)).toBe(true);
    expect(piles[4]!.y).toBeGreaterThan(piles[0]!.y!);
    expect(def.score(s)).toBe(35);
    expect(def.info!(s, (k, p) => `${k}:${JSON.stringify(p)}`)).toBe('info.stock:{"n":16}');
  });

  it('plays column tops one rank from the waste (deal 3: 3♥)', () => {
    const s = dealUpDown(LAYOUT, 3);
    expect(legalUpDownMoves(LAYOUT, s)).toEqual(['p19', 'p29', 'p34', 'draw']);
    expect(def.autoMove(s, { pile: 'p19', index: 0 })).toBe('p19');
    expect(def.canPick(s, { pile: 'p18', index: 0 })).toBe(false); // under another card
    expect(def.score(def.apply(s, 'p19'))).toBe(34);
  });
});

describe('Golf agents', () => {
  it('the planner leaves fewer cards than the random player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(golfEnv, preset('planner'), preset('random'), {
      games: 20,
      seed: 1,
      maxSteps: 200,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 120_000);
});

describeAdapterContract(golfEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 200,
  illegalActions: (s) => ['p40', 'x', ''].filter((a) => !legalUpDownMoves(LAYOUT, s).includes(a)),
});
