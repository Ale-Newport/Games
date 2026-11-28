import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { valueOf } from '../../plot-the-point/engine';
import { INDICATOR_BY_CODE } from '../../shared/stats/indicators';
import { AGENT_PRESETS, BINS, DATA, env, LOCK, neighbourPositions, observe } from '../ai-adapter';
import {
  axisFor,
  boardScore,
  byPopulation,
  choices,
  current,
  DAILY_BOARDS,
  finish,
  isSession,
  lock,
  makeBoard,
  MIN_COUNTRIES,
  newDaily,
  newEndless,
  next,
  place,
  positionOf,
  scorePlacement,
  shareText,
  span,
  truePosition,
  valueAt,
  type Session,
} from '../engine';

const ind = (code: string) => INDICATOR_BY_CODE.get(code)!;

describe('the line', () => {
  it('maps values to positions and back, linear and log', () => {
    const lin = axisFor(ind('SP.DYN.LE00.IN'), [50, 60, 70, 80]);
    expect(lin.log).toBe(false);
    expect(valueAt(lin, positionOf(lin, 63.2))).toBeCloseTo(63.2, 9);
    const log = axisFor(ind('NY.GDP.PCAP.CD'), [300, 2_000, 30_000, 90_000]);
    expect(log.log).toBe(true);
    expect(valueAt(log, positionOf(log, 4_000))).toBeCloseTo(4_000, 6);
    expect(positionOf(log, 1)).toBe(0);
    expect(positionOf(log, 1e9)).toBe(1);
    // A skewed share spanning orders of magnitude gets a log line; anything with zeros does not.
    expect(axisFor(ind('BX.TRF.PWKR.DT.GD.ZS'), [0.01, 0.1, 1, 5, 20, 40]).log).toBe(true);
    expect(axisFor(ind('BX.TRF.PWKR.DT.GD.ZS'), [0, 0.1, 1, 5, 20, 40]).log).toBe(false);
    // Percentile span: one huge outlier does not stretch the line.
    const vals = [...Array.from({ length: 99 }, (_, i) => 10 + i / 10), 10_000];
    expect(span(vals)[1]).toBeLessThan(100);
  });

  it('scores 100 · e^(−d / 0.1)', () => {
    expect(scorePlacement(0.5, 0.5)).toBe(100);
    expect(scorePlacement(0.52, 0.5)).toBe(82);
    expect(scorePlacement(0.45, 0.5)).toBe(61);
    expect(scorePlacement(0.4, 0.5)).toBe(37);
  });
});

describe('boards', () => {
  it('there are hundreds of indicator-years with enough countries', () => {
    const c = choices(DATA);
    expect(c.length).toBeGreaterThan(500);
    for (const [, , have] of c.slice(0, 50))
      expect(have.length).toBeGreaterThanOrEqual(MIN_COUNTRIES);
    expect(
      byPopulation(DATA)
        .slice(0, 3)
        .map((e) => DATA.entities[e]![0]),
    ).toEqual(['IND', 'CHN', 'USA']);
  });

  it('boards over 200 draws: three ordered references and three distinct targets, all on the line', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 200; i++) {
      const b = makeBoard(DATA, rng, rng.pick(['easy', 'normal', 'hard'] as const), 'all');
      const all = [...b.refs, ...b.targets];
      expect(new Set(all).size).toBe(6);
      for (const e of all) {
        expect(DATA.entities[e]![4]).toBe(0);
        const v = valueOf(DATA, b.code, e, b.year)!;
        expect(v).not.toBeNull();
        const p = positionOf(b.axis, v);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
      }
      const refPos = b.refs.map((e) => positionOf(b.axis, valueOf(DATA, b.code, e, b.year)!));
      expect(refPos).toEqual([...refPos].sort((x, y) => x - y));
      const tp = b.targets.map((_, k) => truePosition(DATA, b, k)).sort((x, y) => x - y);
      for (let k = 1; k < tp.length; k++)
        expect(tp[k]! - tp[k - 1]!).toBeGreaterThanOrEqual(0.03 - 1e-9);
    }
  });

  it('easy mystery countries come from the 60 most populous', () => {
    const top = new Set(byPopulation(DATA).slice(0, 60));
    const rng = new Rng(2);
    for (let i = 0; i < 40; i++)
      for (const e of makeBoard(DATA, rng, 'easy', 'health').targets) expect(top.has(e)).toBe(true);
  });
});

