import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, env, observe } from '../ai-adapter';
import {
  accuracy,
  canLock,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  feasible,
  feedback,
  finish,
  guess,
  isSci,
  isSession,
  lock,
  newDaily,
  newEndless,
  next,
  pickQuestion,
  pool,
  questionAt,
  roundScore,
  sciValue,
  shareText,
  toSci,
  TOPIC_OF,
  TOPICS,
  type MagnitudeData,
  type Session,
} from '../engine';
import { formatBig, parseNumber } from '../OrderOfMagnitudeGame';
import raw from '../questions.json';

const data = raw as unknown as MagnitudeData;
const value = (subject: string, kind: string) =>
  data.questions.find((q) => q[3] === subject && q[1] === kind)?.[2];

describe('question bank', () => {
  it('ships thousands of distinct, sourced, positive quantities in every kind', () => {
    expect(data.questions.length).toBeGreaterThan(5000);
    const keys = new Set(data.questions.map((q) => `${q[0]}|${q[1]}`));
    expect(keys.size).toBe(data.questions.length);
    for (const [id, kind, v, en, es, fame, year] of data.questions) {
      expect(TOPIC_OF[kind], kind).toBeDefined();
      expect(id).toMatch(/^(Q\d+(:[a-z-]+)?|WB:[A-Z0-9]{3}:[a-z-]+)$/);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1e16);
      expect(en.length && es.length).toBeGreaterThan(0);
      expect(fame).toBeGreaterThanOrEqual(0);
      if (kind === 'city-pop') expect(year).toBeGreaterThanOrEqual(1990);
    }
    expect(new Set(data.questions.map((q) => q[1])).size).toBe(15);
  });

  it('matches widely published figures', () => {
    expect(value('Nile', 'river-length')).toBe(6650);
    expect(value('Mount Everest', 'mountain-elev')).toBe(8848);
    expect(value('Lake Baikal', 'lake-area')).toBeCloseTo(31_720, -2);
    expect(value('Russia', 'country-area')).toBeGreaterThan(17.0e6);
    expect(value('Russia', 'country-area')).toBeLessThan(17.2e6);
    expect(value('the world', 'country-pop')).toBeGreaterThan(8e9);
    expect(value('Jupiter', 'body-diameter')).toBeCloseTo(139_800, -3);
  });
});

