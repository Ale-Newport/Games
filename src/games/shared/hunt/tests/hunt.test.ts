import { describe, expect, it } from 'vitest';
import {
  BAGH_CHAL,
  FOX_AND_GEESE,
  applyHuntAction,
  createHuntState,
  isValidHuntState,
  legalHuntActions,
  type HuntState,
  type HuntVariant,
} from '../engine';
import { huntCodec } from '../environment';

const custom = (
  v: HuntVariant,
  prey: number[],
  hunters: number[],
  toMove: 0 | 1,
  inHand = 0,
): HuntState => {
  const s = createHuntState(v);
  const board: number[] = s.board.map((x) => (x === -1 ? -1 : 0));
  for (const p of prey) board[p] = 1;
  for (const p of hunters) board[p] = 2;
  return { ...s, board, inHand, toMove, keys: [] };
};

describe('hunt engine', () => {
  it('sets up the cross with 13 geese and a fox, and the 5×5 with four tigers and 20 goats in hand', () => {
    const f = createHuntState(FOX_AND_GEESE);
    expect(f.board.filter((x) => x !== -1)).toHaveLength(33);
    expect(f.board.filter((x) => x === 1)).toHaveLength(13);
    const b = createHuntState(BAGH_CHAL);
    expect(b.board.filter((x) => x === 2)).toHaveLength(4);
    expect(b.inHand).toBe(20);
    // Goats begin by placing: 21 empty points.
    expect(legalHuntActions(BAGH_CHAL, b)).toHaveLength(21);
  });

  it('geese never step back; the fox chains jumps and may stop', () => {
    const geese = legalHuntActions(FOX_AND_GEESE, createHuntState(FOX_AND_GEESE));
    expect(
      geese.every((a) => {
        const [f, t] = a.split('-').map(Number) as [number, number];
        return Math.floor(t / 7) >= Math.floor(f / 7);
      }),
    ).toBe(true);
    // Fox on b4 (22) with geese on c4 (23) and e4 (25): a double jump along the row, 22 → 24 → 26.
    const s = custom(FOX_AND_GEESE, [23, 25, 2], [22], 1);
    expect(legalHuntActions(FOX_AND_GEESE, s)).toContain('22-24');
    const first = applyHuntAction(FOX_AND_GEESE, s, '22-24');
    expect(first.captured).toBe(1);
    expect(first.chain).toBe(24);
    expect(first.toMove).toBe(1);
    expect(legalHuntActions(FOX_AND_GEESE, first)).toEqual(['24-26', 'stop']);
    const stopped = applyHuntAction(FOX_AND_GEESE, first, 'stop');
    expect(stopped.toMove).toBe(0);
    expect(stopped.movers).toEqual([1, 1]);
  });

  it('tigers jump once, along diagonals only from strong points', () => {
    const s = custom(BAGH_CHAL, [6], [0, 4, 20, 24], 1, 0);
    expect(legalHuntActions(BAGH_CHAL, s)).toContain('0-12');
    const after = applyHuntAction(BAGH_CHAL, s, '0-12');
    expect(after.captured).toBe(1);
    expect(after.chain).toBeNull();
    expect(after.toMove).toBe(0);
    // c4 (7) is a weak point: no diagonal from it.
    const weak = custom(BAGH_CHAL, [13], [7], 1);
    expect(legalHuntActions(BAGH_CHAL, weak)).not.toContain('7-19');
  });

  it('the hunters win at their capture goal; trapped hunters lose', () => {
    const s = { ...custom(BAGH_CHAL, [6, 8], [0, 4, 20, 24], 1), captured: 4 };
    expect(applyHuntAction(BAGH_CHAL, s, '0-12').result).toEqual({ winner: 1, reason: 'captures' });
    // Tiger in a corner boxed in by goats two deep: placing the last goat traps it.
    const t = custom(BAGH_CHAL, [1, 2, 5, 10, 6, 12], [0], 0, 1);
    expect(applyHuntAction(BAGH_CHAL, t, '+18').result).toEqual({ winner: 0, reason: 'trapped' });
  });

  it('a fox that the geese only circle around escapes by repetition', () => {
    let s = custom(FOX_AND_GEESE, [14, 20], [45], 0);
    const loop = ['14-15', '45-46', '15-14', '46-45'];
    for (const a of [...loop, ...loop, ...loop]) {
      if (s.result) break;
      s = applyHuntAction(FOX_AND_GEESE, s, a);
    }
    expect(s.result).toEqual({ winner: 1, reason: 'repetition' });
  });

  it('validates by replay and encodes actions uniquely', () => {
    const s = applyHuntAction(BAGH_CHAL, createHuntState(BAGH_CHAL), '+12');
    expect(isValidHuntState(BAGH_CHAL, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidHuntState(BAGH_CHAL, { ...s, inHand: 20 })).toBe(false);
    const codec = huntCodec(BAGH_CHAL);
    for (const a of ['+12', '0-12', '24-18', 'stop']) expect(codec.decode(codec.encode(a))).toBe(a);
  });
});
