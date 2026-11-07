import { describe, expect, it } from 'vitest';
import {
  CONGKAK,
  KALAH,
  OWARE,
  applyMancalaAction,
  createMancalaState,
  legalMancalaActions,
  sow,
  type MancalaState,
  type MancalaVariant,
} from '../engine';

const custom = (
  v: MancalaVariant,
  pits: number[],
  toMove: 0 | 1 = 0,
  stores: [number, number] = [0, 0],
): MancalaState => ({
  ...createMancalaState(v),
  pits,
  stores,
  toMove,
  keys: [],
});

describe('mancala engine', () => {
  it('Kalah: 4 seeds from pit 3 end in the store and give another turn', () => {
    const s = applyMancalaAction(KALAH, createMancalaState(KALAH), '2');
    expect(s.pits.slice(0, 6)).toEqual([4, 4, 0, 5, 5, 5]);
    expect(s.stores).toEqual([1, 0]);
    expect(s.toMove).toBe(0);
  });

  it('Kalah: never sows into the opponent store, and captures from an empty own pit', () => {
    // 10 seeds from South pit 6 (index 5): store, North's six pits (not North's store), then South
    // 0, 1, 2 — the last seed lands in the empty pit 2 and captures the 2 seeds opposite (index 9).
    const s = custom(KALAH, [0, 0, 0, 0, 0, 10, 1, 1, 1, 1, 1, 1]);
    const after = applyMancalaAction(KALAH, s, '5');
    expect(after.stores).toEqual([1 + 3, 0]);
    expect(after.pits[2]).toBe(0);
    expect(after.pits[9]).toBe(0);
    expect(after.pits.slice(6, 9)).toEqual([2, 2, 2]);
    const cap = custom(KALAH, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2]);
    // South 0 → 1 (empty, opposite of index 1 is 10 with 3 seeds).
    const taken = applyMancalaAction(KALAH, cap, '0');
    expect(taken.stores[0]).toBe(4);
  });

  it('Oware: captures twos and threes backward, but never a grand slam', () => {
    const s = custom(OWARE, [0, 0, 0, 0, 0, 2, 1, 2, 4, 4, 4, 4]);
    // Two seeds from index 5 reach 6 (→2) and 7 (→3): both captured.
    const after = sow(OWARE, s, 5);
    expect(after.stores[0]).toBe(5);
    expect(after.pits[6]).toBe(0);
    expect(after.pits[7]).toBe(0);
    // Grand slam: North has only 1 + 2 seeds; taking them all is refused.
    const slam = custom(OWARE, [0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0]);
    expect(sow(OWARE, slam, 5).stores[0]).toBe(0);
  });

  it('Oware: you must feed an empty opponent, and 12+ seeds skip their own pit', () => {
    const s = custom(OWARE, [6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // Pit 1 (one seed) cannot reach North; pit 0 (six seeds) can.
    expect(legalMancalaActions(OWARE, s)).toEqual(['0']);
    const big = custom(OWARE, [12, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
    const sown = sow(OWARE, big, 0);
    expect(sown.pits[0]).toBe(0);
  });

  it('Congkak: relay sowing keeps going from an occupied pit', () => {
    // One seed from index 0 lands in index 1 (3 seeds → 4), which is picked up and sown on.
    const s = custom(CONGKAK, [1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    const after = sow(CONGKAK, s, 0);
    expect(after.pits[1]).toBe(0);
    expect(after.pits.slice(2, 6)).toEqual([1, 1, 1, 1]);
  });
});
