import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { backtestMethod, forecast, type Method } from '../../shared/stats/forecast';
import { INDICATORS } from '../../shared/stats/indicators';
import raw from '../../shared/stats/wdi.json';
import {
  formatValue,
  niceRange,
  niceTicks,
  seriesAt,
  type StatsData,
} from '../../shared/stats/stats';
import { env, observe } from '../ai-adapter';
import {
  completeDraft,
  computerForecast,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  drawSegment,
  emptyDraft,
  finish,
  hiddenCount,
  hiddenValues,
  isSession,
  LEVELS,
  newDaily,
  newEndless,
  next,
  pickChallenge,
  pool,
  scoreForecast,
  shareText,
  submit,
  TOPICS,
  visibleValues,
  windowValues,
  type Challenge,
  type Session,
} from '../engine';

const data = raw as unknown as StatsData;

/** Plays the current graph with a forecasting method (or the exact answer). */
function play(s: Session, how: 'exact' | Method): Session {
  const r = current(s);
  const series = seriesAt(data, r.c.s);
  const pred =
    how === 'exact'
      ? hiddenValues(series, r.c)
      : forecast(how, visibleValues(series, r.c), hiddenCount(r.c));
  return submit(s, data, pred);
}

describe('World Bank dataset', () => {
  it('ships thousands of real series, each ≥ 20 consecutive finite values', () => {
    expect(data.source).toMatch(/World Bank/);
    expect(data.series.length).toBeGreaterThan(7000);
    expect(data.indicators).toEqual(INDICATORS.map((i) => i.code));
    for (const [ind, ent, start, values] of data.series) {
      expect(data.indicators[ind]).toBeDefined();
      expect(data.entities[ent]).toBeDefined();
      expect(start).toBeGreaterThanOrEqual(1960);
      expect(start + values.length - 1).toBeLessThanOrEqual(2025);
      expect(values.length).toBeGreaterThanOrEqual(20);
      expect(values.every(Number.isFinite)).toBe(true);
    }
    for (const [iso3, , en, es] of data.entities) {
      expect(iso3).toMatch(/^[A-Z0-9]{3}$/);
      expect(en.length && es.length).toBeGreaterThan(0);
    }
    for (const ind of INDICATORS) {
      expect(ind.title.en && ind.title.es).toBeTruthy();
      expect(
        data.series.some(([i]) => data.indicators[i] === ind.code),
        ind.code,
      ).toBe(true);
    }
  });

  it('holds known reference values (spot checks against the published figures)', () => {
    const find = (code: string, iso3: string) => {
      const i = data.series.findIndex(
        ([ind, ent]) => data.indicators[ind] === code && data.entities[ent]![0] === iso3,
      );
      return seriesAt(data, i);
    };
    const world = find('SP.POP.TOTL', 'WLD');
    const at = (s: ReturnType<typeof find>, y: number) => s.values[y - s.start]!;
    // UN/World Bank world population: ≈ 3.0 bn in 1960, ≈ 6.1 bn in 2000, > 8 bn by 2023.
    expect(at(world, 1960)).toBeGreaterThan(2.9e9);
    expect(at(world, 1960)).toBeLessThan(3.1e9);
    expect(at(world, 2000)).toBeGreaterThan(6.0e9);
    expect(at(world, 2000)).toBeLessThan(6.3e9);
    expect(at(world, 2023)).toBeGreaterThan(8.0e9);
    // Japan's life expectancy passed 80 years in the 1990s; it was under 70 in 1960.
    const japan = find('SP.DYN.LE00.IN', 'JPN');
    expect(at(japan, 1960)).toBeLessThan(70);
    expect(at(japan, 2010)).toBeGreaterThan(80);
  });

  it('every difficulty and topic has a large pool of graphs', () => {
    for (const d of DIFFICULTIES)
      for (const t of TOPICS) expect(pool(data, d, t).length, `${d}/${t}`).toBeGreaterThan(200);
    expect(pool(data, 'normal', 'all').length).toBeGreaterThan(7000);
  });
});

describe('number helpers', () => {
  it('nice ticks and ranges', () => {
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(0.13, 0.91, 4)).toEqual([0.2, 0.4, 0.6, 0.8]);
    expect(niceRange(3.3, 17.2)).toEqual([0, 20]);
  });

  it('formats values with units in both languages', () => {
    const pct = INDICATORS.find((i) => i.format === 'pct')!;
    const money = INDICATORS.find((i) => i.format === 'money')!;
    expect(formatValue(12.345, pct, 'en')).toBe('12.3 %');
    expect(formatValue(12.345, pct, 'es')).toBe('12,3 %');
    expect(formatValue(1_234_000_000, money, 'en')).toBe('$1.23B');
  });
});

