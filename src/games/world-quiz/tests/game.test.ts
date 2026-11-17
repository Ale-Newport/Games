import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import {
  clickCountry,
  currentItem,
  foundCount,
  newAttempt,
  total,
  typeAnswer,
} from '../../shared/quiz/engine';
import { env } from '../ai-adapter';
import { worldAchievements } from '../Game';
import { QUIZZES, SOVEREIGN } from '../quizzes';

const quiz = (id: string) => QUIZZES.find((q) => q.id === id)!;

describe('World Quiz bank', () => {
  it('has 21 quizzes over 196 sovereign countries', () => {
    expect(QUIZZES).toHaveLength(21);
    expect(SOVEREIGN).toHaveLength(196);
    expect(total(quiz('countries-world'))).toBe(196);
    expect(total(quiz('flags-world'))).toBe(196);
    const continents = ['eu', 'as', 'af', 'na', 'sa', 'oc'].map((c) =>
      total(quiz(`countries-${c}`)),
    );
    expect(continents.reduce((a, b) => a + b, 0)).toBe(196);
  });

  it('accepts every country and capital by name in both languages', () => {
    for (const q of QUIZZES.filter((x) => x.format !== 'map-click' && x.format !== 'slideshow'))
      for (const lang of ['en', 'es'] as const) {
        let s = newAttempt(q, lang, 1);
        for (const it of q.items) s = typeAnswer(q, s, it.display[lang]).state;
        expect(s.status, `${q.id} ${lang}`).toBe('won');
      }
  });

  it('accepts common alternative names', () => {
    const q = quiz('countries-world');
    let s = newAttempt(q, 'en', 1);
    for (const w of ['USA', 'Holland', 'Burma', 'Ivory Coast', 'UK', 'eeuu'])
      s = typeAnswer(q, s, w).state;
    expect(foundCount(q, s)).toBe(5);
    const c = quiz('capitals-americas');
    let t = newAttempt(c, 'es', 1);
    t = typeAnswer(c, t, 'Washington').state;
    t = typeAnswer(c, t, 'La Paz').state;
    expect(foundCount(c, t)).toBe(2);
  });

  it('runs a map-click quiz by country code', () => {
    const q = quiz('click-eu');
    let s = newAttempt(q, 'en', 4);
    const target = q.items[currentItem(q, s)!]!.iso2!;
    s = clickCountry(q, s, target === 'FR' ? 'ES' : 'FR').state;
    expect(s.wrong).toBe(1);
    s = clickCountry(q, s, target).state;
    expect(foundCount(q, s)).toBe(1);
    while (s.status === 'playing') s = clickCountry(q, s, q.items[currentItem(q, s)!]!.iso2!).state;
    const got: string[] = [];
    worldAchievements(q, s, (id) => got.push(id), {});
    expect(got).toContain('perfect');
    expect(got).not.toContain('sharp-shooter');
  });
});

describeAdapterContract(env, {
  configs: [
    undefined,
    { quiz: 'click-americas', lang: 'es' },
    { quiz: 'flags-eu' },
    { quiz: 'capitals-oc' },
  ],
  playouts: 2,
  maxSteps: 400,
  illegalActions: () => ['a:-1', 'a:9999', 'pass' as never],
});
