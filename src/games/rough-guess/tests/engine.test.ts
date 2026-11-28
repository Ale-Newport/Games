import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, BANK, env, observe } from '../ai-adapter';
import {
  answer,
  citiesFor,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  domain,
  finish,
  greatCircleKm,
  isSession,
  listKeys,
  newDaily,
  newEndless,
  next,
  pickQuestion,
  question,
  scoreRange,
  shareText,
  topicOf,
  TOPICS,
  type Session,
} from '../engine';

const rough = BANK.rough;
const price = (key: string, year: number) => {
  const ci = rough.commodities.findIndex((c) => c[0] === key);
  return rough.prices.find((p) => p[0] === ci && p[1] === year)?.[2];
};
const element = (en: string) => rough.elements.find((e) => e[1] === en)!;
const city = (en: string) => rough.cities.find((c) => c[1] === en)!;

/** Answers the current question with a range of the given width (×) around the truth. */
function play(s: Session, factor: number, shift = 1): Session {
  const q = question(BANK, current(s).key);
  const [d0, d1] = domain(BANK, q);
  const c = q.value * shift;
  const lo = Math.max(Math.pow(10, d0), c / Math.sqrt(factor));
  const hi = Math.min(Math.pow(10, d1), Math.max(lo * 1.0101, c * Math.sqrt(factor)));
  return answer(s, BANK, lo, hi);
}

describe('data', () => {
  it('ships 30 commodities, 118 elements and 500+ cities with clean values', () => {
    expect(rough.commodities).toHaveLength(30);
    expect(rough.prices.length).toBeGreaterThan(1800);
    for (const [ci, year, v] of rough.prices) {
      expect(rough.commodities[ci]).toBeDefined();
      expect(year).toBeGreaterThanOrEqual(1960);
      expect(year).toBeLessThanOrEqual(2025);
      expect(v).toBeGreaterThan(0);
    }
    expect(rough.elements).toHaveLength(118);
    expect(rough.elements.map((e) => e[3])).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
    expect(rough.cities.length).toBeGreaterThan(500);
    for (const c of rough.cities) {
      expect(Math.abs(c[3])).toBeLessThanOrEqual(90);
      expect(Math.abs(c[4])).toBeLessThanOrEqual(180);
    }
  });

  it('matches published figures', () => {
    // World Bank Pink Sheet annual averages.
    expect(price('gold', 2024)).toBeGreaterThan(2300);
    expect(price('gold', 2024)).toBeLessThan(2450);
    expect(price('brent', 2008)).toBeGreaterThan(90);
    expect(price('brent', 2008)).toBeLessThan(105);
    // Element properties (kelvin, g/cm³, Da).
    expect(element('iron')[4]).toBeCloseTo(1811, -1);
    expect(element('iron')[6]).toBeCloseTo(7.874, 2);
    expect(element('mercury')[5]).toBeCloseTo(630, -1);
    expect(element('carbon')[7]).toBeCloseTo(12.01, 1);
    // Gases have no density question; helium no melting point.
    expect(element('oxygen')[6]).toBe(0);
    expect(element('helium')[4]).toBe(0);
    // Great-circle distances.
    const km = (a: string, b: string) =>
      greatCircleKm([city(a)[3], city(a)[4]], [city(b)[3], city(b)[4]]);
    expect(km('London', 'Paris')).toBeGreaterThan(335);
    expect(km('London', 'Paris')).toBeLessThan(350);
    expect(km('New York City', 'Tokyo')).toBeGreaterThan(10_700);
    expect(km('New York City', 'Tokyo')).toBeLessThan(10_950);
  });
});

