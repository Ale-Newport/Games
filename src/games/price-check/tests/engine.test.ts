import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, DATA, env, estimate, observe } from '../ai-adapter';
import credits from '../credits.json';
import {
  CATEGORIES,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  finish,
  guess,
  inToday,
  isSession,
  itemAt,
  newDaily,
  newEndless,
  next,
  pool,
  scale,
  scoreGuess,
  shareText,
  TOPICS,
  type Session,
} from '../engine';

const PICTURES = import.meta.glob('../images/*.jpg');
const find = (en: string) => DATA.items.findIndex((i) => i[5] === en);

describe('price bank', () => {
  it('ships 1,000+ dated, positive prices in known categories', () => {
    expect(DATA.items.length).toBeGreaterThan(1000);
    expect(new Set(DATA.items.map((i) => i[0])).size).toBe(DATA.items.length);
    for (const [id, cat, cur, price, year, en] of DATA.items) {
      expect(id).toMatch(/^Q\d+$/);
      expect(CATEGORIES).toContain(cat);
      expect(cur).toMatch(/^[A-Z]{3}$/);
      expect(price).toBeGreaterThan(0);
      expect(year).toBeGreaterThanOrEqual(1800);
      expect(year).toBeLessThanOrEqual(2026);
      expect(en.length).toBeGreaterThan(0);
    }
  });

  it('matches well-known launch prices', () => {
    const iphone = itemAt(DATA, find('iPhone 12'));
    expect([iphone.price, iphone.currency, iphone.year]).toEqual([799, 'USD', 2020]);
    const ouya = itemAt(DATA, find('Ouya'));
    expect([ouya.price, ouya.currency]).toEqual([99, 'USD']);
  });

  it('every credited picture exists and carries an author and a licence', () => {
    const entries = Object.entries(
      credits as Record<string, { artist: string; license: string; page: string }>,
    );
    expect(entries.length).toBeGreaterThan(200);
    for (const [id, c] of entries) {
      expect(`../images/${id}.jpg` in PICTURES, id).toBe(true);
      expect(c.artist.length && c.license.length).toBeGreaterThan(0);
      expect(c.page).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it('today’s money follows the currency’s inflation (US: ×3.8 from 1980)', () => {
    const it80 = { ...itemAt(DATA, 0), currency: 'USD' as const, year: 1980, price: 100 };
    const now = inToday(DATA, it80)!;
    expect(now.value).toBeGreaterThan(370);
    expect(now.value).toBeLessThan(390);
    expect(inToday(DATA, { ...it80, year: 1700 })).toBeNull();
  });
});

describe('scoring', () => {
  it('closest: symmetric in log space; exact within 2 %', () => {
    expect(scoreGuess(101, 100, 'closest')).toBe(100);
    expect(scoreGuess(110, 100, 'closest')).toBe(87);
    expect(scoreGuess(125, 100, 'closest')).toBe(72);
    expect(scoreGuess(200, 100, 'closest')).toBe(35);
    expect(scoreGuess(50, 100, 'closest')).toBe(35);
    expect(scoreGuess(0, 100, 'closest')).toBe(0);
  });

  it('don’t go over: any guess above the price scores nothing', () => {
    expect(scoreGuess(100.4, 100, 'under')).toBe(100);
    expect(scoreGuess(101, 100, 'under')).toBe(0);
    expect(scoreGuess(80, 100, 'under')).toBe(scoreGuess(80, 100, 'closest'));
  });
});

describe('sessions', () => {
  it('pools respect difficulty and category', () => {
    for (const d of DIFFICULTIES)
      for (const t of TOPICS) {
        const ids = pool(DATA, d, t);
        if (d === 'hard' && t !== 'all') expect(ids.length, `${d}/${t}`).toBeGreaterThan(0);
        for (const i of ids.slice(0, 50)) if (t !== 'all') expect(DATA.items[i]![1]).toBe(t);
      }
    for (const i of pool(DATA, 'easy', 'all')) {
      const it = itemAt(DATA, i);
      expect(it.image !== '' && it.year >= 1990 && it.fame >= 10).toBe(true);
    }
  });

  it('daily: six different items, identical for everyone; exact guesses score 600', () => {
    const a = newDaily(DATA, 331);
    expect(newDaily(DATA, 331)).toEqual(a);
    let s: Session = a;
    const ids = new Set<number>();
    for (let k = 0; k < DAILY_ROUNDS; k++) {
      ids.add(current(s).item);
      s = guess(s, DATA, itemAt(DATA, current(s).item).price);
      if (k < DAILY_ROUNDS - 1) s = next(s, DATA);
    }
    expect(ids.size).toBe(6);
    expect(s.total).toBe(600);
    expect(shareText(s, 'Price Check')).toBe('Price Check #332 — 600/600\n🟩🟩🟩🟩🟩🟩');
  });

  it('rejects guesses off the scale and early advances; validates saves', () => {
    const s = newEndless(DATA, 5, 'hard', 'all', 'under');
    const it = itemAt(DATA, current(s).item);
    const [lo, hi] = scale(DATA, it);
    expect(it.price).toBeGreaterThan(Math.pow(10, lo));
    expect(it.price).toBeLessThan(Math.pow(10, hi));
    expect(() => guess(s, DATA, Math.pow(10, hi + 1))).toThrow();
    expect(() => guess(s, DATA, -3)).toThrow();
    expect(() => next(s, DATA)).toThrow();
    const done = guess(s, DATA, it.price * 1.5);
    expect(current(done).score).toBe(0);
    expect(isSession(JSON.parse(JSON.stringify(done)), DATA)).toBe(true);
    expect(isSession({ ...done, rule: 'maybe' })).toBe(false);
    expect(finish(newEndless(DATA, 1, 'easy', 'all', 'closest')).rounds).toHaveLength(0);
  });
});

describe('AI', () => {
  it('knowledge of similar items beats a coin toss, and names help', () => {
    const avg = (id: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState(undefined, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / 40;
    };
    const random = avg('random');
    const category = avg('category');
    const similar = avg('similar');
    expect(category).toBeGreaterThan(random + 60);
    expect(similar).toBeGreaterThan(category);
  });

  it('estimates never use the item’s own price', () => {
    const s = newEndless(DATA, 9, 'normal', 'all', 'closest');
    const o = observe(s);
    const before = estimate(o, true);
    const i = current(s).item;
    const original = DATA.items[i]![3];
    DATA.items[i]![3] = original * 1000;
    try {
      expect(estimate(o, true)).toBe(before);
    } finally {
      DATA.items[i]![3] = original;
    }
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', topic: 'art', rule: 'under', rounds: 3 }],
  playouts: 5,
  maxSteps: 10,
  checkObservation: (s) => {
    expect(Object.keys(observe(s)).sort()).toEqual([
      'category',
      'currency',
      'id',
      'name',
      'round',
      'rule',
      'scale',
      'total',
      'year',
    ]);
  },
});
