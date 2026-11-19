import { describe, expect, it } from 'vitest';
import { loadVectors, lookup } from '../../shared/semantic/semantic';
import { operativeGuess, SKILLS, spymasterClue } from '../bots';
import {
  clueProblem,
  giveClue,
  guess,
  isValidState,
  langOf,
  newGame,
  pass,
  WORD_POOL_ES,
  type CodeState,
} from '../engine';

const es = await loadVectors('es');
const isWord = (w: string) => es.index.has(w);

describe('Code Words in Spanish', () => {
  it('has a large Spanish pool of single words the bots can all read', () => {
    expect(WORD_POOL_ES.length).toBeGreaterThanOrEqual(300);
    expect(new Set(WORD_POOL_ES).size).toBe(WORD_POOL_ES.length);
    for (const w of WORD_POOL_ES) {
      expect(w, w).toMatch(/^[a-záéíóúüñ]{3,}$/);
      // Plurals and accent variants resolve the same way the bots read board words.
      expect(lookup(es, w), w).not.toBeNull();
    }
  });

  it('deals Spanish boards and keeps the language in saves', () => {
    const s = newGame(9, 'es');
    expect(s.lang).toBe('es');
    for (const w of s.words) expect(WORD_POOL_ES).toContain(w);
    expect(isValidState(s)).toBe(true);
    const legacy = { ...newGame(9) } as CodeState;
    delete legacy.lang;
    expect(isValidState(legacy)).toBe(true);
    expect(langOf(legacy)).toBe('en');
    expect(isValidState({ ...s, lang: 'de' })).toBe(false);
  });

  it('validates Spanish clues: accents allowed, board words matched without accents', () => {
    const s = newGame(3, 'es');
    const board = s.words.find((w) => /[áéíóú]/.test(w)) ?? s.words[0]!;
    const plain = board.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    expect(clueProblem(s, plain, 1, isWord)).toBe('on-board');
    expect(clueProblem(s, board, 1, isWord)).toBe('on-board');
    const outside = ['canción', 'montaña', 'música', 'pequeño'].find(
      (w) => !s.words.some((b) => b.includes(w.slice(0, 4))),
    )!;
    expect(clueProblem(s, outside, 2, isWord)).toBeNull();
    expect(clueProblem(s, 'qwxz', 1, isWord)).toBe('not-a-word');
    expect(clueProblem(s, 'tree', 1, isWord)).toBe('not-a-word');
  });

  it('bots give legal Spanish clues and finish games', () => {
    let hits = 0;
    let touches = 0;
    for (let seed = 1; seed <= 4; seed++) {
      let s = newGame(seed, 'es');
      for (let turn = 0; turn < 40 && s.status === 'playing'; turn++) {
        const team = s.turn;
        const c = spymasterClue(es, s, team, SKILLS.normal);
        expect(clueProblem(s, c.word, c.number, isWord), c.word).toBeNull();
        s = giveClue(s, c.word, c.number);
        while (s.status === 'playing' && s.turn === team && s.phase === 'guess') {
          const g = operativeGuess(es, s, 0.2);
          if (g === null) {
            s = pass(s);
            break;
          }
          touches++;
          if (s.roles[g] === team) hits++;
          s = guess(s, g);
        }
      }
      expect(s.status).toBe('over');
    }
    expect(hits / touches).toBeGreaterThan(0.5);
  }, 60_000);
});
