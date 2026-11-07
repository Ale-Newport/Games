import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { frequencyMove, hangmanActions, solverMove } from '../ai';
import { hangmanEnv } from '../ai-adapter';
import {
  CATEGORIES,
  WORDS,
  bestLetter,
  cleanWord,
  fitting,
  guess,
  isValidHangmanState,
  livesLeft,
  misses,
  newHangman,
  pattern,
  type HangmanState,
} from '../engine';

describe('Hangman lists', () => {
  it('has clean, distinct words in every category of both languages', () => {
    for (const lang of ['en', 'es'] as const)
      for (const c of CATEGORIES) {
        const list = WORDS[lang][c];
        expect(list.length).toBeGreaterThanOrEqual(25);
        expect(new Set(list).size).toBe(list.length);
        for (const w of list) expect(cleanWord(lang, w)).toBe(w);
      }
  });

  it('cleans typed words: accents dropped, ñ kept, only letters', () => {
    expect(cleanWord('es', ' Camión ')).toBe('camion');
    expect(cleanWord('es', 'Niño')).toBe('niño');
    expect(cleanWord('en', 'niño')).toBeNull();
    expect(cleanWord('en', 'ab')).toBeNull();
    expect(cleanWord('en', 'two words')).toBeNull();
  });
});

describe('Hangman play', () => {
  it('reveals hits, counts misses and ends won or lost', () => {
    let s = newHangman('en', 'normal', 'any', 1, 'banana');
    s = guess(s, 'a');
    expect(pattern(s)).toBe('_a_a_a');
    s = guess(s, 'z');
    expect(misses(s)).toBe(1);
    expect(livesLeft(s)).toBe(5);
    expect(guess(s, 'z')).toBe(s);
    s = guess(guess(s, 'b'), 'n');
    expect(s.status).toBe('won');
    let l = newHangman('es', 'hard', 'any', 1, 'queso');
    for (const c of 'abcdf') l = guess(l, c);
    expect(l.status).toBe('lost');
    expect(misses(l)).toBe(5);
  });

  it('draws words from the chosen category and validates saves', () => {
    const s = newHangman('es', 'easy', 'food', 9);
    expect(WORDS.es.food).toContain(s.word);
    const any = newHangman('en', 'normal', 'any', 9);
    expect(CATEGORIES).toContain(any.category);
    const played = guess(guess(s, 'e'), 'x');
    expect(isValidHangmanState(played)).toBe(true);
    expect(isValidHangmanState(guess(any, 'e'))).toBe(true);
    expect(isValidHangmanState({ ...played, word: 'tomate' === s.word ? 'queso' : 'tomate' })).toBe(
      false,
    );
    expect(isValidHangmanState({ ...played, status: 'won' })).toBe(false);
    expect(isValidHangmanState({ ...played, guessed: ['e', 'e'] })).toBe(false);
    const custom = guess(newHangman('en', 'normal', 'any', 3, 'quokka'), 'k');
    expect(isValidHangmanState(custom)).toBe(true);
  });

  it('keeps the word among the fitting words and the solver wins every word', () => {
    for (const lang of ['en', 'es'] as const)
      for (const c of CATEGORIES)
        for (const word of WORDS[lang][c].slice(0, 6)) {
          let s: HangmanState = { ...newHangman(lang, 'hard', c, 1), category: c, word };
          while (s.status === 'playing') {
            expect(fitting(s)).toContain(word);
            s = guess(s, solverMove(s));
          }
          expect(s.status).toBe('won');
        }
  });

  it('falls back on letter frequency for a word outside the lists', () => {
    const s = guess(newHangman('en', 'normal', 'any', 1, 'qwqwq'), 'q');
    expect(fitting(s)).toEqual([]);
    expect(bestLetter(s)).toMatchObject({ letter: 'e', fits: 0 });
    expect(frequencyMove(guess(s, 'e'))).toBe('t');
  });

  it('shows only the pattern in the observation until the end', () => {
    const s = hangmanEnv.applyAction(hangmanEnv.createInitialState(undefined, 4), 'e');
    const o = hangmanEnv.getObservation(s, 0);
    expect(o.word).toBe(pattern(s));
    expect(bestLetter(o).letter).toBe(bestLetter(s).letter);
  });
});

describeAdapterContract(hangmanEnv, {
  configs: [undefined, { lang: 'es', level: 'hard', category: 'sports' }],
  playouts: 6,
  maxSteps: 30,
  illegalActions: (s) => ['1', 'ab', '', 'ñ'].filter((a) => !hangmanActions(s).includes(a)),
});
