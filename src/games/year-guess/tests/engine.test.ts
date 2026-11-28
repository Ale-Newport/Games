import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import {
  AGENT_PRESETS,
  actionYear,
  clueEstimate,
  DATA,
  env,
  nearestAction,
  observe,
  tokens,
} from '../ai-adapter';
import {
  astro,
  current,
  DAILY_ROUNDS,
  DIFFICULTIES,
  ERAS,
  eraOf,
  eventAt,
  finish,
  fromAstro,
  guess,
  halfLife,
  isSession,
  isYear,
  MAX_YEAR,
  MIN_YEAR,
  newDaily,
  newEndless,
  next,
  parseYear,
  pool,
  positionOf,
  scoreYear,
  shareText,
  topicOf,
  TOPICS,
  yearAt,
  yearsApart,
  type Session,
} from '../engine';

const find = (en: string) => DATA.events.findIndex((e) => e[2] === en);
const answerOf = (s: Session) => eventAt(DATA, current(s).event).year;

describe('data', () => {
  it('ships thousands of clean dated events across every kind', () => {
    expect(DATA.events.length).toBeGreaterThan(3000);
    const kinds = new Set(DATA.events.map((e) => DATA.kinds[e[0]]));
    expect(kinds.size).toBe(DATA.kinds.length);
    for (const [k, year, en, es, den, des, qid, fame] of DATA.events) {
      expect(DATA.kinds[k]).toBeDefined();
      expect(isYear(year)).toBe(true);
      expect(en.length).toBeGreaterThan(1);
      expect(es.length).toBeGreaterThan(1);
      expect(qid).toMatch(/^Q\d+$/);
      expect(fame).toBeGreaterThan(0);
      // Nothing on screen gives the year away.
      for (const s of [en, es])
        expect(s).not.toMatch(new RegExp(`(^|\\D)${Math.abs(year)}(\\D|$)`));
      for (const s of [den, des]) expect(s).not.toMatch(/\d|century|siglo/i);
    }
    expect(new Set(DATA.events.map((e) => e[6])).size).toBe(DATA.events.length);
  });

  it('matches well-known dates', () => {
    const check = (en: string, year: number) => {
      const i = find(en);
      expect(i, en).toBeGreaterThanOrEqual(0);
      expect(DATA.events[i]![1], en).toBe(year);
    };
    check('Battle of Hastings', 1066);
    check('Treaty of Versailles', 1919);
    check('Battle of Waterloo', 1815);
    check('Telephone', 1876);
    // BC dates: the RDF export is astronomical (−0479 = 480 BC); the game is historical.
    check('Battle of Thermopylae', -480);
    check('Battle of Marathon', -490);
    check('Battle of Alesia', -52);
    check('Battle of Pharsalus', -48);
  });
});

describe('years and the timeline', () => {
  it('has no year 0 and counts across it', () => {
    expect(astro(-1)).toBe(0);
    expect(fromAstro(0)).toBe(-1);
    expect(fromAstro(astro(-44))).toBe(-44);
    expect(yearsApart(-1, 1)).toBe(1);
    expect(yearsApart(-44, 14)).toBe(57);
    expect(isYear(0)).toBe(false);
    expect(isYear(MIN_YEAR)).toBe(true);
    expect(isYear(MAX_YEAR + 1)).toBe(false);
  });

  it('positions are monotonic, invertible, and compressed with age', () => {
    expect(positionOf(MIN_YEAR)).toBeCloseTo(0, 9);
    expect(positionOf(MAX_YEAR)).toBeCloseTo(1, 9);
    let prev = -1;
    for (let y = MIN_YEAR; y <= MAX_YEAR; y += 7) {
      if (y === 0) continue;
      const p = positionOf(y);
      expect(p).toBeGreaterThan(prev);
      prev = p;
    }
    for (const y of [-2500, -44, 1, 1066, 1815, 1969, 2020, 2025])
      expect(yearAt(positionOf(y))).toBe(y);
    // A year near today is wider than a century in antiquity.
    expect(positionOf(2020) - positionOf(2019)).toBeGreaterThan(
      positionOf(-1900) - positionOf(-2000),
    );
    // Every action maps to a real year, and the nearest action of a year lands within its tolerance.
    for (let a = 0; a <= 1000; a += 37) expect(isYear(actionYear(a))).toBe(true);
    for (const y of [-490, 800, 1492, 1789, 1999])
      expect(yearsApart(actionYear(nearestAction(y)), y)).toBeLessThanOrEqual(halfLife(y) / 4);
  });

  it('scores with a half-life of 4 % of the age', () => {
    expect(scoreYear(2000, 2000)).toBe(100);
    expect(scoreYear(2001, 2000)).toBe(71);
    expect(scoreYear(2005, 2000)).toBe(18);
    expect(scoreYear(1046, 1066)).toBe(70);
    expect(scoreYear(-590, -490)).toBe(50);
    expect(scoreYear(2010, 2020)).toBe(3);
    expect(halfLife(2025)).toBe(2);
  });

  it('reads typed years', () => {
    expect(parseYear('1815')).toBe(1815);
    expect(parseYear(' 1,815 ')).toBe(1815);
    expect(parseYear('-44')).toBe(-44);
    expect(parseYear('44 BC')).toBe(-44);
    expect(parseYear('44 bce')).toBe(-44);
    expect(parseYear('44 a. C.')).toBe(-44);
    expect(parseYear('44 aC')).toBe(-44);
    expect(parseYear('753 a. de C.')).toBe(-753);
    expect(parseYear('AD 33')).toBe(33);
    expect(parseYear('33 d. C.')).toBe(33);
    for (const bad of ['', '0', '2031', '4000 BC', 'abc', '-44 BC', '12.5'])
      expect(parseYear(bad)).toBeNull();
  });
});

