import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../../ai/protocols/contract-suite';
import { Rng } from '../../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../cards/cards';
import { UNKNOWN, maskColumns, planColumns } from '../ai';
import {
  applyColumnsMove,
  dealColumns,
  isLegalColumnsMove,
  isValidColumnsState,
  legalColumnsMoves,
  replayColumns,
  type ColumnsState,
  type ColumnsVariant,
} from '../engine';
import { createColumnsEnv } from '../environment';
import { FORTY_THIEVES, SCORPION, YUKON } from '../variants';

const blank = (v: ColumnsVariant, over: Partial<ColumnsState>): ColumnsState => ({
  ...dealColumns(v, 1),
  stock: [],
  waste: [],
  columns: v.deal.map(() => []),
  down: v.deal.map(() => 0),
  foundations: Array.from({ length: v.foundations }, () => []),
  runs: [],
  ...over,
});

describe('column patience deals', () => {
  it('deals Yukon, Scorpion and Forty Thieves', () => {
    const y = dealColumns(YUKON, 3);
    expect(y.columns.map((p) => p.length)).toEqual([1, 6, 7, 8, 9, 10, 11]);
    expect(y.down).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(y.stock).toHaveLength(0);
    const s = dealColumns(SCORPION, 3);
    expect(s.columns.map((p) => p.length)).toEqual([7, 7, 7, 7, 7, 7, 7]);
    expect(s.down).toEqual([3, 3, 3, 3, 0, 0, 0]);
    expect(s.stock).toHaveLength(3);
    const f = dealColumns(FORTY_THIEVES, 3);
    expect(f.columns.every((p) => p.length === 4)).toBe(true);
    expect(f.stock).toHaveLength(64);
    expect(new Set([...f.stock, ...f.columns.flat()]).size).toBe(104);
  });
});

describe('column patience rules', () => {
  it('moves any face-up group in Yukon, even out of sequence', () => {
    const s = blank(YUKON, {
      columns: [[c(CLUBS, 9), c(HEARTS, 8), c(SPADES, 2)], [c(DIAMONDS, 10)], [], [], [], [], []],
    });
    expect(legalColumnsMoves(YUKON, s)).toContain('c0:0>c1'.replace('c0:0', 'c0:0')); // 9♣ 8♥ 2♠ onto 10♦
    expect(applyColumnsMove(YUKON, s, 'c0:0>c1').columns[1]).toEqual([
      c(DIAMONDS, 10),
      c(CLUBS, 9),
      c(HEARTS, 8),
      c(SPADES, 2),
    ]);
    expect(isLegalColumnsMove(YUKON, s, 'c0:2>c2')).toBe(false); // an empty column takes only a king
  });

  it('builds by suit in Scorpion, removes complete runs and deals the reserve to three columns', () => {
    const run = Array.from({ length: 12 }, (_, i) => c(SPADES, 13 - i)); // K…2
    const s = blank(SCORPION, {
      columns: [[c(HEARTS, 4), ...run], [c(SPADES, 1)], [c(HEARTS, 9)], [], [], [], []],
      down: [1, 0, 0, 0, 0, 0, 0],
      stock: [c(CLUBS, 5), c(CLUBS, 6), c(CLUBS, 7)],
    });
    expect(isLegalColumnsMove(SCORPION, s, 'c2:0>c0')).toBe(false); // 9♥ cannot go on 2♠
    const done = applyColumnsMove(SCORPION, s, 'c1:0>c0');
    expect(done.runs).toEqual([c(SPADES, 13)]);
    expect(done.columns[0]).toEqual([c(HEARTS, 4)]);
    expect(done.down[0]).toBe(0);
    const dealt = applyColumnsMove(SCORPION, done, 'deal');
    expect(dealt.columns.slice(0, 3).map((p) => p[p.length - 1])).toEqual([
      c(CLUBS, 7),
      c(CLUBS, 6),
      c(CLUBS, 5),
    ]);
    expect(dealt.stock).toHaveLength(0);
  });

  it('moves one card at a time in Forty Thieves and turns the stock once', () => {
    const s = blank(FORTY_THIEVES, {
      columns: [
        [c(SPADES, 9), c(SPADES, 8)],
        [c(SPADES, 10)],
        ...Array.from({ length: 8 }, () => [c(HEARTS, 2)]),
      ],
      stock: [c(DIAMONDS, 6)],
    });
    expect(legalColumnsMoves(FORTY_THIEVES, s)).not.toContain('c0:0>c1'); // two cards at once
    const drawn = applyColumnsMove(FORTY_THIEVES, s, 'deal');
    expect(drawn.waste).toEqual([c(DIAMONDS, 6)]);
    expect(legalColumnsMoves(FORTY_THIEVES, drawn)).not.toContain('deal');
  });

  it('agrees with the full move list over random games and validates by replay', () => {
    for (const v of [YUKON, SCORPION, FORTY_THIEVES]) {
      const every = ['deal'];
      const n = v.deal.length;
      for (let i = 0; i < n; i++) {
        every.push(`w>c${i}`);
        for (let j = 0; j < v.foundations; j++) every.push(`c${i}>f${j}`);
        for (let j = 0; j < n; j++) for (let k = 0; k < 30; k++) every.push(`c${i}:${k}>c${j}`);
      }
      for (let j = 0; j < v.foundations; j++) every.push(`w>f${j}`);
      const rng = new Rng(5);
      let s = dealColumns(v, 5);
      for (let step = 0; step < 150 && !s.result; step++) {
        const legal = legalColumnsMoves(v, s).sort();
        expect(every.filter((m) => isLegalColumnsMove(v, s, m)).sort()).toEqual(legal);
        s = applyColumnsMove(v, s, rng.pick(legal));
      }
      expect(replayColumns(v, 5, s.history)).toEqual(s);
      expect(isValidColumnsState(v, JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(isValidColumnsState(v, { ...s, seed: 6 })).toBe(false);
    }
  });

  it('wins with every card home', () => {
    const s = blank(YUKON, {
      foundations: [0, 1, 2, 3].map((x) =>
        Array.from({ length: x === 3 ? 12 : 13 }, (_, i) => c(x as 0, i + 1)),
      ),
      columns: [[c(CLUBS, 13)], [], [], [], [], [], []],
    });
    expect(applyColumnsMove(YUKON, s, 'c0>f3').result).toBe('won');
  });
});

describe('column patience planner', () => {
  it('hides face-down cards and finds a line that turns one up', () => {
    const s = dealColumns(YUKON, 2);
    expect(
      maskColumns(s)
        .columns[6]!.slice(0, 6)
        .every((x) => x === UNKNOWN),
    ).toBe(true);
    const t = blank(YUKON, {
      columns: [[c(CLUBS, 5), c(HEARTS, 9)], [c(SPADES, 10)], [], [], [], [], []],
      down: [1, 0, 0, 0, 0, 0, 0],
    });
    expect(planColumns(YUKON, maskColumns(t), 500).path[0]).toBe('c0:1>c1');
  });
});

describeAdapterContract(
  createColumnsEnv(SCORPION, { id: 'columns-test', version: '1.0.0', rulesetId: 't' }),
  {
    configs: [undefined],
    playouts: 3,
    maxSteps: 300,
    allowTruncation: true,
    illegalActions: (s) =>
      ['c9:0>c0', 'w>f9', 'x', ''].filter((a) => !legalColumnsMoves(SCORPION, s).includes(a)),
  },
);