describe('numbers and feedback', () => {
  it('scientific notation round-trips at one decimal', () => {
    expect(toSci(3_249_000)).toEqual({ m: 3.2, e: 6 });
    expect(toSci(9_960)).toEqual({ m: 1, e: 4 });
    expect(sciValue({ m: 3.2, e: 6 })).toBe(3_200_000);
    expect(isSci({ m: 3.2, e: 6 })).toBe(true);
    expect(isSci({ m: 3.25, e: 6 })).toBe(false);
    expect(isSci({ m: 10, e: 6 })).toBe(false);
    expect(isSci({ m: 2, e: 16 })).toBe(false);
  });

  it('feedback bands and directions', () => {
    expect(feedback(104, 100)).toEqual({ direction: 'exact', band: 'exact', orders: 0 });
    expect(feedback(90, 100)).toMatchObject({ direction: 'higher', band: 'hot' });
    expect(feedback(160, 100)).toMatchObject({ direction: 'lower', band: 'warm' });
    expect(feedback(500, 100)).toMatchObject({ direction: 'lower', band: 'order' });
    expect(feedback(1, 100)).toEqual({ direction: 'higher', band: 'off', orders: 2 });
    expect(feedback(3e7, 100)).toEqual({ direction: 'lower', band: 'off', orders: 5 });
  });

  it('accuracy and the try factor', () => {
    expect(accuracy(105, 100)).toBe(100);
    expect(accuracy(200, 100)).toBe(85);
    expect(accuracy(1000, 100)).toBe(50);
    expect(accuracy(10, 100)).toBe(50);
    expect(accuracy(1, 100)).toBe(0);
    expect(roundScore(100, 100, 1)).toBe(100);
    expect(roundScore(100, 100, 2)).toBe(85);
    expect(roundScore(200, 100, 3)).toBe(60);
  });

  it('the feasible range always contains the answer (property test)', () => {
    const rng = new Rng(42);
    for (let k = 0; k < 3000; k++) {
      const answer = Math.pow(10, rng.float() * 15) * (1 + rng.float());
      const guesses = Array.from({ length: 3 }, () => {
        const v = sciValue(toSci(Math.pow(10, rng.float() * 15.9)));
        return { value: v, feedback: feedback(v, answer) };
      });
      for (let n = 1; n <= 3; n++) {
        const [lo, hi] = feasible(guesses.slice(0, n));
        const a = Math.log10(answer);
        if (guesses.slice(0, n).some((g) => g.feedback.band === 'exact')) continue;
        expect(a).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(a).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it('formats and parses numbers in both languages', () => {
    expect(formatBig(3_200_000, 'en')).toBe('3,200,000 (3.2 million)');
    expect(formatBig(120_000, 'es')).toBe('120.000');
    expect(parseNumber('3,200,000', 'en')).toBe(3_200_000);
    expect(parseNumber('3.200.000', 'es')).toBe(3_200_000);
    expect(parseNumber('3.2e6', 'en')).toBe(3_200_000);
    expect(parseNumber('3,2e6', 'es')).toBe(3_200_000);
    expect(parseNumber('abc', 'en')).toBeNull();
    expect(parseNumber('0.5', 'en')).toBeNull();
  });
});

describe('questions and sessions', () => {
  it('every difficulty and topic has questions; picks respect the topic and vary in kind', () => {
    for (const d of DIFFICULTIES)
      for (const t of TOPICS) expect(pool(data, d, t).length, `${d}/${t}`).toBeGreaterThan(40);
    const rng = new Rng(2);
    const kinds = new Set<string>();
    for (let k = 0; k < 300; k++) {
      const i = pickQuestion(data, rng, 'normal', 'geography');
      expect(TOPIC_OF[data.questions[i]![1]]).toBe('geography');
      kinds.add(data.questions[i]![1]);
    }
    expect(kinds.size).toBe(5);
  });

  it('daily: five different questions, identical for everyone; exact first guesses score 500', () => {
    const a = newDaily(data, 331);
    expect(newDaily(data, 331)).toEqual(a);
    let s = a;
    const seen = new Set<number>();
    for (let k = 0; k < DAILY_ROUNDS; k++) {
      seen.add(current(s).q);
      s = guess(s, data, toSci(questionAt(data, current(s).q).value));
      expect(current(s).locked).toBe(true);
      expect(current(s).score).toBe(100);
      if (k < DAILY_ROUNDS - 1) s = next(s, data);
    }
    expect(seen.size).toBe(5);
    expect(s.status).toBe('done');
    expect(shareText(s, 'Order of Magnitude')).toBe(
      'Order of Magnitude #332 — 500/500\n🟩1 🟩1 🟩1 🟩1 🟩1',
    );
  });

  it('three guesses at most, locking scores the last one, illegal moves are rejected', () => {
    let s: Session = newEndless(data, 3, 'easy', 'all');
    const answer = questionAt(data, current(s).q).value;
    const far = { m: 1, e: answer > 1e8 ? 0 : 15 };
    expect(canLock(s)).toBe(false);
    expect(() => lock(s, data)).toThrow();
    expect(() => guess(s, data, { m: 0.5, e: 3 })).toThrow();
    s = guess(s, data, far);
    s = guess(s, data, far);
    expect(current(s).locked).toBe(false);
    const twice = lock(s, data);
    expect(current(twice).score).toBe(Math.round(accuracy(sciValue(far), answer) * 0.85));
    s = guess(s, data, far);
    expect(current(s).locked).toBe(true);
    expect(() => guess(s, data, far)).toThrow();
    expect(() => lock(s, data)).toThrow();
  });

  it('endless runs keep totals, validate after a round trip, and end cleanly', () => {
    let s = newEndless(data, 8, 'hard', 'all');
    for (let k = 0; k < 20; k++) {
      s = guess(s, data, toSci(questionAt(data, current(s).q).value * 3));
      s = lock(s, data);
      s = next(s, data);
    }
    expect(s.count).toBe(20);
    expect(s.rounds.length).toBeLessThanOrEqual(12);
    expect(isSession(JSON.parse(JSON.stringify(s)), data)).toBe(true);
    expect(isSession({ ...s, rounds: [{ ...s.rounds[0], guesses: [1, 2, 3, 4] }] })).toBe(false);
    expect(isSession({ ...s, rounds: [{ ...s.rounds[0], locked: true, score: null }] })).toBe(
      false,
    );
    expect(finish(s).rounds.length).toBe(s.rounds.length - 1);
  });
});

describe('AI', () => {
  it('feedback-driven agents beat random by far, and prior knowledge helps', () => {
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
    const bisect = avg('bisect');
    const informed = avg('informed');
    expect(bisect).toBeGreaterThan(random + 200);
    expect(informed).toBeGreaterThan(bisect);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', topic: 'space', rounds: 2 }],
  playouts: 6,
  maxSteps: 20,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'guesses',
      'id',
      'kind',
      'round',
      'subject',
      'total',
      'year',
    ]);
    for (const g of o.guesses) expect(Object.keys(g).sort()).toEqual(['feedback', 'value']);
  },
});
