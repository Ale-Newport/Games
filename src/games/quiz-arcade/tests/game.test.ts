import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import {
  click,
  currentItem,
  foundCount,
  giveUp,
  newAttempt,
  percent,
  skip,
  tick,
  total,
  typeAnswer,
} from '../../shared/quiz/engine';
import { applyQuiz, knowerMove } from '../../shared/quiz/environment';
import { env } from '../ai-adapter';
import { arcadeAchievements } from '../Game';
import { QUIZZES, toRoman } from '../quizzes';

const quiz = (id: string) => QUIZZES.find((q) => q.id === id)!;

describe('Quiz Arcade bank', () => {
  it('has 18 bilingual quizzes with unique ids and answers for every item', () => {
    expect(QUIZZES).toHaveLength(18);
    expect(new Set(QUIZZES.map((q) => q.id)).size).toBe(18);
    expect(quiz('elements').items).toHaveLength(118);
    for (const q of QUIZZES)
      for (const it of q.items) {
        expect(it.display.en && it.display.es, q.id).toBeTruthy();
        expect(it.keys.en.length + it.keys.es.length, `${q.id} ${it.display.en}`).toBeGreaterThan(
          0,
        );
      }
  });

  it('accepts every listed answer for its own item in free type-in quizzes', () => {
    for (const q of QUIZZES.filter((x) => x.format === 'type')) {
      for (const lang of ['en', 'es'] as const) {
        let s = newAttempt(q, lang, 1);
        for (const it of q.items) s = typeAnswer(q, s, it.display[lang]).state;
        expect(s.status, `${q.id} ${lang}`).toBe('won');
      }
    }
  });

  it('converts Roman numerals', () => {
    expect(toRoman(1999)).toBe('MCMXCIX');
    expect(toRoman(3888)).toBe('MMMDCCCLXXXVIII');
  });
});

describe('quiz engine', () => {
  it('fills repeated answers at once and ignores accents and case', () => {
    const q = quiz('world-cup');
    let s = newAttempt(q, 'es', 1);
    s = typeAnswer(q, s, 'ITALIA').state;
    expect(foundCount(q, s)).toBe(4);
    s = typeAnswer(q, s, 'espana').state;
    expect(foundCount(q, s)).toBe(5);
    expect(typeAnswer(q, s, 'narnia').hit).toBeNull();
  });

  it('runs a slideshow with skips that come back', () => {
    const q = quiz('roman-numerals');
    let s = newAttempt(q, 'en', 3);
    const first = currentItem(q, s)!;
    s = skip(q, s);
    expect(currentItem(q, s)).not.toBe(first);
    while (s.status === 'playing')
      s = typeAnswer(q, s, q.items[currentItem(q, s)!]!.display.en).state;
    expect(s.status).toBe('won');
  });

  it('counts wrong clicks and ends pick-all quizzes on three strikes', () => {
    const q = quiz('pick-primes');
    let s = newAttempt(q, 'en', 2);
    const four = q.items.findIndex((it) => it.display.en === '4');
    for (let i = 0; i < 3; i++) s = click(q, s, four).state;
    expect(s.status).toBe('gave-up');
    const c = quiz('planet-facts');
    let t = newAttempt(c, 'en', 9);
    const cur = currentItem(c, t)!;
    t = click(c, t, (cur + 1) % c.items.length).state;
    expect(t.wrong).toBe(1);
    t = click(c, t, cur).state;
    expect(foundCount(c, t)).toBe(1);
  });

  it('times out and gives up', () => {
    const q = quiz('planets');
    let s = newAttempt(q, 'en', 1);
    s = tick(q, s, 61_000);
    expect(s.status).toBe('timeout');
    expect(giveUp(newAttempt(q, 'en', 1)).status).toBe('gave-up');
    expect(percent(q, s)).toBe(0);
  });

  it('lets the expert agent beat the casual one', () => {
    const score = (knows: number) => {
      let sum = 0;
      for (const q of QUIZZES) {
        let s = env.createInitialState({ quiz: q.id }, 5);
        const rng = new Rng(5);
        while (s.status === 'playing') s = applyQuiz(q, s, knowerMove(q, s, rng, knows));
        sum += percent(q, s);
      }
      return sum;
    };
    expect(score(0.95)).toBeGreaterThan(score(0.5));
  });

  it('awards achievements', () => {
    const q = quiz('planets');
    let s = newAttempt(q, 'en', 1);
    for (const it of q.items) s = typeAnswer(q, s, it.display.en).state;
    const got: string[] = [];
    arcadeAchievements(q, s, (id) => got.push(id), { planets: 100 });
    expect(got).toEqual(expect.arrayContaining(['first-quiz', 'perfect', 'speedy']));
    expect(total(q)).toBe(8);
  });
});

describeAdapterContract(env, {
  configs: [
    undefined,
    { quiz: 'roman-numerals', lang: 'es' },
    { quiz: 'pick-mammals' },
    { quiz: 'planet-facts' },
  ],
  playouts: 3,
  maxSteps: 400,
  illegalActions: () => ['a:-1', 'a:9999', 'pass' as never],
});
