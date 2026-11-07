import { describe, expect, it } from 'vitest';
import { shanten, waits } from '../hand';
import { doraOf, EAST } from '../tiles';
import { payments, scoreHand, type Meld, type WinContext } from '../yaku';

/**
 * "123m456p789s11z" → counts; suits p (dots 0–8), s (bamboo 9–17), m (characters 18–26), z (honours
 * 27–33 in this game's order: 1–4 east to north, 5 red, 6 green, 7 white dragon).
 */
function parse(s: string): number[] {
  const c = new Array<number>(34).fill(0);
  for (const m of s.matchAll(/(\d+)([psmz])/g)) {
    const base = { p: 0, s: 9, m: 18, z: 27 }[m[2] as 'p' | 's' | 'm' | 'z'];
    for (const d of m[1]!) c[base + Number(d) - 1]!++;
  }
  return c;
}
const kinds = (c: number[]) => c.flatMap((n, k) => new Array<number>(n).fill(k));

function ctx(
  hand: string,
  win: number,
  extra: Partial<WinContext> = {},
  melds: Meld[] = [],
): WinContext {
  const counts = parse(hand);
  return {
    counts,
    melds,
    win,
    tsumo: false,
    seatWind: 28,
    roundWind: EAST,
    dealer: false,
    riichi: false,
    doubleRiichi: false,
    ippatsu: false,
    last: false,
    rinshan: false,
    chankan: false,
    firstDraw: false,
    doraIndicators: [],
    uraIndicators: [],
    allKinds: [
      ...kinds(counts),
      ...melds.flatMap((m) =>
        m.type === 'chi'
          ? [m.kind, m.kind + 1, m.kind + 2]
          : new Array<number>(m.type === 'kan' ? 4 : 3).fill(m.kind),
      ),
    ],
    ...extra,
  };
}

const ids = (s: ReturnType<typeof scoreHand>) => s!.yaku.map((y) => y.id).sort();

describe('Riichi hand shapes', () => {
  it('shanten and waits', () => {
    expect(shanten(parse('123m456p789s1z222z'), 0)).toBe(0);
    expect(shanten(parse('123m456p789s11z222z'), 0)).toBe(-1);
    expect(shanten(parse('19m19p19s1234567z'), 0)).toBe(0);
    expect(waits(parse('1112345678999m'), 0)).toEqual([18, 19, 20, 21, 22, 23, 24, 25, 26]);
    expect(waits(parse('19m19p19s1234567z'), 0)).toEqual([
      0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33,
    ]);
  });

  it('dora follow their indicators', () => {
    expect(doraOf(8)).toBe(0); // 9 of dots → 1 of dots
    expect(doraOf(30)).toBe(27); // north → east
    expect(doraOf(33)).toBe(32); // white → green
    expect(doraOf(31)).toBe(33); // red → white
  });
});

describe('Riichi scoring', () => {
  it('pinfu on a two-sided wait: 1 han 30 fu by ron, 1000 for a non-dealer', () => {
    // 123m 456p 789s 234s 55p, won on 4s (wait 23s: two-sided).
    const s = scoreHand(ctx('123m456p789s234s55p', 12));
    expect(ids(s)).toEqual(['pinfu']);
    expect([s!.han, s!.fu]).toEqual([1, 30]);
    expect(payments(s!.basic, 1, 0, 2)).toEqual([0, 1000, -1000, 0]);
  });

  it('a closed wait is not pinfu; riichi and tsumo add han', () => {
    // Won on 3s inside 2-4s: kanchan.
    const s = scoreHand(ctx('123m456p789s234s55p', 11, { tsumo: true, riichi: true }));
    expect(ids(s)).toEqual(['menzen-tsumo', 'riichi']);
    // 20 + tsumo 2 + kanchan 2 = 24 → 30 fu.
    expect([s!.han, s!.fu]).toEqual([2, 30]);
    // Non-dealer tsumo, basic 480: the dealer pays 1000, the others 500.
    expect(payments(s!.basic, 1, 0, null)).toEqual([-1000, 2000, -500, -500]);
  });

  it('a hand with no yaku cannot win', () => {
    // Open chi of 123m and a terminal pair: nothing.
    const chi: Meld = { type: 'chi', kind: 18, open: true, tiles: [] };
    expect(scoreHand(ctx('456p789s234s99p', 13, {}, [chi]))).toBeNull();
  });

  it('seven pairs is 2 han 25 fu; with all simples 3 han', () => {
    const s = scoreHand(ctx('22m44m66p88p22s44s66s', 13));
    expect(ids(s)).toEqual(['chiitoitsu', 'tanyao']);
    expect([s!.han, s!.fu]).toEqual([3, 25]);
  });

  it('dragon triplets, dora and the mangan limit', () => {
    // Open pon of red dragons + concealed white dragons, won on the 2m pair; 3 dora (indicator 4p → 5p).
    const pon: Meld = { type: 'pon', kind: 31, open: true, tiles: [] };
    const s = scoreHand(ctx('555p678s777z22m', 19, { doraIndicators: [3] }, [pon]));
    expect(ids(s)).toEqual(['dora', 'yakuhai-31', 'yakuhai-33']);
    expect(s!.han).toBe(5);
    expect(s!.limit).toBe('mangan');
    // A dealer ron mangan: 12 000.
    expect(payments(s!.basic, 0, 0, 3)).toEqual([12000, 0, 0, -12000]);
  });

  it('full flush and pure straight', () => {
    // Won on the 2p of 234p: a two-sided wait, so pinfu too.
    const s = scoreHand(ctx('123456789p11p234p', 1));
    expect(ids(s)).toEqual(['chinitsu', 'ittsu', 'pinfu']);
    expect(s!.han).toBe(9);
    expect(s!.limit).toBe('baiman');
  });

  it('yakuman: thirteen orphans and big three dragons', () => {
    expect(scoreHand(ctx('19m19p19s12345677z', 33))!.yaku[0]!.id).toBe('kokushi');
    const big = scoreHand(ctx('555666777z123m99p', 8));
    expect(big!.yakuman).toBe(1);
    expect(payments(big!.basic, 2, 0, null)).toEqual([-16000, -8000, 32000, -8000]);
  });

  it('a ron-completed triplet is not concealed (no three concealed triplets)', () => {
    // 222m 444p 666s 345m 88s, completed with the 6s (a pair-or-triplet wait with 88s).
    const tsumo = scoreHand(ctx('222m444p666s345m88s', 14, { tsumo: true }));
    const ron = scoreHand(ctx('222m444p666s345m88s', 14));
    expect(ids(tsumo)).toEqual(['menzen-tsumo', 'sanankou', 'tanyao']);
    expect(ids(ron)).toEqual(['tanyao']);
  });
});