describe('sessions', () => {
  it('placing, locking, scoring the average; the daily is five boards over five topics', () => {
    const a = newDaily(DATA, 300);
    expect(a).toEqual(newDaily(DATA, 300));
    let s: Session = a;
    const topics: string[] = [];
    for (let i = 0; i < DAILY_BOARDS; i++) {
      const b = current(s);
      topics.push(ind(b.code).topic);
      expect(() => lock(s, DATA)).toThrow('Place every');
      for (let k = 0; k < 3; k++) s = place(s, k, truePosition(DATA, b, k));
      s = lock(s, DATA);
      expect(current(s).points).toEqual([100, 100, 100]);
      expect(() => place(s, 0, 0.5)).toThrow(i < DAILY_BOARDS - 1 ? 'locked' : 'over');
      if (i < DAILY_BOARDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, DATA);
        expect(next(s, DATA, new Set([current(n).code]))).toEqual(n);
        s = n;
      }
    }
    expect(topics).toEqual(['economy', 'people', 'health', 'environment', 'technology']);
    expect(s.total).toBe(500);
    expect(shareText(s, 'Number Line')).toBe('Number Line #301 — 500/500' + '\n🟩🟩🟩'.repeat(5));
  });

  it('a board scores the rounded average of its three placements', () => {
    let s = newEndless(DATA, 3, 'normal', 'all', new Set(), 1);
    const b = current(s);
    const off = [0, 0.05, 0.2];
    for (let k = 0; k < 3; k++)
      s = place(s, k, Math.min(1, truePosition(DATA, b, k) + off[k]!) || 0);
    s = lock(s, DATA);
    const pts = current(s).points!;
    expect(boardScore(current(s))).toBe(Math.round((pts[0]! + pts[1]! + pts[2]!) / 3));
    expect(pts[0]).toBe(100);
    expect(s.status).toBe('done');
  });

  it('endless boards follow the topic, avoid recent indicators, validate and end', () => {
    let s = newEndless(DATA, 7, 'hard', 'environment');
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const b = current(s);
      expect(ind(b.code).topic).toBe('environment');
      seen.add(b.code);
      for (let k = 0; k < 3; k++) s = place(s, k, 0.5);
      s = lock(s, DATA);
      s = next(s, DATA);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    expect(isSession(JSON.parse(JSON.stringify(s)), DATA)).toBe(true);
    expect(isSession({ ...s, topic: 'sport' })).toBe(false);
    expect(isSession({ ...s, boards: [{ ...current(s), placed: [2, null, null] }] })).toBe(false);
    s = finish(s);
    expect(s.count).toBe(4);
  });
});

describe('AI', () => {
  it('neighbour estimates never read the board indicator for the mystery countries', () => {
    const s = newEndless(DATA, 11, 'normal', 'all', new Set(), 1);
    const o = observe(s);
    const before = neighbourPositions(o);
    // Hide the mystery countries' values on this indicator: the estimates must not change.
    const idx = DATA.indicators.indexOf(o.code);
    const saved = DATA.series
      .filter(([i, e]) => i === idx && o.targets.includes(e))
      .map((r) => [r, [...r[3]]] as const);
    for (const [r] of saved) r[3].fill(0);
    const after = neighbourPositions(o);
    for (const [r, v] of saved) v.forEach((x, k) => (r[3][k] = x));
    expect(after).toEqual(before);
  });

  it('similar countries beat the middle reference, which beats random', () => {
    const avg = (id: string, n: number) => {
      let sum = 0;
      for (let seed = 1; seed <= n; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState({ boards: 2 }, seed);
        const rng = new Rng(seed);
        let steps = 0;
        while (!env.isTerminal(s) && steps++ < 4000)
          s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / n;
    };
    const middle = avg('middle', 30);
    expect(middle).toBeGreaterThan(avg('random', 10) + 20);
    expect(avg('neighbours', 30)).toBeGreaterThan(middle + 15);
  });

  it('lock is legal only once all three are placed; placements map to 201 bins', () => {
    let s = env.createInitialState({ boards: 1 }, 4);
    expect(env.getLegalActions(s)).not.toContain(LOCK);
    s = env.applyAction(s, 0 * (BINS + 1) + 100);
    s = env.applyAction(s, 1 * (BINS + 1) + 0);
    s = env.applyAction(s, 2 * (BINS + 1) + BINS);
    expect(current(s).placed).toEqual([0.5, 0, 1]);
    expect(env.getLegalActions(s)).toContain(LOCK);
  });
});

describeAdapterContract(env, {
  configs: [{ boards: 1 }, { difficulty: 'easy', topic: 'health', boards: 1 }],
  playouts: 2,
  maxSteps: 4000,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'axis',
      'board',
      'code',
      'placed',
      'refs',
      'targets',
      'total',
      'year',
    ]);
  },
});