describe('questions', () => {
  it('resolves every key type and rejects bad keys', () => {
    expect(
      question(BANK, `p:${rough.commodities.findIndex((c) => c[0] === 'gold')}:1980`),
    ).toMatchObject({
      kind: 'price',
      year: 1980,
      unit: 'troy-oz',
    });
    expect(question(BANK, 'd:0:1')).toMatchObject({ kind: 'distance', source: 'computed' });
    expect(question(BANK, 'e:25:melting')).toMatchObject({
      kind: 'melting',
      subject: { en: 'iron' },
    });
    for (const bad of [
      'd:1:0',
      'd:0:0',
      'e:1:melting',
      'p:0:1700',
      'm:999999',
      'x:1',
      'e:0:colour',
    ])
      expect(() => question(BANK, bad), bad).toThrow();
  });

  it('pools are large, topics are respected and kinds rotate', () => {
    for (const d of DIFFICULTIES) {
      expect(listKeys(BANK, d).length).toBeGreaterThan(3000);
      expect(citiesFor(BANK, d).length).toBeGreaterThan(50);
    }
    for (const topic of TOPICS) {
      const rng = new Rng(4);
      for (let k = 0; k < 60; k++) {
        const q = question(BANK, pickQuestion(BANK, rng, 'normal', topic));
        if (topic !== 'all') expect(topicOf(q.kind)).toBe(topic);
      }
    }
  });

  it('every answer lies on its scale; distances join cities of different countries', () => {
    const rng = new Rng(9);
    for (let k = 0; k < 2000; k++) {
      const q = question(BANK, pickQuestion(BANK, rng, 'hard', 'all'));
      const [d0, d1] = domain(BANK, q);
      expect(Math.log10(q.value)).toBeGreaterThanOrEqual(d0);
      expect(Math.log10(q.value)).toBeLessThanOrEqual(d1);
      if (q.kind === 'distance') {
        const [, a, b] = q.key.split(':').map(Number);
        expect(rough.cities[a!]![5]).not.toBe(rough.cities[b!]![5]);
        expect(q.value).toBeGreaterThan(0);
      }
    }
  });
});

describe('scoring and sessions', () => {
  it('scores hits by width and misses with zero', () => {
    expect(scoreRange(100, 101, 100.5)).toBe(100);
    expect(scoreRange(100, 200, 150)).toBe(85);
    expect(scoreRange(100, 1000, 500)).toBe(50);
    expect(scoreRange(1, 1e5, 500)).toBe(10);
    expect(scoreRange(100, 200, 250)).toBe(0);
    expect(scoreRange(100, 200, 100)).toBe(85);
  });

  it('the daily challenge is ten questions, the same for everyone', () => {
    const a = newDaily(BANK, 331);
    expect(newDaily(BANK, 331)).toEqual(a);
    let s = a;
    const keys = new Set<string>();
    for (let k = 0; k < DAILY_ROUNDS; k++) {
      keys.add(current(s).key);
      s = play(s, 2);
      expect(current(s).score).toBeGreaterThanOrEqual(85);
      if (k < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, BANK);
        expect(next(s, BANK, new Set([current(n).key]))).toEqual(n);
        s = n;
      }
    }
    expect(keys.size).toBe(10);
    expect(s.status).toBe('done');
    expect(s.hits).toBe(10);
    expect(shareText(s, 'Rough Guess')).toMatch(
      /^Rough Guess #332 — \d+\/1000 · 10\/10\n(🟩){10}$/u,
    );
  });

  it('rejects ranges that are too narrow, leave the scale or come twice', () => {
    const s = newEndless(BANK, 2, 'easy', 'prices');
    const q = question(BANK, current(s).key);
    const [d0, d1] = domain(BANK, q);
    expect(() => answer(s, BANK, q.value, q.value * 1.001)).toThrow();
    expect(() => answer(s, BANK, Math.pow(10, d0 - 1), q.value)).toThrow();
    expect(() => answer(s, BANK, q.value, Math.pow(10, d1 + 1))).toThrow();
    expect(() => answer(s, BANK, -1, 2)).toThrow();
    expect(() => next(s, BANK)).toThrow();
    const done = play(s, 3);
    expect(() => play(done, 3)).toThrow();
  });

  it('endless runs count hits and misses, validate after a round trip and end', () => {
    let s = newEndless(BANK, 8, 'hard', 'all');
    for (let k = 0; k < 16; k++) {
      s = play(s, 1.5, k % 2 ? 1 : 4); // every other range misses (centred 4× too high)
      s = next(s, BANK);
    }
    expect(s.count).toBe(16);
    expect(s.hits).toBe(8);
    expect(isSession(JSON.parse(JSON.stringify(s)), BANK)).toBe(true);
    expect(isSession({ ...s, rounds: [{ ...s.rounds[0], key: 'zz' }] })).toBe(false);
    expect(isSession({ ...s, rounds: [{ ...s.rounds[0], key: 'm:99999999' }] }, BANK)).toBe(false);
    expect(finish(s).rounds.length).toBe(s.rounds.length - 1);
  });
});

describe('AI', () => {
  it('the calibrated agent clearly beats random and play-it-safe ranges', () => {
    const avg = (id: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState(undefined, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / 20;
    };
    const calibrated = avg('calibrated');
    expect(calibrated).toBeGreaterThan(avg('random') + 150);
    expect(calibrated).toBeGreaterThan(avg('widest') + 150);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', topic: 'distances', rounds: 3 }],
  playouts: 4,
  maxSteps: 12,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'domain',
      'hits',
      'key',
      'kind',
      'round',
      'subject',
      'total',
      'year',
    ]);
  },
});
