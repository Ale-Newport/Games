/**
 * Hangman rules: a hidden word from a category (or one typed by a second player), guessed one
 * letter at a time; a wrong letter costs a life. Levels set the lives and whether the category is
 * shown. Also the letter-choosing solver used by the AI and the hints.
 */
import { Rng } from '../../core/game-engine/random';
import { CATEGORIES, WORDS, type Category, type Lang } from './words';

export { CATEGORIES, WORDS, type Category, type Lang } from './words';

export const LANGS: Lang[] = ['en', 'es'];
export const ALPHABET: Record<Lang, string> = {
  en: 'abcdefghijklmnopqrstuvwxyz',
  es: 'abcdefghijklmnñopqrstuvwxyz',
};
/** Letters by frequency in each language, the fallback when no listed word fits. */
const FREQUENCY: Record<Lang, string> = {
  en: 'etaoinshrdlcumwfgypbvkjxqz',
  es: 'eaosrnidlctumpbgvyqhfzjñxkw',
};

export interface Level {
  lives: number;
  showCategory: boolean;
}
export const LEVELS: Record<string, Level> = {
  easy: { lives: 8, showCategory: true },
  normal: { lives: 6, showCategory: true },
  hard: { lives: 5, showCategory: false },
};

export interface HangmanState {
  lang: Lang;
  level: string;
  seed: number;
  /** The category, or 'custom' for a word typed by a player. */
  category: Category | 'custom';
  word: string;
  guessed: string[];
  status: 'playing' | 'won' | 'lost';
  hints: number;
  elapsedMs: number;
}

export const levelOf = (s: { level: string }) => LEVELS[s.level] ?? LEVELS.normal!;
export const misses = (s: HangmanState) => s.guessed.filter((l) => !s.word.includes(l)).length;
export const livesLeft = (s: HangmanState) => levelOf(s).lives - misses(s);
export const solved = (s: HangmanState) => [...s.word].every((l) => s.guessed.includes(l));

/** The category drawn for 'any' and the word, both from the seed. */
export function pick(lang: Lang, category: Category | 'any', seed: number) {
  const rng = new Rng(seed >>> 0);
  const cat = category === 'any' ? CATEGORIES[rng.int(CATEGORIES.length)]! : category;
  const list = WORDS[lang][cat];
  return { category: cat, word: list[rng.int(list.length)]! };
}

/** Normalizes a typed word: lower case, accents dropped (ñ kept); null if not a valid word. */
export function cleanWord(lang: Lang, raw: string): string | null {
  const w = raw
    .trim()
    .toLowerCase()
    .replace(/ñ/g, '\0')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\0/g, 'ñ');
  if (w.length < 3 || w.length > 14) return null;
  return [...w].every((c) => ALPHABET[lang].includes(c)) ? w : null;
}

export function newHangman(
  lang: Lang,
  level: string,
  category: Category | 'any',
  seed: number,
  custom?: string,
): HangmanState {
  const l: Lang = LANGS.includes(lang) ? lang : 'en';
  const lv = LEVELS[level] ? level : 'normal';
  const chosen = custom ? { category: 'custom' as const, word: custom } : pick(l, category, seed);
  return {
    lang: l,
    level: lv,
    seed: seed >>> 0,
    category: chosen.category,
    word: chosen.word,
    guessed: [],
    status: 'playing',
    hints: 0,
    elapsedMs: 0,
  };
}

export function guess(s: HangmanState, letter: string): HangmanState {
  if (s.status !== 'playing' || !ALPHABET[s.lang].includes(letter) || letter.length !== 1) return s;
  if (s.guessed.includes(letter)) return s;
  const next = { ...s, guessed: [...s.guessed, letter] };
  if (solved(next)) return { ...next, status: 'won' };
  if (livesLeft(next) <= 0) return { ...next, status: 'lost' };
  return next;
}

/** The word as shown: letters guessed so far, '_' for the others. */
export const pattern = (s: HangmanState) =>
  [...s.word].map((l) => (s.guessed.includes(l) ? l : '_')).join('');

/** Listed words that fit what the player can see (length, revealed letters, missed letters). */
export function fitting(s: HangmanState): string[] {
  const shown = pattern(s);
  const known = levelOf(s).showCategory && s.category !== 'custom';
  const pool = known
    ? WORDS[s.lang][s.category as Category]
    : CATEGORIES.flatMap((c) => WORDS[s.lang][c]);
  const wrong = s.guessed.filter((l) => !s.word.includes(l));
  return [...new Set(pool)].filter(
    (w) =>
      w.length === shown.length &&
      [...w].every((c, i) => (shown[i] === '_' ? !s.guessed.includes(c) : c === shown[i])) &&
      !wrong.some((l) => w.includes(l)),
  );
}

export interface LetterChoice {
  letter: string;
  /** How many of the fitting words contain it (0 when none fit and frequency decides). */
  count: number;
  fits: number;
}

/** The unguessed letter found in the most fitting words, then the most frequent in the language. */
export function bestLetter(s: HangmanState): LetterChoice {
  const words = fitting(s);
  const freq = FREQUENCY[s.lang];
  const open = [...ALPHABET[s.lang]].filter((l) => !s.guessed.includes(l));
  let best: LetterChoice | null = null;
  for (const letter of open) {
    const count = words.filter((w) => w.includes(letter)).length;
    if (
      !best ||
      count > best.count ||
      (count === best.count && freq.indexOf(letter) < freq.indexOf(best.letter))
    )
      best = { letter, count, fits: words.length };
  }
  return best!;
}

export function isValidHangmanState(d: unknown): d is HangmanState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as HangmanState;
  if (!LANGS.includes(s.lang) || !LEVELS[s.level]) return false;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (typeof s.word !== 'string' || cleanWord(s.lang, s.word) !== s.word) return false;
  if (s.category !== 'custom') {
    // A drawn word must come back from the seed (drawn from its category or from any category).
    if (!CATEGORIES.includes(s.category)) return false;
    const any = pick(s.lang, 'any', s.seed);
    const fixed = pick(s.lang, s.category, s.seed);
    if (fixed.word !== s.word && (any.category !== s.category || any.word !== s.word)) return false;
  }
  if (!Number.isInteger(s.hints) || s.hints < 0) return false;
  if (typeof s.elapsedMs !== 'number' || !(s.elapsedMs >= 0)) return false;
  if (!Array.isArray(s.guessed)) return false;
  let replay: HangmanState = { ...s, guessed: [], status: 'playing' };
  for (const l of s.guessed) {
    const next = guess(replay, l);
    if (next === replay) return false;
    replay = next;
  }
  return replay.status === s.status;
}
