import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, DATA, env, observe } from '../ai-adapter';
import {
  actual,
  completeDraft,
  current,
  DAILY_ROUNDS,
  drawSegment,
  emptyDraft,
  finish,
  hiddenCount,
  isSession,
  LEVELS,
  newDaily,
  newEndless,
  next,
  pickChallenge,
  pool,
  scoreDrawing,
  shareText,
  STRATEGIES,
  strategyCurve,
  submit,
  TOTALS,
  worldValues,
  type Session,
} from '../engine';
import { INDICATOR_BY_CODE } from '../../shared/stats/indicators';

describe('charts', () => {
  it('pools hold country series whose indicator has a world curve', () => {
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const p = pool(DATA, d, 'all');
      expect(p.length).toBeGreaterThan(1000);
      for (const i of p.slice(0, 200)) expect(DATA.entities[DATA.series[i]![1]]![4]).toBe(0);
    }
  });

  it('300 random charts: window length by level, full world coverage, axis around both curves', () => {
    const rng = new Rng(4);
    for (let k = 0; k < 300; k++) {
      const d = rng.pick(['easy', 'normal', 'hard'] as const);
      const c = pickChallenge(DATA, rng, d, 'all');
      const len = c.to - c.from + 1;
      expect(len).toBeGreaterThanOrEqual(LEVELS[d].window[0]);
      expect(len).toBeLessThanOrEqual(LEVELS[d].window[1]);
      expect(c.cut).toBe(c.from + 1);
      const w = worldValues(DATA, c);
      expect(w.every((v) => v !== null)).toBe(true);
      for (const v of [...actual(DATA, c), ...(w as number[])]) {
        expect(v).toBeGreaterThanOrEqual(c.lo);
        expect(v).toBeLessThanOrEqual(c.hi);
      }
      const ind = INDICATOR_BY_CODE.get(DATA.indicators[DATA.series[c.s]![0]]!)!;
      expect(ind.volatility).toBeLessThanOrEqual(LEVELS[d].volatility);
      if (!ind.signed && Math.min(...actual(DATA, c)) >= 0) expect(c.lo).toBeGreaterThanOrEqual(0);
      expect(TOTALS.has(ind.code)).toBe(false);
      expect((Math.max(...actual(DATA, c)) - c.lo) / (c.hi - c.lo)).toBeGreaterThanOrEqual(0.15);
    }
  });

  it('scores the mean gap as a share of the chart height', () => {
    const c = { s: 0, w: 0, from: 0, to: 3, cut: 1, lo: 0, hi: 100 };
    expect(scoreDrawing(c, [10, 20, 30], [10, 20, 30])).toBe(100);
    expect(scoreDrawing(c, [11, 21, 31], [10, 20, 30])).toBe(90);
    expect(scoreDrawing(c, [15, 25, 35], [10, 20, 30])).toBe(61);
    expect(scoreDrawing(c, [20, 30, 40], [10, 20, 30])).toBe(37);
  });

  it('drawing: strokes fill the years they cross; gaps join from the first point', () => {
    const c = { s: 0, w: 0, from: 0, to: 4, cut: 1, lo: 0, hi: 10 };
    let d = emptyDraft(c);
    expect(completeDraft(c, d, 5)).toBeNull();
    d = drawSegment(c, d, { x: 2, y: 6 }, { x: 4, y: 8 });
    expect(completeDraft(c, d, 5)).toEqual([5.5, 6, 7, 8]);
  });
});

describe('reference curves', () => {
  it('no strategy ever reads the country’s hidden years', () => {
    const c = pickChallenge(DATA, new Rng(9), 'normal', 'all');
    const before = STRATEGIES.map((st) => strategyCurve(DATA, c, st));
    const vals = DATA.series[c.s]![3];
    const saved = vals.slice(c.cut, c.to + 1);
    for (let i = c.cut; i <= c.to; i++) vals[i] = vals[i]! * 3 + 7;
    const after = STRATEGIES.map((st) => strategyCurve(DATA, c, st));
    saved.forEach((v, k) => (vals[c.cut + k] = v));
    expect(after).toEqual(before);
    for (const curve of before) expect(curve).toHaveLength(hiddenCount(c));
  });

  it('similar countries beat following the world, which beats a flat line', () => {
    const rng = new Rng(3);
    const mean: Record<string, number> = {};
    const N = 200;
    for (let k = 0; k < N; k++) {
      const c = pickChallenge(DATA, rng, 'normal', 'all');
      const truth = actual(DATA, c).slice(1);
      for (const st of STRATEGIES)
        mean[st] = (mean[st] ?? 0) + scoreDrawing(c, strategyCurve(DATA, c, st), truth) / N;
    }
    expect(mean.peers!).toBeGreaterThan(mean.world!);
    expect(mean.world!).toBeGreaterThan(mean.flat!);
  });
});

describe('sessions', () => {
  it('the daily is five charts over five topics, the same for everyone', () => {
    const a = newDaily(DATA, 320);
    expect(a).toEqual(newDaily(DATA, 320));
    let s: Session = a;
    const topics: string[] = [];
    for (let i = 0; i < DAILY_ROUNDS; i++) {
      const c = current(s).c;
      topics.push(INDICATOR_BY_CODE.get(DATA.indicators[DATA.series[c.s]![0]]!)!.topic);
      expect(() => submit(s, DATA, [1])).toThrow();
      s = submit(s, DATA, actual(DATA, c).slice(1));
      expect(current(s).score).toBe(100);
      if (i < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, DATA);
        expect(next(s, DATA, new Set([current(n).c.s]))).toEqual(n);
        s = n;
      }
    }
    expect(topics).toEqual(['economy', 'people', 'health', 'environment', 'technology']);
    expect(s.total).toBe(500);
    expect(shareText(s, 'Trend Draw')).toBe('Trend Draw #321 — 500/500\n🟩🟩🟩🟩🟩');
  });

  it('endless runs follow the topic, avoid repeats, clamp drawings, validate and end', () => {
    let s = newEndless(DATA, 6, 'easy', 'health');
    const seen = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const c = current(s).c;
      expect(INDICATOR_BY_CODE.get(DATA.indicators[DATA.series[c.s]![0]]!)!.topic).toBe('health');
      expect(seen.has(c.s)).toBe(false);
      seen.add(c.s);
      s = submit(
        s,
        DATA,
        Array.from({ length: hiddenCount(c) }, () => 1e12),
      );
      expect(current(s).pred!.every((v) => v === c.hi)).toBe(true);
      s = next(s, DATA);
    }
    expect(isSession(JSON.parse(JSON.stringify(s)), DATA)).toBe(true);
    expect(isSession({ ...s, topic: 'art' })).toBe(false);
    expect(isSession({ ...s, rounds: [{ ...current(s), c: { ...current(s).c, cut: 99 } }] })).toBe(
      false,
    );
    s = finish(s);
    expect(s.count).toBe(5);
  });
});

describe('AI', () => {
  it('observations never include the later values', () => {
    const s = newEndless(DATA, 2, 'normal', 'all', new Set(), 1);
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'axis',
      'entity',
      'first',
      'firstYear',
      'hidden',
      'indicator',
      'round',
      'total',
      'world',
    ]);
    expect(o.world).toHaveLength(o.hidden + 1);
  });

  it('the similar-countries agent beats the flat line over 40 sessions', () => {
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
    expect(avg('peers')).toBeGreaterThan(avg('flat') + 20);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'hard', topic: 'economy', rounds: 2 }],
  playouts: 3,
  maxSteps: 20,
});
