import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { dealUpDown, legalUpDownMoves } from '../../shared/updown/engine';
import { AGENT_PRESETS, triPeaksEnv } from '../ai-adapter';
import { TRIPEAKS_GAME as def } from '../Game';
import { LAYOUT } from '../rules';

describe('TriPeaks definition', () => {
  it('lays out three peaks over the stock and waste, face down where covered', () => {
    const s = dealUpDown(LAYOUT, 1);
    const piles = def.piles(s);
    expect(piles).toHaveLength(30);
    expect(piles[0]!.cards[0]!.up).toBe(false);
    expect(piles[27]!.cards[0]!.up).toBe(true);
    expect(def.tapPlays).toBe(true);
    expect(def.info!(s, (k, p) => `${k}:${JSON.stringify(p)}`)).toBe('info.run:{"run":0,"n":23}');
  });

  it('plays a card with a single tap or a drop on the waste (deal 1)', () => {
    const s = dealUpDown(LAYOUT, 1);
    expect(legalUpDownMoves(LAYOUT, s)).toEqual(['p20', 'p22', 'draw']);
    expect(def.autoMove(s, { pile: 'p22', index: 0 })).toBe('p22'); // A♦ on K♦: king and ace touch
    expect(def.moveTo(s, { pile: 'p20', index: 0 }, 'waste')).toBe('p20');
    expect(def.autoMove(s, { pile: 'p18', index: 0 })).toBeNull();
    expect(def.canPick(s, { pile: 'p0', index: 0 })).toBe(false);
  });
});

describe('TriPeaks agents', () => {
  it('the planner clears more peaks than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(triPeaksEnv, preset('planner'), preset('greedy'), {
      games: 40,
      seed: 1,
      maxSteps: 200,
    });
    expect(report.agents[0].wins).toBeGreaterThan(report.agents[1].wins);
  }, 120_000);
});

describeAdapterContract(triPeaksEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 200,
  illegalActions: (s) => ['p99', 'x', ''].filter((a) => !legalUpDownMoves(LAYOUT, s).includes(a)),
});