describe('challenges', () => {
  it('windows, hidden part and axis follow the difficulty rules', () => {
    for (const d of DIFFICULTIES) {
      const rng = new Rng(11);
      const lv = LEVELS[d];
      for (let k = 0; k < 300; k++) {
        const c = pickChallenge(data, rng, d, 'all');
        const series = seriesAt(data, c.s);
        const L = c.to - c.from + 1;
        expect(c.from).toBeGreaterThanOrEqual(0);
        expect(c.to).toBeLessThan(series.values.length);
        expect(L).toBeGreaterThanOrEqual(lv.window[0]);
        expect(L).toBeLessThanOrEqual(lv.window[1]);
        expect(hiddenCount(c)).toBe(Math.max(4, Math.round(L * lv.hidden)));
        expect(series.indicator.volatility).toBeLessThanOrEqual(lv.volatility);
        const w = windowValues(series, c);
        expect(Math.min(...w)).toBeGreaterThanOrEqual(c.lo);
        expect(Math.max(...w)).toBeLessThanOrEqual(c.hi);
        if (!series.indicator.signed && Math.min(...w) >= 0) expect(c.lo).toBeGreaterThanOrEqual(0);
        if (series.indicator.max) expect(c.hi).toBeLessThanOrEqual(series.indicator.max);
      }
    }
  });

  it('is reproducible from the seed and varied across seeds', () => {
    const a = pickChallenge(data, new Rng(5), 'normal', 'health');
    expect(pickChallenge(data, new Rng(5), 'normal', 'health')).toEqual(a);
    expect(seriesAt(data, a.s).indicator.topic).toBe('health');
    const distinct = new Set<string>();
    const rng = new Rng(99);
    for (let k = 0; k < 2000; k++) {
      const c = pickChallenge(data, rng, 'normal', 'all');
      distinct.add(`${c.s}:${c.from}:${c.to}`);
    }
    expect(distinct.size).toBeGreaterThan(1900);
  });

  it('avoids recently seen series', () => {
    const ids = pool(data, 'easy', 'health');
    const avoid = new Set(ids.slice(0, ids.length - 5));
    const rng = new Rng(3);
    for (let k = 0; k < 20; k++)
      expect(avoid.has(pickChallenge(data, rng, 'easy', 'health', avoid).s)).toBe(false);
  });
});

describe('drawing and scoring', () => {
  const c: Challenge = { s: 0, from: 0, to: 19, cut: 14, lo: 0, hi: 100 };

  it('a stroke fills the years it crosses; the draft completes once it reaches the end', () => {
    let d = emptyDraft(c);
    expect(d).toHaveLength(6);
    d = drawSegment(c, d, null, { x: 15.2, y: 40 });
    expect(d).toEqual([null, 40, null, null, null, null]);
    expect(completeDraft(c, d, 30)).toBeNull();
    d = drawSegment(c, d, { x: 15.2, y: 40 }, { x: 19, y: 78 });
    expect(d[2]).toBeCloseTo(48, 5);
    expect(d[5]).toBe(78);
    const full = completeDraft(c, d, 30)!;
    // The first hidden year joins the last visible point (30) to the first drawn one (40).
    expect(full[0]).toBeCloseTo(35, 5);
    expect(full).toHaveLength(6);
  });

  it('strokes left of the hidden zone are ignored and values are clamped to the axis', () => {
    let d = drawSegment(c, emptyDraft(c), null, { x: 3, y: 50 });
    expect(d.every((v) => v === null)).toBe(true);
    d = drawSegment(c, d, { x: 12, y: 150 }, { x: 19, y: -20 });
    expect(Math.max(...(d as number[]))).toBeLessThanOrEqual(100);
    expect(Math.min(...(d as number[]))).toBeGreaterThanOrEqual(0);
    // A later stroke replaces the years it covers.
    d = drawSegment(c, d, { x: 16, y: 10 }, { x: 17, y: 10 });
    expect([d[2], d[3]]).toEqual([10, 10]);
  });

  it('scores 100 for the exact line and falls with distance as documented', () => {
    const actual = [10, 20, 30, 40, 50, 60];
    expect(scoreForecast(c, actual, actual)).toBe(100);
    expect(
      scoreForecast(
        c,
        actual.map((v) => v + 1),
        actual,
      ),
    ).toBe(90);
    expect(
      scoreForecast(
        c,
        actual.map((v) => v + 5),
        actual,
      ),
    ).toBe(61);
    expect(
      scoreForecast(
        c,
        actual.map((v) => v - 10),
        actual,
      ),
    ).toBe(37);
    expect(
      scoreForecast(
        c,
        actual.map((v) => v + 25),
        actual,
      ),
    ).toBe(8);
  });
});

