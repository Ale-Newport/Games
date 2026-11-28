import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { env, observe, stepToMetres, AGENT_PRESETS } from '../ai-adapter';
import {
  axisOf,
  BUILT_IN,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  finish,
  guessRange,
  isSession,
  LEVELS,
  lockIn,
  newDaily,
  newEndless,
  next,
  pickReference,
  pickTarget,
  pool,
  refThing,
  scoreGuess,
  shareText,
  thingAt,
  TOPICS,
  topicOf,
  type Session,
  type SizeData,
} from '../engine';
import { formatLength } from '../format';
import raw from '../objects.json';
import { ASPECT } from '../Silhouettes';

const data = raw as unknown as SizeData;
const find = (name: string) => data.objects.find((o) => o[4] === name)!;

/** Locks in `factor` × the real size (clamped to the allowed range). */
function play(s: Session, factor: number): Session {
  const r = current(s);
  const [lo, hi] = guessRange(refThing(data, r.ref).metres);
  const g = Math.min(hi, Math.max(lo, thingAt(data, r.target).metres * factor));
  return lockIn(s, data, g);
}

describe('Wikidata object sizes', () => {
  it('ships thousands of distinct, named, measured objects in every family', () => {
    expect(data.objects.length).toBeGreaterThan(5000);
    const keys = new Set(data.objects.map((o) => `${o[0]}:${o[2]}`));
    expect(keys.size).toBe(data.objects.length);
    for (const [id, family, , m, en, es, fame] of data.objects) {
      expect(id).toMatch(/^Q\d+$/);
      expect(ASPECT[family]).toBeGreaterThan(0);
      expect(m).toBeGreaterThan(0);
      expect(en.length && es.length).toBeGreaterThan(0);
      expect(fame).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(data.objects.map((o) => o[1])).size).toBeGreaterThanOrEqual(18);
  });

  it('matches widely published figures for well-known objects', () => {
    const near = (name: string, metres: number, tol: number) => {
      const o = find(name);
      expect(o, name).toBeDefined();
      expect(Math.abs(o[3] / metres - 1), name).toBeLessThan(tol);
    };
    near('Burj Khalifa', 828, 0.01);
    near('Golden Gate Bridge', 2737, 0.01);
    near('Jupiter', 139_820_000, 0.01); // mean diameter ≈ 139,820 km
    near('Earth', 12_742_000, 0.01); // mean diameter ≈ 12,742 km
    near('Moon', 3_474_800, 0.01); // mean diameter ≈ 3,474.8 km
  });
});

describe('scoring and formatting', () => {
  it('is proportional and symmetric in log space', () => {
    expect(scoreGuess(100, 100)).toBe(100);
    expect(scoreGuess(110, 100)).toBe(90);
    expect(scoreGuess(200, 100)).toBe(45);
    expect(scoreGuess(50, 100)).toBe(45);
    expect(scoreGuess(300, 100)).toBe(28);
    expect(scoreGuess(1000, 100)).toBe(7);
    expect(scoreGuess(0, 100)).toBe(0);
  });

  it('formats lengths in sensible units', () => {
    expect(formatLength(0.0256, 'metric', 'en')).toBe('2.56 cm');
    expect(formatLength(828, 'metric', 'en')).toBe('828 m');
    expect(formatLength(2737, 'metric', 'en')).toBe('2.737 km');
    expect(formatLength(12_742_000, 'metric', 'es')).toBe('12.740 km');
    expect(formatLength(828, 'imperial', 'en')).toBe('2,720 ft');
    expect(formatLength(0.0256, 'imperial', 'en')).toBe('1.01 in');
  });
});

