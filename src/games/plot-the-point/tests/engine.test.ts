import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { INDICATOR_BY_CODE } from '../../shared/stats/indicators';
import raw from '../../shared/stats/wdi.json';
import type { StatsData } from '../../shared/stats/stats';
import { env, observe, cellCentre, cellOf } from '../ai-adapter';
import {
  chartKey,
  countriesFor,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  denorm,
  finish,
  isSession,
  layout,
  LEVELS,
  MIN_COUNTRIES,
  newDaily,
  newEndless,
  next,
  norm,
  PAIRS,
  pickChart,
  placementScore,
  shareText,
  submit,
  truth,
  valueOf,
  yearsFor,
} from '../engine';
import { centroidPlacements, computerPlacements } from '../neighbours';

const data = raw as unknown as StatsData;

describe('pairs and charts', () => {
  it('every pair uses known indicators and has many playable years', () => {
    PAIRS.forEach((p, i) => {
      expect(INDICATOR_BY_CODE.has(p.x) && INDICATOR_BY_CODE.has(p.y), `${p.x}/${p.y}`).toBe(true);
      expect(yearsFor(data, i).length, `${p.x}/${p.y}`).toBeGreaterThanOrEqual(20);
    });
  });

  it('log axes only get positive values; every point lies inside the plot', () => {
    const rng = new Rng(2);
    for (let k = 0; k < 120; k++) {
      const c = pickChart(data, rng, 'hard');
      const pair = PAIRS[c.pair]!;
      const l = layout(data, c);
      expect(l.points.length).toBeGreaterThanOrEqual(MIN_COUNTRIES);
      for (const p of l.points) {
        if (pair.xLog) expect(p.x).toBeGreaterThan(0);
        if (pair.yLog) expect(p.y).toBeGreaterThan(0);
        for (const [v, a] of [
          [p.x, l.x],
          [p.y, l.y],
        ] as const) {
          const n = norm(v, a);
          expect(n).toBeGreaterThan(0);
          expect(n).toBeLessThan(1);
          // Relative check (values reach billions); zero on linear axes compared absolutely.
          const back = denorm(n, a);
          expect(v === 0 ? Math.abs(back) : Math.abs(back / v - 1)).toBeLessThan(1e-9);
        }
      }
      expect(countriesFor(data, pair, c.year)).toEqual(l.points.map((p) => p.ent));
    }
  });

  it('mystery countries follow the difficulty (count, population) and are reproducible', () => {
    for (const d of DIFFICULTIES) {
      const rng = new Rng(9);
      for (let k = 0; k < 40; k++) {
        const c = pickChart(data, rng, d);
        expect(c.targets).toHaveLength(LEVELS[d].targets);
        expect(new Set(c.targets).size).toBe(c.targets.length);
        for (const t of c.targets)
          expect(valueOf(data, 'SP.POP.TOTL', t, c.year) ?? 0).toBeGreaterThanOrEqual(
            LEVELS[d].minPop,
          );
      }
    }
    expect(pickChart(data, new Rng(4), 'normal')).toEqual(pickChart(data, new Rng(4), 'normal'));
  });

  it('truth is the countries’ real values on the chart axes', () => {
    const c = pickChart(data, new Rng(12), 'easy');
    const l = layout(data, c);
    const pair = PAIRS[c.pair]!;
    truth(data, c).forEach(([nx, ny], i) => {
      const t = c.targets[i]!;
      expect(Math.abs(denorm(nx, l.x) / valueOf(data, pair.x, t, c.year)! - 1)).toBeLessThan(1e-9);
      expect(Math.abs(denorm(ny, l.y) / valueOf(data, pair.y, t, c.year)! - 1)).toBeLessThan(1e-9);
    });
  });
});

