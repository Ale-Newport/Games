import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { valueOf } from '../../plot-the-point/engine';
import {
  AGENT_PRESETS,
  analystPlan,
  DATA,
  env,
  LOCK,
  observe,
  STEPS,
  straightPlan,
} from '../ai-adapter';
import {
  BARS,
  bends,
  chartKey,
  current,
  DAILY_ROUNDS,
  finish,
  GAPS,
  isSession,
  lock,
  newDaily,
  newEndless,
  next,
  pickChart,
  scoreGap,
  setGap,
  shareText,
  truth,
  values,
  type Session,
} from '../engine';

describe('charts', () => {
  it('300 random charts: lines with the biggest bend hidden, bars with eight countries', () => {
    const rng = new Rng(8);
    for (let k = 0; k < 300; k++) {
      const kind = k % 2 ? 'bars' : 'line';
      const c = pickChart(DATA, rng, kind, rng.pick(['easy', 'normal', 'hard'] as const), 'all');
      const v = values(DATA, c);
      expect(v.every(Number.isFinite)).toBe(true);
      expect(c.gaps).toHaveLength(GAPS);
      expect([...c.gaps].sort((a, b) => a - b)).toEqual(c.gaps);
      for (const x of v) {
        expect(x).toBeGreaterThanOrEqual(c.lo);
        expect(x).toBeLessThanOrEqual(c.hi);
      }
      if (kind === 'line') {
        expect(c.length).toBeGreaterThanOrEqual(12);
        expect(c.length).toBeLessThanOrEqual(20);
        expect(DATA.entities[c.entity]![4]).toBe(0);
        // Gaps are inner years, two apart, and include the year that bends most.
        for (const g of c.gaps) expect(g > 0 && g < c.length - 1).toBe(true);
        for (let i = 1; i < GAPS; i++)
          expect(c.gaps[i]! - c.gaps[i - 1]!).toBeGreaterThanOrEqual(2);
        const b = bends(v);
        expect(Math.max(...c.gaps.map((g) => b[g]!))).toBe(Math.max(...b));
      } else {
        expect(c.countries).toHaveLength(BARS);
        expect(new Set(c.countries).size).toBe(BARS);
        for (const e of c.countries) expect(DATA.entities[e]![4]).toBe(0);
        const pos = v.filter((x) => x > 0);
        if (pos.length === v.length)
          expect(Math.max(...pos) / Math.min(...pos)).toBeLessThanOrEqual(50);
      }
    }
  });

  it('scores each gap by its error as a share of the chart height', () => {
    const c = {
      kind: 'line' as const,
      code: 'x',
      entity: 0,
      year: 2000,
      length: 12,
      countries: [],
      gaps: [2, 5, 8],
      lo: 0,
      hi: 100,
    };
    expect(scoreGap(c, 50, 50)).toBe(100);
    expect(scoreGap(c, 51, 50)).toBe(90);
    expect(scoreGap(c, 55, 50)).toBe(61);
    expect(scoreGap(c, 40, 50)).toBe(37);
  });
});

describe('sessions', () => {
  it('lines and bars in turn; the daily is five charts, the same for everyone', () => {
    const a = newDaily(DATA, 330);
    expect(a).toEqual(newDaily(DATA, 330));
    let s: Session = a;
    const kinds: string[] = [];
    for (let i = 0; i < DAILY_ROUNDS; i++) {
      const c = current(s).c;
      kinds.push(c.kind);
      expect(() => lock(s, DATA)).toThrow('Set every');
      truth(DATA, c).forEach((v, k) => (s = setGap(s, k, v)));
      s = lock(s, DATA);
      expect(current(s).points).toEqual([100, 100, 100]);
      if (i < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, DATA);
        expect(next(s, DATA, new Set([chartKey(current(n).c)]))).toEqual(n);
        s = n;
      }
    }
    expect(kinds).toEqual(['line', 'bars', 'line', 'bars', 'line']);
    expect(s.total).toBe(500);
    expect(shareText(s, 'Gap Graph')).toBe('Gap Graph #331 — 500/500' + '\n🟩🟩🟩'.repeat(5));
  });

  it('guesses are clamped to the axis; endless runs follow the topic, validate and end', () => {
    let s = newEndless(DATA, 4, 'normal', 'health');
    const c = current(s).c;
    s = setGap(s, 0, 1e15);
    expect(current(s).guesses[0]).toBe(c.hi);
    s = setGap(s, 1, -1e15);
    expect(current(s).guesses[1]).toBe(c.lo);
    s = setGap(s, 2, (c.lo + c.hi) / 2);
    s = lock(s, DATA);
    expect(() => setGap(s, 0, 1)).toThrow('locked');
    s = next(s, DATA);
    expect(isSession(JSON.parse(JSON.stringify(s)), DATA)).toBe(true);
    expect(isSession({ ...s, topic: 'cars' })).toBe(false);
    expect(
      isSession({ ...s, rounds: [{ ...current(s), c: { ...current(s).c, gaps: [1, 2] } }] }),
    ).toBe(false);
    s = finish(s);
    expect(s.count).toBe(1);
  });
});

