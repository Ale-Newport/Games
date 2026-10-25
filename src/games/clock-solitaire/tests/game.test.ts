import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { rankOf } from '../../shared/cards/cards';
import { clockEnv } from '../ai-adapter';
import { CLOCK as def, pileAt } from '../definition';
import {
  KINGS,
  applyClockMove,
  comesOut,
  dealClock,
  faceUpCount,
  isValidClockState,
  legalClockMoves,
  replayClock,
} from '../engine';

describe('Clock engine', () => {
  it('deals thirteen piles of four and starts from the kings', () => {
    const s = dealClock(5);
    expect(s.down.map((p) => p.length)).toEqual(Array(13).fill(4));
    expect(s.current).toBe(KINGS);
    expect(legalClockMoves(s)).toEqual(['turn']);
  });

  it('places each card under its hour and turns the next from there', () => {
    let s = applyClockMove(dealClock(5), 'turn');
    const card = s.hand!;
    expect(legalClockMoves(s)).toEqual(['place']);
    s = applyClockMove(s, 'place');
    expect(s.up[rankOf(card) - 1]).toEqual([card]);
    expect(s.current).toBe(rankOf(card) - 1);
    expect(() => applyClockMove(s, 'place')).toThrow();
  });

  it('ends at the fourth king and wins about one deal in thirteen', () => {
    let wins = 0;
    for (let seed = 1; seed <= 1300; seed++) if (comesOut(seed)) wins++;
    expect(wins).toBeGreaterThan(70);
    expect(wins).toBeLessThan(130);
    let s = dealClock(5); // deal 5 comes out
    while (!s.result) s = applyClockMove(s, legalClockMoves(s)[0]!);
    expect(s.result).toBe('won');
    expect(faceUpCount(s)).toBe(52);
    let t = dealClock(1);
    while (!t.result) t = applyClockMove(t, legalClockMoves(t)[0]!);
    expect(t.up[KINGS]).toHaveLength(4);
  });

  it('validates by replay', () => {
    let s = dealClock(9);
    for (let i = 0; i < 20 && !s.result; i++) s = applyClockMove(s, legalClockMoves(s)[0]!);
    expect(replayClock(9, s.history)).toEqual(s);
    expect(isValidClockState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidClockState({ ...s, current: 3 })).toBe(false);
  });
});

describe('Clock definition', () => {
  it('lays the piles around a dial and only accepts a card on its own hour', () => {
    expect(pileAt(11).y).toBeLessThan(pileAt(5).y); // twelve above six
    expect(pileAt(2).col).toBeGreaterThan(pileAt(8).col); // three right of nine
    const turned = applyClockMove(dealClock(5), 'turn');
    const hour = `h${rankOf(turned.hand!) - 1}`;
    expect(def.moveTo(turned, { pile: 'hand', index: 0 }, hour)).toBe('place');
    expect(def.moveTo(turned, { pile: 'hand', index: 0 }, hour === 'h0' ? 'h1' : 'h0')).toBeNull();
    const piles = def.piles(dealClock(5));
    expect(piles.find((p) => p.id === 'h12')!.kind).toBe('stock');
    expect(piles.find((p) => p.id === 'h12')!.glow).toBe(true);
  });
});

describeAdapterContract(clockEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 120,
  illegalActions: (s) => [
    'draw',
    'x',
    ...['turn', 'place'].filter((a) => !legalClockMoves(s).includes(a)),
  ],
});
