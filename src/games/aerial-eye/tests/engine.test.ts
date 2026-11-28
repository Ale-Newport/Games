import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, DATA, env, observe, predictColours, visibleColours } from '../ai-adapter';
import credits from '../credits.json';
import {
  CATEGORIES,
  current,
  DAILY_ROUNDS,
  finish,
  isSession,
  newDaily,
  newEndless,
  next,
  OPTIONS,
  pick,
  PICKS,
  pool,
  POINTS,
  shareText,
  ZOOM,
  zoomOf,
  type Session,
} from '../engine';

const IMAGES = import.meta.glob('../images/*.jpg');
const CREDITS = credits as Record<string, { page: string; artist: string; license: string }>;

describe('data, photos and credits', () => {
  it('every place has a photo, a credit with a licence, a category, a country and colours', () => {
    expect(DATA.length).toBeGreaterThan(300);
    for (const [qid, cat, en, es, lat, lon, cen, ces, fame, file, colours] of DATA) {
      expect(CATEGORIES).toContain(cat);
      expect(en.length && es.length && cen.length && ces.length).toBeTruthy();
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lon)).toBeLessThanOrEqual(180);
      expect(fame).toBeGreaterThanOrEqual(25);
      expect(file).toMatch(/\.(jpe?g|png)$/i);
      expect(IMAGES[`../images/${qid}.jpg`], qid).toBeDefined();
      const c = CREDITS[qid]!;
      expect(c.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(c.license.length).toBeGreaterThan(1);
      expect(c.artist.length).toBeGreaterThan(0);
      expect(colours).toHaveLength(27);
      for (const v of colours) expect(v >= 0 && v <= 255).toBe(true);
    }
    expect(Object.keys(IMAGES)).toHaveLength(DATA.length);
    expect(Object.keys(CREDITS)).toHaveLength(DATA.length);
  });

  it('every category has enough places for six options at every difficulty', () => {
    for (const c of CATEGORIES)
      for (const d of ['easy', 'normal', 'hard'] as const)
        expect(pool(DATA, d, c).length, `${c} ${d}`).toBeGreaterThanOrEqual(OPTIONS);
  });
});

describe('rounds and sessions', () => {
  it('six options of one kind; wrong picks zoom out; points 100 / 50 / 20; three misses lose', () => {
    let s = newEndless(DATA, 4, 'hard', 'airport', new Set(), 4);
    const r0 = current(s);
    expect(r0.options).toHaveLength(OPTIONS);
    expect(new Set(r0.options).size).toBe(OPTIONS);
    for (const o of r0.options) expect(DATA[o]![1]).toBe('airport');
    expect(zoomOf(r0)).toBe(ZOOM[0]);
    const wrong = r0.options.filter((o) => o !== r0.target);
    s = pick(s, wrong[0]!);
    expect(zoomOf(current(s))).toBe(ZOOM[1]);
    expect(() => pick(s, wrong[0]!)).toThrow('Already');
    expect(() =>
      pick(
        s,
        DATA.findIndex((r) => r[1] === 'island'),
      ),
    ).toThrow('Not an option');
    s = pick(s, r0.target);
    expect(current(s)).toMatchObject({ status: 'won', score: POINTS[1] });
    expect(zoomOf(current(s))).toBe(1);
    s = next(s, DATA);
    s = pick(s, current(s).target);
    expect(current(s).score).toBe(100);
    s = next(s, DATA);
    const r2 = current(s);
    for (const o of r2.options.filter((o) => o !== r2.target).slice(0, PICKS)) s = pick(s, o);
    expect(current(s)).toMatchObject({ status: 'lost', score: 0 });
    expect(s.total).toBe(150);
  });

  it('the daily is five photos of five kinds, the same for everyone', () => {
    const a = newDaily(DATA, 320);
    expect(a).toEqual(newDaily(DATA, 320));
    let s: Session = a;
    const kinds = new Set<string>();
    for (let i = 0; i < DAILY_ROUNDS; i++) {
      kinds.add(DATA[current(s).target]![1]);
      s = pick(s, current(s).target);
      if (i < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, DATA);
        expect(next(s, DATA, new Set([current(n).target]))).toEqual(n);
        s = n;
      }
    }
    expect(kinds.size).toBe(5);
    expect(s.total).toBe(500);
    expect(shareText(s, 'Aerial Eye')).toBe('Aerial Eye #321 — 500/500\n🟩\n🟩\n🟩\n🟩\n🟩');
  });

  it('endless runs follow the kind, avoid repeats, validate and end', () => {
    let s = newEndless(DATA, 6, 'normal', 'volcano');
    const seen = new Set<number>();
    for (let i = 0; i < 6; i++) {
      expect(DATA[current(s).target]![1]).toBe('volcano');
      expect(seen.has(current(s).target)).toBe(false);
      seen.add(current(s).target);
      s = pick(s, current(s).target);
      s = next(s, DATA);
    }
    expect(isSession(JSON.parse(JSON.stringify(s)), DATA)).toBe(true);
    expect(isSession({ ...s, category: 'moon' })).toBe(false);
    expect(isSession({ ...s, rounds: [{ ...current(s), options: [1, 2, 3] }] }, DATA)).toBe(false);
    s = finish(s);
    expect(s.count).toBe(6);
  });
});

describe('AI', () => {
  it('the observation shows only the visible colours, never the answer', () => {
    let s = newEndless(DATA, 3, 'hard', 'all', new Set(), 1);
    expect(observe(s).colours).toHaveLength(3);
    const r = current(s);
    s = pick(
      s,
      r.options.find((o) => o !== r.target)!,
    );
    expect(observe(s).colours).toHaveLength(27);
    expect(observe(s).struck).toHaveLength(1);
    expect(visibleColours(DATA[0]![10], 0)).toEqual(DATA[0]![10].slice(12, 15));
  });

  it('colour predictions never use the options’ own photos', () => {
    const s = newEndless(DATA, 8, 'hard', 'city', new Set(), 1);
    const o = observe(s);
    // Changing the target's stored colours must not change any prediction.
    const target = current(s).target;
    const before = o.options.map((opt) => predictColours(o, opt));
    const saved = DATA[target]![10];
    DATA[target]![10] = saved.map(() => 0);
    const after = o.options.map((opt) => predictColours(o, opt));
    DATA[target]![10] = saved;
    expect(after).toEqual(before);
  });

  it('the colour reader beats chance over many photos', () => {
    let total = 0;
    const N = 60;
    for (let seed = 1; seed <= N; seed++) {
      const agent = AGENT_PRESETS.find((a) => a.id === 'colours')!.create();
      let s = env.createInitialState(undefined, seed);
      const rng = new Rng(seed);
      while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
      total += s.total;
    }
    // Random play averages 141.7 per five photos (100/6 + 50/6 + 20/6 per photo).
    expect(total / N).toBeGreaterThan(145);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', category: 'castle', rounds: 2 }],
  playouts: 4,
  maxSteps: 30,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'category',
      'colours',
      'options',
      'round',
      'struck',
      'total',
    ]);
  },
});