describe('AI', () => {
  it('straight lines interpolate between visible years; observations hide the gaps', () => {
    const s = newEndless(DATA, 12, 'normal', 'all', new Set(), 1);
    const o = observe(s);
    expect(o.chart.kind).toBe('line');
    o.chart.gaps.forEach((g) => expect(o.visible[g]).toBeNull());
    const plan = straightPlan(o);
    o.chart.gaps.forEach((g, i) => {
      if (o.visible[g - 1] !== null && o.visible[g + 1] !== null)
        expect(plan[i]).toBeCloseTo((o.visible[g - 1]! + o.visible[g + 1]!) / 2, 9);
    });
  });

  it('the analyst never reads the hidden bars’ own values', () => {
    let s = newEndless(DATA, 5, 'normal', 'all', new Set(), 2);
    truth(DATA, current(s).c).forEach((v, k) => (s = setGap(s, k, v)));
    s = next(lock(s, DATA), DATA);
    const o = observe(s);
    expect(o.chart.kind).toBe('bars');
    const before = analystPlan(o);
    const idx = DATA.indicators.indexOf(o.chart.code);
    const hidden = o.chart.gaps.map((g) => o.chart.countries[g]!);
    const rows = DATA.series.filter(([i, e]) => i === idx && hidden.includes(e));
    const saved = rows.map((r) => [...r[3]]);
    rows.forEach((r) => r[3].fill(0));
    const after = analystPlan(o);
    rows.forEach((r, k) => saved[k]!.forEach((v, j) => (r[3][j] = v)));
    expect(after).toEqual(before);
    for (const e of hidden) expect(valueOf(DATA, o.chart.code, e, o.chart.year)).not.toBe(0);
  });

  it('the analyst beats straight lines, which beat random', () => {
    const avg = (id: string, n: number) => {
      let sum = 0;
      for (let seed = 1; seed <= n; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState({ rounds: 4 }, seed);
        const rng = new Rng(seed);
        let steps = 0;
        while (!env.isTerminal(s) && steps++ < 5000)
          s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / n;
    };
    const straight = avg('straight', 30);
    expect(straight).toBeGreaterThan(avg('random', 8) + 60);
    expect(avg('analyst', 30)).toBeGreaterThan(straight);
  });

  it('lock is legal only once every gap is set; actions map to 101 levels', () => {
    let s = env.createInitialState({ rounds: 1 }, 3);
    expect(env.getLegalActions(s)).not.toContain(LOCK);
    const c = current(s).c;
    s = env.applyAction(s, 0 * (STEPS + 1) + 0);
    s = env.applyAction(s, 1 * (STEPS + 1) + STEPS);
    s = env.applyAction(s, 2 * (STEPS + 1) + 50);
    expect(current(s).guesses).toEqual([c.lo, c.hi, c.lo + (c.hi - c.lo) / 2]);
    expect(env.getLegalActions(s)).toContain(LOCK);
  });
});

describeAdapterContract(env, {
  configs: [{ rounds: 1 }, { difficulty: 'easy', topic: 'people', rounds: 2 }],
  playouts: 2,
  maxSteps: 5000,
  checkObservation: (s) => {
    expect(Object.keys(observe(s)).sort()).toEqual([
      'chart',
      'guesses',
      'round',
      'total',
      'visible',
    ]);
  },
});
