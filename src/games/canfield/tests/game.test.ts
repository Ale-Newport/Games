import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { AGENT_PRESETS, UNKNOWN, maskCanfield } from '../ai';
import { canfieldEnv } from '../ai-adapter';
import { CANFIELD as def } from '../definition';
import {
  applyCanfieldMove,
  dealCanfield,
  fitsFoundation,
  isValidCanfieldState,
  legalCanfieldMoves,
  replayCanfield,
  stacks,
  type CanfieldState,
} from '../engine';

describe('Canfield engine', () => {
  it('deals a 13-card reserve, a base card, four piles and a 34-card stock', () => {
    const s = dealCanfield(3);
    expect(s.reserve).toHaveLength(13);
    expect(s.foundations[0]).toHaveLength(1);
    expect(s.base).toBe(7); // deal 3: base 7♣
    expect(s.tableau.map((p) => p.length)).toEqual([1, 1, 1, 1]);
    expect(s.stock).toHaveLength(34);
  });

  it('builds foundations from the base and wraps king to ace, tableau down in colors', () => {
    const s: CanfieldState = { ...dealCanfield(1), base: 12 };
    expect(fitsFoundation(s, [], c(HEARTS, 12))).toBe(true);
    expect(fitsFoundation(s, [], c(HEARTS, 1))).toBe(false);
    expect(fitsFoundation(s, [c(HEARTS, 13)], c(HEARTS, 1))).toBe(true);
    expect(stacks(c(SPADES, 1), c(HEARTS, 13))).toBe(true); // a red king on a black ace
    expect(stacks(c(SPADES, 9), c(CLUBS, 8))).toBe(false);
  });

  it('refills an emptied pile from the reserve (deal 3)', () => {
    const s = dealCanfield(3);
    expect(legalCanfieldMoves(s)).toContain('t1>f0'); // the 8♣ on the 7♣
    const after = applyCanfieldMove(s, 't1>f0');
    expect(after.tableau[1]).toEqual([s.reserve[12]]);
    expect(after.reserve).toHaveLength(12);
  });

  it('draws three at a time and validates by replay', () => {
    let s = dealCanfield(2);
    s = applyCanfieldMove(s, 'draw');
    expect(s.waste).toHaveLength(3);
    for (let i = 0; i < 12; i++) s = applyCanfieldMove(s, 'draw');
    expect(s.recycles).toBe(1);
    expect(replayCanfield(2, s.history)).toEqual(s);
    expect(isValidCanfieldState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidCanfieldState({ ...s, base: 1 })).toBe(false);
    void DIAMONDS;
  });

  it('wins with every card home', () => {
    const suit = (x: 0 | 1 | 2 | 3) => Array.from({ length: 13 }, (_, i) => c(x, i + 1));
    const s: CanfieldState = {
      ...dealCanfield(1),
      base: 1,
      reserve: [],
      stock: [],
      waste: [],
      foundations: [suit(0), suit(1), suit(2), suit(3).slice(0, 12)],
      tableau: [[c(CLUBS, 13)], [], [], []],
    };
    expect(applyCanfieldMove(s, 't0>f3').result).toBe('won');
  });
});

describe('Canfield agents', () => {
  it('hide the reserve under its top card and the unseen stock', () => {
    const s = dealCanfield(3);
    const view = maskCanfield(s);
    expect(view.reserve.slice(0, 12).every((x) => x === UNKNOWN)).toBe(true);
    expect(view.reserve[12]).toBe(s.reserve[12]);
    expect(view.stock.every((x) => x === UNKNOWN)).toBe(true);
  });

  it('the planner brings more cards home than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(canfieldEnv, preset('planner'), preset('greedy'), {
      games: 6,
      seed: 1,
      maxSteps: 1510,
      timeLimitMs: 150,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(report.agents[1].averageReturn);
  }, 240_000);
});

describe('Canfield definition', () => {
  it('maps taps to moves and shows the base on empty foundations', () => {
    const s = dealCanfield(3);
    expect(def.autoMove(s, { pile: 't1', index: 0 })).toBe('t1>f0');
    expect(def.moveTo(s, { pile: 't3', index: 0 }, 'f2')).toBe('t3>f2');
    expect(def.canPick(s, { pile: 'reserve', index: 11 })).toBe(false);
    expect(def.piles(s).find((p) => p.id === 'f1')!.empty).toBe('7');
  });
});

describeAdapterContract(canfieldEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 300,
  allowTruncation: true,
  illegalActions: (s) => ['t9>f0', 'r>f9', 'x'].filter((a) => !legalCanfieldMoves(s).includes(a)),
});
