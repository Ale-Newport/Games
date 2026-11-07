import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { dealKlondike, legalKlondikeMoves, type KlondikeState } from '../../shared/klondike/engine';
import { klondikeDraw3Env } from '../ai-adapter';
import { KLONDIKE_DRAW_3 as def } from '../Game';

const suit = (s: 0 | 1 | 2 | 3, upTo = 13) => Array.from({ length: upTo }, (_, i) => c(s, i + 1));

describe('Klondike Draw Three definition', () => {
  it('lays out stock, waste, four foundations and seven columns', () => {
    const s = dealKlondike(1, 3);
    const piles = def.piles(s);
    expect(piles.map((p) => p.id)).toEqual([
      'stock',
      'waste',
      'f0',
      'f1',
      'f2',
      'f3',
      't0',
      't1',
      't2',
      't3',
      't4',
      't5',
      't6',
    ]);
    const t6 = piles.find((p) => p.id === 't6')!;
    expect(t6.cards.map((x) => x.up)).toEqual([false, false, false, false, false, false, true]);
    expect(def.mode).toBe('draw-3');
    const drawn = def.apply(s, 'draw');
    expect(drawn.waste).toHaveLength(3);
    expect(def.piles(drawn).find((p) => p.id === 'waste')!.fanLast).toBe(3);
  });

  it('turns taps and drops into moves, sending cards home first', () => {
    const s = dealKlondike(1, 3);
    // Deal 1: the 8♣ on column 3 goes onto the 9♦ of column 2.
    expect(def.moveTo(s, { pile: 't2', index: 2 }, 't1')).toBe('t2:2>t1');
    expect(def.moveTo(s, { pile: 't2', index: 1 }, 't1')).toBeNull(); // face down
    expect(def.autoMove(s, { pile: 't2', index: 2 })).toBe('t2:2>t1');
    const three = dealKlondike(3, 3);
    expect(def.autoMove(three, { pile: 't1', index: 1 })).toBe('t1>f0');
    expect(def.stockMove(s)).toBe('draw');
    expect(def.canPick(s, { pile: 'stock', index: 23 })).toBe(false);
  });

  it('finishes a deal with every card face up and the stock empty', () => {
    let s: KlondikeState = {
      ...dealKlondike(1, 3),
      stock: [],
      waste: [],
      foundations: [suit(SPADES, 10), suit(HEARTS, 11), suit(DIAMONDS, 12), suit(CLUBS, 12)],
      tableau: [
        [c(SPADES, 13), c(HEARTS, 12), c(SPADES, 11)],
        [c(DIAMONDS, 13)],
        [c(CLUBS, 13)],
        [c(HEARTS, 13)],
        [c(SPADES, 12)],
        [],
        [],
      ],
      down: [0, 0, 0, 0, 0, 0, 0],
    };
    let steps = 0;
    for (let m = def.finishMove(s); m; m = def.finishMove(s)) {
      s = def.apply(s, m);
      steps++;
    }
    expect(def.status(s)).toBe('won');
    expect(steps).toBe(7);
    expect(def.finishMove(dealKlondike(1, 3))).toBeNull();
  });

  it('describes moves and hints at their ends', () => {
    const s = dealKlondike(3, 3);
    const after = def.apply(s, 't1>f0');
    const t = (k: string, p?: Record<string, string | number>) => `${k}:${JSON.stringify(p ?? {})}`;
    expect(def.describe(s, 't1>f0', after, t, 'en')).toContain('ace of diamonds');
    expect(def.moveEnds(s, 't1>f0')).toEqual({ from: { pile: 't1', index: 1 }, to: 'f0' });
    expect(def.sound(s, 't1>f0', after)).toBe('home');
    expect(def.sound(s, 'draw', def.apply(s, 'draw'))).toBe('draw');
    expect(legalKlondikeMoves(after)).toContain('draw');
  });
});

describeAdapterContract(klondikeDraw3Env, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 1600,
  illegalActions: (s) =>
    ['t9>f0', 'f0>f1', 'x', ''].filter((a) => !legalKlondikeMoves(s).includes(a)),
});

describe('Klondike Draw Three agents', () => {
  it('the planner solves more seeded deals than the greedy player', async () => {
    const { evaluateAgents } = await import('../../../ai/evaluation/evaluate');
    const { AGENT_PRESETS } = await import('../ai-adapter');
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(klondikeDraw3Env, preset('planner'), preset('greedy'), {
      games: 3,
      seed: 3,
      maxSteps: 1600,
      timeLimitMs: 60,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 240_000);
});