describe('the computer forecaster', () => {
  it('never looks at the hidden years', () => {
    const s = newEndless(data, 21, 'normal', 'all');
    const r = current(s);
    const series = seriesAt(data, r.c.s);
    const a = computerForecast(series, r.c);
    const tampered = {
      ...series,
      values: series.values.map((v, i) => (i >= r.c.cut ? v * 3 + 7 : v)),
    };
    expect(computerForecast(tampered, r.c)).toEqual(a);
  });

  it('beats a flat line on average (a real strategy, not a coin flip)', () => {
    let cpu = 0;
    let flat = 0;
    let s = newEndless(data, 77, 'normal', 'all', new Set(), 0);
    for (let k = 0; k < 300; k++) {
      s = play(s, 'flat');
      flat += current(s).score!;
      cpu += current(s).cpu!;
      s = next(s, data);
    }
    expect(cpu / 300).toBeGreaterThan(flat / 300 + 3);
  });

  it('backtesting picks a trend for a straight line and a flat line for a constant', () => {
    const line = Array.from({ length: 20 }, (_, i) => 3 + 2 * i);
    expect(['linear-5', 'linear-10', 'linear-all', 'drift']).toContain(backtestMethod(line, 5));
    expect(forecast(backtestMethod(line, 5), line, 3)).toEqual([43, 45, 47]);
    expect(forecast('flat', [1, 2, 7], 2)).toEqual([7, 7]);
  });
});

describe('sessions', () => {
  it('the daily challenge is five graphs, identical for everyone on a day', () => {
    const a = newDaily(data, 330);
    expect(newDaily(data, 330)).toEqual(a);
    expect(newDaily(data, 331).rounds[0]!.c).not.toEqual(a.rounds[0]!.c);
    let s = a;
    const series = new Set<number>();
    for (let k = 0; k < DAILY_ROUNDS; k++) {
      series.add(current(s).c.s);
      s = play(s, 'exact');
      expect(current(s).score).toBe(100);
      if (k < DAILY_ROUNDS - 1) {
        expect(s.status).toBe('playing');
        s = next(s, data);
      }
    }
    expect(series.size).toBe(DAILY_ROUNDS);
    expect(s.status).toBe('done');
    expect(s.total).toBe(500);
    expect(() => next(s, data)).toThrow();
    expect(shareText(s, 'Graph Forecast')).toBe('Graph Forecast #331 — 500/500\n🟩🟩🟩🟩🟩');
  });

  it('rejects bad forecasts, double submissions and early advances', () => {
    const s = newEndless(data, 4, 'easy', 'people');
    const h = hiddenCount(current(s).c);
    expect(() => submit(s, data, Array(h - 1).fill(1))).toThrow();
    expect(() => submit(s, data, Array(h).fill(Number.NaN))).toThrow();
    expect(() => next(s, data)).toThrow();
    const scored = play(s, 'flat');
    expect(() => play(scored, 'flat')).toThrow();
  });

  it('endless runs keep going, trim their history and keep exact totals', () => {
    let s = newEndless(data, 8, 'hard', 'all');
    let total = 0;
    for (let k = 0; k < 30; k++) {
      s = play(s, 'drift');
      total += current(s).score!;
      s = next(s, data);
    }
    expect(s.count).toBe(30);
    expect(s.total).toBe(total);
    expect(s.rounds.length).toBeLessThanOrEqual(12);
    expect(isSession(JSON.parse(JSON.stringify(s)), data)).toBe(true);
    const ended = finish(s);
    expect(ended.status).toBe('done');
    expect(current(ended).pred).not.toBeNull();
    expect(finish(newEndless(data, 1, 'easy', 'all')).rounds).toHaveLength(0);
  });

  it('validates saved sessions', () => {
    const s = newEndless(data, 2, 'normal', 'economy');
    expect(isSession(s, data)).toBe(true);
    expect(isSession({ ...s, difficulty: 'nightmare' })).toBe(false);
    expect(
      isSession({ ...s, rounds: [{ ...s.rounds[0], c: { ...s.rounds[0]!.c, cut: 0 } }] }),
    ).toBe(false);
    expect(
      isSession({ ...s, rounds: [{ ...s.rounds[0], c: { ...s.rounds[0]!.c, s: 999_999 } }] }, data),
    ).toBe(false);
    expect(isSession(null)).toBe(false);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'hard', topic: 'economy', rounds: 3 }],
  playouts: 6,
  maxSteps: 10,
  checkObservation: (s) => {
    const o = observe(s);
    const r = current(s);
    // Only the visible years are observed.
    expect(o.visible).toHaveLength(r.c.cut - r.c.from);
    expect(o.hidden).toBe(hiddenCount(r.c));
    expect(Object.keys(o)).not.toContain('s');
  },
});
