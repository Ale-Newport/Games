import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import { loadVectors } from '../../shared/semantic/semantic';
import { warmerMove } from '../ai';
import {
  check,
  dailySecret,
  guess,
  isValidState,
  langOf,
  MAX_GUESSES,
  newGame,
  randomGame,
  secretInfo,
  type WarmState,
} from '../engine';
import { SECRETS, SECRETS_ES } from '../secrets';

const es = await loadVectors('es');
const en = await loadVectors('en');

describe('Word Warmth in Spanish', () => {
  it('has a large, unique Spanish secret list inside the Spanish vocabulary', () => {
    expect(SECRETS_ES.length).toBeGreaterThanOrEqual(220);
    expect(new Set(SECRETS_ES).size).toBe(SECRETS_ES.length);
    for (const w of SECRETS_ES) expect(es.index.has(w), w).toBe(true);
  });

  it('daily and random games pick from the language’s list', () => {
    for (let n = 0; n < 40; n++) expect(SECRETS_ES).toContain(dailySecret(n, 'es'));
    expect(SECRETS).toContain(dailySecret(5));
    expect(randomGame(4, MAX_GUESSES, 'es').lang).toBe('es');
  });

  it('scores similarity in Spanish and finds the nearest thousand', () => {
    let s = newGame('tormenta', null, MAX_GUESSES, 'es');
    const lluvia = check(es, s, 'lluvia').word!;
    s = guess(es, s, lluvia);
    const g = s.guesses[0]!;
    expect(g.near).not.toBeNull();
    expect(g.score).toBeGreaterThan(30);
    s = guess(es, s, check(es, s, 'Tormentas').word!);
    expect(s.status).toBe('won');
    expect(secretInfo(es, 'tormenta').nearestList.length).toBe(1000);
  });

  it('caches secret data per language', () => {
    const shared = SECRETS.find((w) => SECRETS_ES.includes(w));
    if (!shared) return;
    expect(secretInfo(es, shared)).not.toBe(secretInfo(en, shared));
  });

  it('validates saves: old saves without a language are English', () => {
    const legacy = { ...newGame('ability') } as WarmState;
    delete legacy.lang;
    expect(isValidState(legacy)).toBe(true);
    expect(langOf(legacy)).toBe('en');
    expect(isValidState(newGame('valiente', null, MAX_GUESSES, 'es'))).toBe(true);
    expect(isValidState({ ...newGame('valiente'), lang: 'en' })).toBe(false);
  });

  it('the AI warms up on Spanish words', () => {
    let s = randomGame(21, 80, 'es');
    const rng = new Rng(5);
    while (s.status === 'playing') {
      const a = warmerMove(es, s, rng);
      if (a === 'give-up') break;
      s = guess(es, s, Number(a.slice(2)));
    }
    expect(s.guesses.length).toBeGreaterThan(1);
    expect(Math.max(...s.guesses.map((g) => g.score))).toBeGreaterThan(25);
  });
});