describe('targets and references', () => {
  it('references sit on the same axis within the difficulty ratio', () => {
    for (const d of DIFFICULTIES) {
      const rng = new Rng(3);
      const [lo, hi] = LEVELS[d].ratio;
      for (let k = 0; k < 400; k++) {
        const t = pickTarget(data, rng, d, 'all');
        const target = thingAt(data, t);
        expect(target.fame).toBeGreaterThanOrEqual(LEVELS[d].fame);
        const ref = refThing(data, pickReference(data, t, rng, d));
        expect(axisOf(ref.family)).toBe(axisOf(target.family));
        expect(ref.id).not.toBe(target.id);
        const r = Math.max(ref.metres / target.metres, target.metres / ref.metres);
        expect(r).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(r).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it('every category has objects and picks stay in it; families are varied', () => {
    for (const topic of TOPICS) {
      expect(pool(data, 'normal', topic).length).toBeGreaterThan(50);
      const rng = new Rng(8);
      const fams = new Set<string>();
      for (let k = 0; k < 200; k++) {
        const th = thingAt(data, pickTarget(data, rng, 'normal', topic));
        if (topic !== 'all') expect(topicOf(th.family)).toBe(topic);
        fams.add(th.family);
      }
      if (topic === 'all') expect(fams.size).toBeGreaterThan(12);
    }
  });

  it('uses the built-in standards as references when they fit', () => {
    const rng = new Rng(1);
    const coin = data.objects.findIndex((o) => o[1] === 'coin');
    const refs = new Set<string | number>();
    for (let k = 0; k < 60; k++) refs.add(pickReference(data, coin, rng, 'hard'));
    expect([...refs].some((r) => r === 'ref:cd')).toBe(true);
    expect(BUILT_IN.every((b) => b.metres > 0)).toBe(true);
  });
});

describe('sessions', () => {
  it('the daily challenge is five different objects, the same for everyone', () => {
    const a = newDaily(data, 331);
    expect(newDaily(data, 331)).toEqual(a);
    expect(newDaily(data, 332).rounds[0]).not.toEqual(a.rounds[0]);
    let s = a;
    const ids = new Set<number>();
    for (let k = 0; k < DAILY_ROUNDS; k++) {
      ids.add(current(s).target);
      s = play(s, 1);
      expect(current(s).score).toBe(100);
      if (k < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, data);
        expect(next(s, data, new Set([current(n).target]))).toEqual(n);
        s = n;
      }
    }
    expect(ids.size).toBe(5);
    expect(s.status).toBe('done');
    expect(s.total).toBe(500);
    expect(shareText(s, 'Size Sense')).toBe('Size Sense #332 — 500/500\n🟩🟩🟩🟩🟩');
  });

  it('rejects out-of-range or repeated guesses and early advances', () => {
    const s = newEndless(data, 5, 'easy', 'all');
    const [lo, hi] = guessRange(refThing(data, current(s).ref).metres);
    expect(() => lockIn(s, data, hi * 2)).toThrow();
    expect(() => lockIn(s, data, lo / 2)).toThrow();
    expect(() => lockIn(s, data, Number.NaN)).toThrow();
    expect(() => next(s, data)).toThrow();
    const locked = lockIn(s, data, lo);
    expect(() => lockIn(locked, data, lo)).toThrow();
  });

  it('endless runs keep exact totals, trim history and validate after a round trip', () => {
    let s = newEndless(data, 9, 'hard', 'all');
    let total = 0;
    for (let k = 0; k < 25; k++) {
      s = play(s, 2);
      expect(current(s).score).toBe(45);
      total += 45;
      s = next(s, data);
    }
    expect(s.count).toBe(25);
    expect(s.total).toBe(total);
    expect(s.rounds.length).toBeLessThanOrEqual(12);
    expect(isSession(JSON.parse(JSON.stringify(s)), data)).toBe(true);
    expect(isSession({ ...s, rounds: [{ ...s.rounds[0], ref: 'ref:moon' }] })).toBe(false);
    expect(isSession({ ...s, rounds: [{ ...s.rounds[0], target: 10 ** 7 }] }, data)).toBe(false);
    expect(finish(s).status).toBe('done');
    expect(finish(newEndless(data, 1, 'easy', 'all')).rounds).toHaveLength(0);
  });
});

describe('AI', () => {
  it('the typical-size agent clearly beats the naive ones', () => {
    const avg = (id: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 60; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState(undefined, seed);
        while (!env.isTerminal(s)) {
          const a = agent.selectAction(env, s, 0, {
            rng: new Rng(seed),
            legalActions: env.getLegalActions(s),
          } as never);
          s = env.applyAction(s, a);
        }
        sum += s.total;
      }
      return sum / 60;
    };
    const typical = avg('typical');
    expect(typical).toBeGreaterThan(avg('reference') + 30);
    expect(stepToMetres(10, 4)).toBe(20);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', topic: 'space', rounds: 3 }],
  playouts: 6,
  maxSteps: 10,
  checkObservation: (s) => {
    const o = observe(s);
    const truth = thingAt(data, current(s).target).metres;
    // The mystery size is nowhere in the observation; only the reference's size is.
    expect(Object.keys(o).sort()).toEqual(['dim', 'family', 'name', 'reference', 'round', 'total']);
    expect(Object.keys(o.reference).sort()).toEqual(['family', 'metres', 'name']);
    expect(o.reference.metres).not.toBe(truth);
  },
});