describe('scoring', () => {
  it('falls with distance: 100 on the spot, 37 at 0.15, 14 at 0.3', () => {
    expect(placementScore([0.4, 0.4], [0.4, 0.4])).toBe(100);
    expect(placementScore([0.4, 0.4], [0.4, 0.55])).toBe(37);
    expect(placementScore([0.1, 0.1], [0.1, 0.4])).toBe(14);
    expect(placementScore([0, 0], [0.09, 0.12])).toBe(37);
  });

  it('the similar-countries estimator clearly beats the centre of the crowd', () => {
    const rng = new Rng(21);
    let knn = 0;
    let centre = 0;
    let n = 0;
    for (let k = 0; k < 60; k++) {
      const c = pickChart(data, rng, 'normal');
      const real = truth(data, c);
      const a = computerPlacements(data, c);
      const b = centroidPlacements(data, c);
      real.forEach((r, i) => {
        knn += placementScore(a[i]!, r);
        centre += placementScore(b[i]!, r);
        n++;
      });
    }
    expect(knn / n).toBeGreaterThan(centre / n + 15);
  });

  it('the estimator never reads the plotted values of the mystery countries', () => {
    const c = pickChart(data, new Rng(30), 'normal');
    const pair = PAIRS[c.pair]!;
    const before = computerPlacements(data, c);
    // Tamper with the mystery countries' plotted values only: the estimate must not change.
    const tampered: StatsData = {
      ...data,
      series: data.series.map(([ind, ent, start, values]) =>
        c.targets.includes(ent) && [pair.x, pair.y].includes(data.indicators[ind]!)
          ? [ind, ent, start, values.map((v) => v * 1.7)]
          : [ind, ent, start, values],
      ),
    };
    const after = computerPlacements(tampered, c);
    after.forEach((p, i) => {
      expect(p[0]).toBeCloseTo(before[i]![0], 1);
      expect(p[1]).toBeCloseTo(before[i]![1], 1);
    });
  });
});

describe('sessions', () => {
  it('the daily challenge is five charts, the same for everyone; perfect placements score 500', () => {
    const a = newDaily(data, 331);
    expect(newDaily(data, 331)).toEqual(a);
    let s = a;
    for (let k = 0; k < DAILY_ROUNDS; k++) {
      s = submit(s, data, truth(data, current(s).c));
      expect(current(s).score).toBe(100);
      if (k < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, data);
        expect(next(s, data, new Set([chartKey(current(n).c)]))).toEqual(n);
        s = n;
      }
    }
    expect(s.status).toBe('done');
    expect(s.total).toBe(500);
    expect(shareText(s, 'Plot the Point')).toBe('Plot the Point #332 — 500/500\n🟩🟩🟩🟩🟩');
  });

  it('rejects incomplete or out-of-plot placements and early advances', () => {
    const s = newEndless(data, 3, 'easy');
    const n = current(s).c.targets.length;
    expect(() => submit(s, data, Array(n - 1).fill([0.5, 0.5]))).toThrow();
    expect(() => submit(s, data, Array(n).fill([1.2, 0.5]))).toThrow();
    expect(() => next(s, data)).toThrow();
    const done = submit(s, data, Array(n).fill([0.5, 0.5]));
    expect(() => submit(done, data, Array(n).fill([0.5, 0.5]))).toThrow();
    expect(isSession(JSON.parse(JSON.stringify(done)))).toBe(true);
    expect(
      isSession({
        ...done,
        rounds: [{ ...done.rounds[0], c: { ...done.rounds[0]!.c, pair: 99 } }],
      }),
    ).toBe(false);
    expect(finish(newEndless(data, 1, 'easy')).rounds).toHaveLength(0);
  });

  it('grid cells map to plot positions and back', () => {
    expect(cellCentre(0)).toEqual([0.02, 0.02]);
    expect(cellOf(cellCentre(312))).toBe(312);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'hard', rounds: 2 }],
  playouts: 3,
  maxSteps: 30,
  checkObservation: (st) => {
    const o = observe(st);
    const targets = new Set(current(st.s).c.targets);
    // Only visible countries' positions are observed.
    expect(o.context.every(([ent]) => !targets.has(ent))).toBe(true);
    expect(Object.keys(o).sort()).toEqual([
      'context',
      'placed',
      'round',
      'targets',
      'total',
      'x',
      'y',
      'year',
    ]);
  },
});
