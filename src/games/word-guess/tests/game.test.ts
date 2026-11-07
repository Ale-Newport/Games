import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { solverMove, wordActions } from '../ai';
import { wordEnv } from '../ai-adapter';
import {
  ANSWERS,
  candidates,
  isValidWordState,
  mark,
  newWordGame,
  play,
  rejection,
  validWords,
} from '../engine';

describe('Word Guess marks', () => {
  it('marks right places first and repeated letters only as often as the word has them', () => {
    expect(mark('crane', 'crane')).toEqual([2, 2, 2, 2, 2]);
    expect(mark('crane', 'nacre')).toEqual([1, 1, 1, 1, 2]);
    expect(mark('eerie', 'tepee')).toEqual([0, 2, 0, 1, 2]);
    expect(mark('abbey', 'babes')).toEqual([1, 1, 2, 2, 0]);
    expect(mark('apple', 'pppxx')).toEqual([0, 2, 2, 0, 0]);
    expect(mark('apple', 'xxxpp')).toEqual([0, 0, 0, 1, 1]);
    expect(mark('llama', 'hello')).toEqual([0, 0, 1, 1, 0]);
  });

  it('has clean word lists in both languages', () => {
    for (const lang of ['en', 'es'] as const) {
      expect(ANSWERS[lang].length).toBeGreaterThan(600);
      for (const w of ANSWERS[lang]) {
        expect(w).toMatch(lang === 'en' ? /^[a-z]{5}$/ : /^[a-zñ]{5}$/);
        expect(validWords(lang).has(w)).toBe(true);
      }
      expect(new Set(ANSWERS[lang]).size).toBe(ANSWERS[lang].length);
    }
    expect(validWords('en').size).toBeGreaterThan(10_000);
    expect(validWords('es').has('niños')).toBe(true);
    expect(validWords('en').has('tears')).toBe(true);
  });
});

describe('Word Guess play', () => {
  it('rejects unknown words and, in hard mode, guesses ignoring clues', () => {
    const s = { ...newWordGame('en', 1, true), answer: 'crane' };
    expect(rejection(s, 'xyzzy')).toEqual({ kind: 'unknown' });
    expect(rejection(s, 'cran')).toEqual({ kind: 'length' });
    const after = play(s, 'trace');
    expect(after.guesses[0]!.marks).toEqual([0, 2, 2, 1, 2]);
    expect(rejection(after, 'brick')).toMatchObject({ kind: 'place' });
    expect(rejection(after, 'grape')).toMatchObject({ kind: 'use', letter: 'c' });
    expect(rejection(after, 'crane')).toBeNull();
    expect(rejection({ ...after, hard: false }, 'brick')).toBeNull();
  });

  it('wins on the word and loses after six misses', () => {
    let s = newWordGame('es', 3);
    const other = ANSWERS.es.find((w) => w !== s.answer)!;
    for (let i = 0; i < 6; i++) s = play(s, other);
    expect(s.status).toBe('lost');
    expect(play(s, s.answer)).toBe(s);
    expect(play(newWordGame('es', 3), newWordGame('es', 3).answer).status).toBe('won');
  });

  it('keeps the answer among the candidates and the solver finishes within six', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      let s = newWordGame(seed % 2 ? 'en' : 'es', seed);
      while (s.status === 'playing') {
        expect(candidates(s.lang, s.guesses)).toContain(s.answer);
        s = play(s, solverMove(s));
      }
      expect(s.status).toBe('won');
      expect(s.guesses.length).toBeLessThanOrEqual(5);
    }
  });

  it('validates saves by regenerating the answer and replaying the marks', () => {
    const s = play(newWordGame('en', 9), 'about');
    expect(isValidWordState(s)).toBe(true);
    expect(isValidWordState({ ...s, answer: 'zebra' === s.answer ? 'crane' : 'zebra' })).toBe(
      false,
    );
    expect(isValidWordState({ ...s, guesses: [{ word: 'about', marks: [2, 2, 2, 2, 2] }] })).toBe(
      s.answer === 'about',
    );
    expect(isValidWordState({ ...s, guesses: [{ word: 'qqqqq', marks: [0, 0, 0, 0, 0] }] })).toBe(
      false,
    );
    expect(isValidWordState({ ...s, lang: 'fr' })).toBe(false);
  });

  it('hides the answer from the observation until the end', () => {
    const s = wordEnv.createInitialState({ lang: 'es' }, 4);
    expect(wordEnv.getObservation(s, 0).answer).toBe('?????');
    const done = wordEnv.applyAction(s, s.answer);
    expect(wordEnv.getObservation(done, 0).answer).toBe(s.answer);
    expect(wordEnv.getOutcome(done)?.returns).toEqual([1]);
  });
});

describeAdapterContract(wordEnv, {
  configs: [undefined, { lang: 'es', hard: true }],
  playouts: 4,
  maxSteps: 10,
  illegalActions: (s) => ['xyzzq', 'abc', 'ABOUT', ''].filter((a) => !wordActions(s).includes(a)),
});
