import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env, paybackAction } from '../ai-adapter';
import {
  ascend,
  buy,
  buyUpgrade,
  click,
  clickGolden,
  clickPower,
  cps,
  newBakery,
  offline,
  prestigeFor,
  priceOf,
  shop,
  short,
  tick,
  type Bakery,
} from '../engine';

const rich = (n: number): Bakery => ({ ...newBakery(1), cookies: n, baked: n, allTime: n });

describe('Idle Bakery economy', () => {
  it('clicks bake, buildings cost 15 % more each and bake by themselves', () => {
    let s = newBakery(1);
    s = click(s);
    expect(s.cookies).toBe(1);
    expect(priceOf(s, 'cursor')).toBe(15);
    s = buy(rich(1000), 'cursor');
    expect(s.owned.cursor).toBe(1);
    expect(priceOf(s, 'cursor')).toBe(Math.ceil(15 * 1.15));
    expect(buy(newBakery(1), 'grandma')).toEqual(newBakery(1));
    s = buy(s, 'grandma');
    expect(cps(s)).toBeCloseTo(1.1);
    const before = s.cookies;
    s = tick(s, 10);
    expect(s.cookies - before).toBeCloseTo(11);
  });

  it('upgrades double a building or the clicks; whisks add a share of production to clicks', () => {
    let s = buy(rich(1_000_000), 'grandma');
    expect(shop(s).some((u) => u.id === 'grandma-0')).toBe(true);
    s = buyUpgrade(s, 'grandma-0');
    expect(cps(s)).toBeCloseTo(2);
    s = buy(s, 'cursor');
    s = buyUpgrade(buyUpgrade(s, 'pin-1'), 'pin-2');
    expect(clickPower(s)).toBe(4);
    const w = buyUpgrade({ ...s, handmade: 1000 }, 'whisk-1');
    expect(clickPower(w)).toBeCloseTo(4 + cps(w) * 0.01);
  });

  it('golden pastries appear, expire, and give a haul or a frenzy', () => {
    let s = buy(buy(rich(10_000), 'grandma'), 'farm');
    for (let i = 0; i < 200 && !s.golden; i++) s = tick(s, 1);
    expect(s.golden).not.toBeNull();
    const effects = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const g = clickGolden({ ...s, rng: newBakery(seed).rng });
      effects.add(g.last!.effect);
      if (g.last!.effect === 'frenzy') expect(cps(g)).toBeCloseTo(cps(s) * 7);
      if (g.last!.effect === 'lucky') expect(g.cookies).toBeGreaterThan(s.cookies);
      expect(g.goldenClicks).toBe(1);
    }
    expect(effects.size).toBe(3);
    let gone = s;
    for (let i = 0; i < 30; i++) gone = tick(gone, 1);
    expect(gone.golden === null || gone.golden.expires > s.golden!.expires).toBe(true);
  });

  it('ascending trades the bakery for prestige; offline earns a tenth for up to 12 hours', () => {
    expect(prestigeFor(1e12)).toBe(1);
    expect(prestigeFor(8e12)).toBe(2);
    const s = { ...buy(rich(2e13), 'bank'), allTime: 8e12 };
    const a = ascend(s, 9);
    expect(a.prestige).toBe(2);
    expect(a.cookies).toBe(0);
    expect(a.owned).toEqual({});
    expect(a.allTime).toBe(8e12);
    expect(ascend(a, 9)).toBe(a);
    const b = buy(rich(1000), 'grandma');
    const [after, earned] = offline(b, 100 * 3600);
    expect(earned).toBeCloseTo(cps(b) * 12 * 3600 * 0.1);
    expect(after.cookies).toBeCloseTo(b.cookies + earned);
    expect(short(1234567, 'en')).toBe('1.235 million');
    expect(short(2.5e12, 'es')).toBe('2.5 billones');
  });

  it('the payback player bakes a fortune in an hour', () => {
    let s = env.createInitialState({}, 3);
    while (!env.isTerminal(s)) s = env.applyAction(s, paybackAction(s));
    expect(s.baked).toBeGreaterThan(1e6);
    expect(Object.keys(s.owned).length).toBeGreaterThan(4);
  });
});

describeAdapterContract(env, { configs: [{}], playouts: 1, maxSteps: 3601 });
