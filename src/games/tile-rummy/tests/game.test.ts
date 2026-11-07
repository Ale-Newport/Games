import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { basicAction, plannerAction } from '../ai';
import { rummyEnv } from '../ai-adapter';
import {
  act,
  encodePlay,
  isValidRummy,
  legalActions,
  newRummy,
  observe,
  playProblem,
  type RummyGame,
} from '../engine';
import { extend, setsFrom } from '../plays';
import { readSet, setValue } from '../sets';

/** Tile id for colour c (0–3), number n (1–13), copy k (0–1). */
const T = (c: number, n: number, k = 0) => c * 26 + (n - 1) * 2 + k;
const J = 104;

describe('Tile Rummy sets', () => {
  it('reads runs and groups, with jokers', () => {
    expect(readSet([T(0, 3), T(0, 4), T(0, 5)])).toEqual({ kind: 'run', values: [3, 4, 5] });
    expect(readSet([T(0, 3), J, T(0, 5)])).toEqual({ kind: 'run', values: [3, 4, 5] });
    expect(readSet([T(1, 12), T(1, 13), J])!.values).toEqual([11, 12, 13]);
    expect(readSet([T(0, 7), T(1, 7), T(2, 7), T(3, 7)])!.kind).toBe('group');
    expect(readSet([T(0, 7), T(0, 7, 1), T(2, 7)])).toBeNull();
    expect(readSet([T(0, 13), T(0, 1), T(0, 2)])).toBeNull();
    expect(readSet([T(0, 3), T(0, 4)])).toBeNull();
    expect(setValue([T(2, 10), T(2, 11), T(2, 12)])).toBe(33);
  });

  it('finds sets in a rack and adds tiles to the table, splitting long runs', () => {
    const rack = [T(0, 1), T(0, 2), T(0, 3), T(1, 9), T(2, 9), T(3, 9)];
    const sets = setsFrom(rack);
    expect(sets.some((s) => s.length === 3 && s.includes(T(0, 2)))).toBe(true);
    expect(sets.some((s) => s.includes(T(1, 9)) && s.includes(T(3, 9)))).toBe(true);
    const table = [[T(2, 3), T(2, 4), T(2, 5), T(2, 6), T(2, 7)]];
    const { table: after, left } = extend(table, [T(2, 5, 1), T(2, 8)]);
    expect(left).toEqual([]);
    expect(after.every((s) => readSet(s))).toBe(true);
    expect(after).toHaveLength(2);
  });
});

describe('Tile Rummy play', () => {
  const base = (): RummyGame => {
    const g = newRummy(2, 1);
    return {
      ...g,
      racks: [[T(0, 10), T(0, 11), T(0, 12), T(1, 1), T(1, 2), T(1, 3), T(3, 5)], g.racks[1]!],
      table: [[T(2, 1), T(2, 2), T(2, 3)]],
      melded: [false, true],
    };
  };

  it('the first play needs 30 from new sets of the own rack, and keeps the table', () => {
    const g = base();
    expect(playProblem(g, [...g.table, [T(1, 1), T(1, 2), T(1, 3)]])).toBe('meld');
    expect(playProblem(g, [...g.table, [T(0, 10), T(0, 11), T(0, 12)]])).toBeNull();
    // Using a table tile is not allowed before melding.
    expect(
      playProblem(g, [
        [T(2, 1), T(2, 2)],
        [T(2, 3), T(1, 3), T(3, 3)],
      ]),
    ).not.toBeNull();
    const next = act(g, encodePlay([...g.table, [T(0, 10), T(0, 11), T(0, 12)]]));
    expect(next.melded[0]).toBe(true);
    expect(next.racks[0]).toHaveLength(4);
    expect(next.turn).toBe(1);
  });

  it('after melding the table may be rearranged; table tiles cannot go back to a rack', () => {
    const g = { ...base(), melded: [true, true] };
    // A black 5 does not extend an orange run; a set needs three tiles; nothing placed is no play.
    expect(playProblem(g, [[T(2, 1), T(2, 2), T(2, 3), T(3, 5)]])).toBe('sets');
    expect(playProblem(g, [[T(2, 1), T(2, 2)]])).toBe('sets');
    expect(playProblem(g, [g.table[0]!])).toBe('nothing');
    expect(playProblem(g, [g.table[0]!, [T(1, 1), T(1, 2), T(1, 3)]])).toBeNull();
    // Splitting the orange run to build groups of 1, 2 and 3 with the blue tiles needs a third colour.
    expect(
      playProblem(g, [
        [T(2, 1), T(1, 1)],
        [T(2, 2), T(1, 2)],
        [T(2, 3), T(1, 3)],
      ]),
    ).toBe('sets');
  });

  it('drawing, passing on an empty pool, and the end', () => {
    let g = newRummy(2, 3);
    const n = g.racks[0]!.length;
    g = act(g, 'draw');
    expect(g.racks[0]).toHaveLength(n + 1);
    expect(legalActions({ ...g, pool: [] })).toContain('pass');
    const blocked = act(act({ ...g, pool: [] }, 'pass'), 'pass');
    expect(blocked.phase).toBe('over');
    const out: RummyGame = {
      ...base(),
      melded: [true, true],
      racks: [
        [T(1, 1), T(1, 2), T(1, 3)],
        [T(3, 9), J],
      ],
    };
    const won = act(out, encodePlay([...out.table, [T(1, 1), T(1, 2), T(1, 3)]]));
    expect(won.phase).toBe('over');
    expect(won.winner).toBe(0);
    expect(won.result).toEqual([39, -39]);
  });

  it('observations hide the other racks; saves replay', () => {
    let g = newRummy(3, 5);
    for (let i = 0; i < 30 && g.phase === 'play'; i++) g = act(g, plannerAction(g));
    expect(observe(g, 1).racks[0]!.every((t) => t === -1)).toBe(true);
    expect(isValidRummy(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidRummy({ ...g, table: [] })).toBe(g.table.length === 0);
  });

  it('the planner beats the basic player', () => {
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let g = newRummy(2, seed);
      const me = seed & 1;
      while (g.phase === 'play') g = act(g, g.turn === me ? plannerAction(g) : basicAction(g));
      if (g.winner === me) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(18);
  });
});

describeAdapterContract(rummyEnv, {
  configs: [undefined, { players: 4 }],
  playouts: 2,
  maxSteps: 4000,
  illegalActions: (g) => ['jump', 'play:999', 'play:'].filter((a) => !legalActions(g).includes(a)),
});
