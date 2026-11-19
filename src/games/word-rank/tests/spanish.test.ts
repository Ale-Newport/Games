import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import { loadVectors } from '../../shared/semantic/semantic';
import { climberMove } from '../ai';
import {
  check,
  dailySecret,
  guess,
  isValidState,
  langOf,
  MAX_GUESSES,
  newGame,
  randomGame,
  ranksFor,
  takeHint,
  type RankState,
} from '../engine';
import { SECRETS, SECRETS_ES } from '../secrets';

const es = await loadVectors('es');
const en = await loadVectors('en');

describe('Word Rank in Spanish', () => {
  it('has a large, unique Spanish secret list inside the Spanish vocabulary', () => {
    expect(SECRETS_ES.length).toBeGreaterThanOrEqual(300);
    expect(new Set(SECRETS_ES).size).toBe(SECRETS_ES.length);
    for (const w of SECRETS_ES) expect(es.index.has(w), w).toBe(true);
  });

  it('daily and random games pick Spanish secrets in Spanish', () => {
    for (let n = 0; n < 40; n++) expect(SECRETS_ES).toContain(dailySecret(n, 'es'));
    const g = randomGame(7, MAX_GUESSES, 'es');
    expect(g.lang).toBe('es');
    expect(SECRETS_ES).toContain(g.secret);
    expect(SECRETS).toContain(dailySecret(3));
  });

  it('accepts guesses without accents and plurals, and wins on the secret', () => {
    let s = newGame('árbol', null, MAX_GUESSES, 'es');
    expect(check(es, s, 'Arboles')).toEqual({ word: es.index.get('árbol'), rejection: null });
    const tronco = check(es, s, 'tronco').word!;
    s = guess(es, s, tronco);
    expect(s.guesses[0]!.rank).toBeLessThan(50);
    expect(check(es, s, 'TRONCOS').rejection).toBe('repeat');
    expect(check(es, s, 'qwrtzx').rejection).toBe('unknown');
    s = guess(es, s, check(es, s, 'arbol').word!);
    expect(s.status).toBe('won');
  });

  it('keeps ranks per language when a secret is spelled the same in both', () => {
    const shared = SECRETS.find((w) => SECRETS_ES.includes(w))!;
    expect(shared).toBeDefined();
    const rEs = ranksFor(es, shared);
    const rEn = ranksFor(en, shared);
    expect(rEs).not.toBe(rEn);
    expect(rEs[es.index.get(shared)!]).toBe(1);
    expect(rEn[en.index.get(shared)!]).toBe(1);
  });

  it('validates saves: old saves without a language are English', () => {
    const legacy = { ...newGame('apple') } as RankState;
    delete legacy.lang;
    expect(isValidState(legacy)).toBe(true);
    expect(langOf(legacy)).toBe('en');
    expect(isValidState(newGame('perro', null, MAX_GUESSES, 'es'))).toBe(true);
    expect(isValidState({ ...newGame('perro'), lang: 'en' })).toBe(false);
    expect(isValidState({ ...newGame('perro', null, MAX_GUESSES, 'es'), lang: 'fr' })).toBe(false);
  });

  it('the climbing AI and hints work on the Spanish vocabulary', () => {
    let s = randomGame(11, 60, 'es');
    const rng = new Rng(3);
    s = takeHint(es, s);
    expect(s.guesses[0]!.hint).toBe(true);
    while (s.status === 'playing') {
      const a = climberMove(es, s, rng, true);
      if (a === 'hint') s = takeHint(es, s);
      else if (a === 'give-up') break;
      else s = guess(es, s, Number(a.slice(2)));
    }
    expect(s.guesses.length).toBeGreaterThan(1);
    expect(Math.min(...s.guesses.map((g) => g.rank))).toBeLessThan(300);
  });
});