describe('pools and sessions', () => {
  it('pools respect difficulty, era and topic', () => {
    const all = pool(DATA, 'hard', 'all', 'all');
    expect(all).toHaveLength(DATA.events.length);
    expect(pool(DATA, 'easy', 'all', 'all').length).toBeLessThan(
      pool(DATA, 'normal', 'all', 'all').length,
    );
    for (const era of ERAS) {
      const p = pool(DATA, 'normal', era, 'all');
      expect(p.length, era).toBeGreaterThan(20);
      for (const i of p) expect(eraOf(DATA.events[i]![1])).toBe(era);
    }
    for (const topic of TOPICS.filter((t) => t !== 'all')) {
      const p = pool(DATA, 'easy', 'all', topic);
      expect(p.length, topic).toBeGreaterThan(30);
      for (const i of p) expect(topicOf(eventAt(DATA, i).kind)).toBe(topic);
    }
  });

  it('the daily is five events, one per era, the same for everyone', () => {
    const a = newDaily(DATA, 300);
    expect(a).toEqual(newDaily(DATA, 300));
    expect(newDaily(DATA, 301).rounds[0]!.event).not.toBe(a.rounds[0]!.event);
    let s = a;
    const eras: string[] = [];
    for (let i = 0; i < DAILY_ROUNDS; i++) {
      const y = answerOf(s);
      const era = eraOf(y);
      eras.push(era === 'medieval' ? 'ancient' : era);
      expect(era === 'medieval' ? 'ancient' : era).toBe(s.plan[i]);
      s = guess(s, DATA, y);
      expect(current(s).score).toBe(100);
      if (i < DAILY_ROUNDS - 1) s = next(s, DATA);
    }
    expect(new Set(eras).size).toBe(5);
    expect(s.status).toBe('done');
    expect(s.total).toBe(500);
    expect(shareText(s, 'Year Guess')).toBe('Year Guess #301 — 500/500\n🟩🟩🟩🟩🟩');
    expect(() => next(s, DATA)).toThrow();
  });

  it('endless runs avoid repeats, reject bad years, validate and end', () => {
    let s = newEndless(DATA, 9, 'normal', 'all', 'arts');
    expect(() => guess(s, DATA, 0)).toThrow();
    expect(() => guess(s, DATA, 2030)).toThrow();
    const seen = new Set<number>();
    for (let i = 0; i < 8; i++) {
      expect(seen.has(current(s).event)).toBe(false);
      seen.add(current(s).event);
      expect(topicOf(eventAt(DATA, current(s).event).kind)).toBe('arts');
      s = guess(s, DATA, 1900);
      expect(() => guess(s, DATA, 1900)).toThrow();
      s = next(s, DATA);
    }
    expect(isSession(JSON.parse(JSON.stringify(s)), DATA)).toBe(true);
    expect(isSession({ ...s, era: 'future' })).toBe(false);
    expect(isSession({ ...s, rounds: [{ event: 1e9, guess: null, score: null }] }, DATA)).toBe(
      false,
    );
    s = finish(s);
    expect(s.count).toBe(8);
    expect(s.rounds.every((r) => r.guess === 1900)).toBe(true);
    expect(DIFFICULTIES).toContain(s.difficulty);
  });
});

describe('AI', () => {
  it('tokenises without accents or stop words', () => {
    expect(tokens('The Battle of Águila')).toEqual(['battle', 'aguila']);
    expect(tokens('Batalla de las Navas')).toEqual(['batalla', 'navas']);
  });

  it('clue estimates stay on the timeline and observations hide the year', () => {
    const s = newEndless(DATA, 3, 'hard', 'all', 'all');
    const p = clueEstimate(observe(s));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
    expect(Object.keys(observe(s)).sort()).toEqual([
      'description',
      'descriptionEs',
      'kind',
      'name',
      'nameEs',
      'round',
      'total',
    ]);
  });

  it('clue words beat the typical year, which beats random', () => {
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
    const clues = avg('clues');
    const kind = avg('kind');
    expect(kind).toBeGreaterThan(avg('random') + 15);
    expect(clues).toBeGreaterThan(kind + 10);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', era: 'c19', topic: 'all', rounds: 3 }],
  playouts: 4,
  maxSteps: 12,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.values(o)).not.toContain(answerOf(s));
  },
});
