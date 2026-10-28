/**
 * Word Guess rules: a hidden five-letter word, six guesses, each scored letter by letter as right
 * place, elsewhere in the word, or absent (repeated letters are marked only as many times as the
 * word has them, right places first). Hard mode makes every revealed clue binding.
 */
import { Rng } from '../../core/game-engine/random';
import { ANSWERS, validWords, type Lang } from './words';

export { ANSWERS, validWords, type Lang } from './words';

export const LENGTH = 5;
export const MAX_GUESSES = 6;
export const LANGS: Lang[] = ['en', 'es'];

/** Per letter: 2 right place, 1 elsewhere, 0 absent. */
export type Marks = number[];

export interface WordGuess {
  word: string;
  marks: Marks;
}

export interface WordState {
  lang: Lang;
  seed: number;
  hard: boolean;
  answer: string;
  guesses: WordGuess[];
  status: 'playing' | 'won' | 'lost';
  hints: number;
  elapsedMs: number;
}

export function mark(answer: string, guess: string): Marks {
  const marks = Array.from({ length: guess.length }, () => 0);
  const left = new Map<string, number>();
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) marks[i] = 2;
    else left.set(answer[i]!, (left.get(answer[i]!) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i]) continue;
    const n = left.get(guess[i]!) ?? 0;
    if (n > 0) {
      marks[i] = 1;
      left.set(guess[i]!, n - 1);
    }
  }
  return marks;
}

/** Marks as one base-3 number (0–242). */
export function markKey(answer: string, guess: string): number {
  return mark(answer, guess).reduce((k, m) => k * 3 + m, 0);
}

export const answerFor = (lang: Lang, seed: number) => {
  const list = ANSWERS[lang];
  return list[new Rng(seed >>> 0).int(list.length)]!;
};

export function newWordGame(lang: Lang, seed: number, hard = false): WordState {
  const l: Lang = LANGS.includes(lang) ? lang : 'en';
  return {
    lang: l,
    seed: seed >>> 0,
    hard,
    answer: answerFor(l, seed),
    guesses: [],
    status: 'playing',
    hints: 0,
    elapsedMs: 0,
  };
}

export type Rejection =
  | { kind: 'length' }
  | { kind: 'unknown' }
  | { kind: 'place'; letter: string; at: number }
  | { kind: 'use'; letter: string };

/** Why a word cannot be played now, or null. */
export function rejection(s: WordState, word: string): Rejection | null {
  if (word.length !== LENGTH) return { kind: 'length' };
  if (!validWords(s.lang).has(word)) return { kind: 'unknown' };
  if (!s.hard) return null;
  for (const g of s.guesses) {
    for (let i = 0; i < LENGTH; i++)
      if (g.marks[i] === 2 && word[i] !== g.word[i])
        return { kind: 'place', letter: g.word[i]!, at: i };
    const need = new Map<string, number>();
    g.marks.forEach((m, i) => m && need.set(g.word[i]!, (need.get(g.word[i]!) ?? 0) + 1));
    for (const [letter, n] of need)
      if ([...word].filter((c) => c === letter).length < n) return { kind: 'use', letter };
  }
  return null;
}

export function play(s: WordState, word: string): WordState {
  if (s.status !== 'playing' || rejection(s, word)) return s;
  const marks = mark(s.answer, word);
  const guesses = [...s.guesses, { word, marks }];
  const status =
    word === s.answer ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : ('playing' as const);
  return { ...s, guesses, status };
}

/** Answers that would have given every recorded set of marks. */
export function candidates(lang: Lang, guesses: readonly WordGuess[]): string[] {
  return ANSWERS[lang].filter((w) =>
    guesses.every((g) => mark(w, g.word).every((m, i) => m === g.marks[i])),
  );
}

export interface WordChoice {
  word: string;
  /** Average number of answers left after it. */
  expected: number;
  worst: number;
}

const openers = new Map<string, WordChoice>();

/**
 * The guess (among the answers) leaving the fewest answers on average, then the smallest worst
 * case, preferring a possible answer. With hard mode only guesses obeying the clues are tried.
 */
export function bestGuess(s: Pick<WordState, 'lang' | 'hard' | 'guesses'>): WordChoice {
  const cands = candidates(s.lang, s.guesses);
  const key = `${s.lang}:${s.hard}`;
  if (!s.guesses.length && openers.has(key)) return openers.get(key)!;
  if (cands.length <= 2) return { word: cands[0]!, expected: cands.length ? 1 : 0, worst: 1 };
  const possible = new Set(cands);
  const probe = { ...s, answer: '', seed: 0, status: 'playing' as const, hints: 0, elapsedMs: 0 };
  const pool = ANSWERS[s.lang].filter((w) => !s.hard || !rejection(probe, w));
  const buckets = new Int32Array(243);
  let best: WordChoice | null = null;
  let bestPossible = false;
  for (const g of pool) {
    buckets.fill(0);
    for (const c of cands) buckets[markKey(c, g)]!++;
    let worst = 0;
    let squares = 0;
    for (const b of buckets) {
      if (b > worst) worst = b;
      squares += b * b;
    }
    const expected = squares / cands.length;
    const isPossible = possible.has(g);
    if (
      !best ||
      expected < best.expected - 1e-9 ||
      (Math.abs(expected - best.expected) <= 1e-9 &&
        (worst < best.worst || (worst === best.worst && isPossible && !bestPossible)))
    ) {
      best = { word: g, expected, worst };
      bestPossible = isPossible;
    }
  }
  if (!s.guesses.length) openers.set(key, best!);
  return best!;
}

export function isValidWordState(d: unknown): d is WordState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as WordState;
  if (!LANGS.includes(s.lang) || typeof s.hard !== 'boolean') return false;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (s.answer !== answerFor(s.lang, s.seed)) return false;
  if (!Number.isInteger(s.hints) || s.hints < 0) return false;
  if (typeof s.elapsedMs !== 'number' || !(s.elapsedMs >= 0)) return false;
  if (!Array.isArray(s.guesses) || s.guesses.length > MAX_GUESSES) return false;
  let replay = newWordGame(s.lang, s.seed, s.hard);
  for (const g of s.guesses) {
    if (typeof g !== 'object' || g === null || typeof g.word !== 'string') return false;
    const next = play(replay, g.word);
    if (next === replay) return false;
    const last = next.guesses[next.guesses.length - 1]!;
    if (!Array.isArray(g.marks) || last.marks.join() !== g.marks.join()) return false;
    replay = next;
  }
  return replay.status === s.status;
}
