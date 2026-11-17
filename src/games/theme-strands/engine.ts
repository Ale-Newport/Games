/**
 * Pure rules for #210 Theme Strands (ruleset `strands-6x8`): trace theme words through a 6×8 grid
 * of letters by joining adjacent cells (any of eight directions). Every letter belongs to exactly
 * one answer; one answer, the spangram, touches two opposite sides. Other real words of four or
 * more letters fill the hint meter: three of them earn a hint, which outlines a theme word; a second
 * press on an outlined word reveals its letter order.
 */
import { PUZZLES, type StrandsPuzzle } from './puzzles';

export const COLS = 6;
export const ROWS = 8;
export const WORDS_PER_HINT = 3;
export const EPOCH = Date.UTC(2026, 0, 1);

export type SubmitResult =
  'theme' | 'spangram' | 'hint-word' | 'already' | 'too-short' | 'not-a-word' | 'invalid';

export interface StrandsState {
  puzzleId: string;
  found: string[];
  /** Non-theme words already counted toward hints. */
  extraWords: string[];
  progress: number;
  hintsUsed: number;
  /** Theme word currently outlined by a hint, and whether its letters are revealed. */
  hint: { word: string; spelled: boolean } | null;
  /** Order in which answers were found, with whether a hint was active for each (share line). */
  log: { word: string; hinted: boolean }[];
  status: 'playing' | 'won';
}

const BY_ID = new Map(PUZZLES.map((p) => [p.id, p]));
export const puzzleById = (id: string): StrandsPuzzle => {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown puzzle ${id}`);
  return p;
};
export const puzzlesFor = (lang: 'en' | 'es') => PUZZLES.filter((p) => p.lang === lang);
export const answers = (p: StrandsPuzzle) => [p.spangram, ...p.words];

export function gameNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}

export function dailyPuzzle(lang: 'en' | 'es', gameNo: number): StrandsPuzzle {
  const list = puzzlesFor(lang);
  return list[((gameNo % list.length) + list.length) % list.length]!;
}

export const letterAt = (p: StrandsPuzzle, cell: number) =>
  p.rows[Math.floor(cell / COLS)]![cell % COLS]!;

export function adjacent(a: number, b: number): boolean {
  const dr = Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS));
  const dc = Math.abs((a % COLS) - (b % COLS));
  return a !== b && dr <= 1 && dc <= 1;
}

export function newGame(p: StrandsPuzzle): StrandsState {
  return {
    puzzleId: p.id,
    found: [],
    extraWords: [],
    progress: 0,
    hintsUsed: 0,
    hint: null,
    log: [],
    status: 'playing',
  };
}

/** Cells already used by found answers. */
export function usedCells(s: StrandsState): Set<number> {
  const p = puzzleById(s.puzzleId);
  return new Set(s.found.flatMap((w) => p.paths[w]!));
}

/** Whether a sequence of cells is a legal trace (adjacent steps, distinct, all free). */
export function validTrace(s: StrandsState, path: readonly number[]): boolean {
  const used = usedCells(s);
  return (
    path.every(
      (c, i) => c >= 0 && c < COLS * ROWS && !used.has(c) && (i === 0 || adjacent(path[i - 1]!, c)),
    ) && new Set(path).size === path.length
  );
}

/**
 * Submits a traced path. Theme words count only along their own cells; any other dictionary word
 * of four or more letters adds to the hint meter once.
 */
export function submitPath(
  s: StrandsState,
  path: readonly number[],
  isWord: (w: string) => boolean,
): { state: StrandsState; result: SubmitResult; word: string } {
  const p = puzzleById(s.puzzleId);
  const word = path.map((c) => letterAt(p, c)).join('');
  if (s.status !== 'playing' || !validTrace(s, path)) return { state: s, result: 'invalid', word };
  if (word.length < 4) return { state: s, result: 'too-short', word };
  const answer = answers(p).find((a) => a === word && p.paths[a]!.join() === path.join());
  if (answer) {
    if (s.found.includes(answer)) return { state: s, result: 'already', word };
    const found = [...s.found, answer];
    const hinted = s.hint?.word === answer;
    return {
      state: {
        ...s,
        found,
        hint: hinted ? null : s.hint,
        log: [...s.log, { word: answer, hinted }],
        status: found.length === answers(p).length ? 'won' : 'playing',
      },
      result: answer === p.spangram ? 'spangram' : 'theme',
      word,
    };
  }
  if (s.extraWords.includes(word)) return { state: s, result: 'already', word };
  if (!isWord(word)) return { state: s, result: 'not-a-word', word };
  return {
    state: { ...s, extraWords: [...s.extraWords, word], progress: s.progress + 1 },
    result: 'hint-word',
    word,
  };
}

export const canHint = (s: StrandsState) =>
  s.status === 'playing' &&
  (s.progress >= WORDS_PER_HINT ||
    (s.hint !== null && !s.hint.spelled && s.progress >= WORDS_PER_HINT));

/** Uses a hint: outline the next unfound theme word, or spell the outlined one. */
export function takeHint(s: StrandsState): StrandsState {
  if (s.status !== 'playing' || s.progress < WORDS_PER_HINT) return s;
  const p = puzzleById(s.puzzleId);
  if (s.hint && !s.hint.spelled)
    return {
      ...s,
      hint: { ...s.hint, spelled: true },
      progress: s.progress - WORDS_PER_HINT,
      hintsUsed: s.hintsUsed + 1,
    };
  const next =
    p.words.find((w) => !s.found.includes(w)) ?? (s.found.includes(p.spangram) ? null : p.spangram);
  if (!next) return s;
  return {
    ...s,
    hint: { word: next, spelled: false },
    progress: s.progress - WORDS_PER_HINT,
    hintsUsed: s.hintsUsed + 1,
  };
}

/** Spoiler-free share line: 🔵 theme word, 🟡 spangram, 💡 for each hint used, in order. */
export function shareLine(s: StrandsState): string {
  const p = puzzleById(s.puzzleId);
  const marks: string[] = [];
  let hints = s.hintsUsed;
  for (const e of s.log) {
    if (e.hinted && hints > 0) {
      marks.push('💡');
      hints--;
    }
    marks.push(e.word === p.spangram ? '🟡' : '🔵');
  }
  while (hints-- > 0) marks.push('💡');
  return marks.join('');
}

export function isValidState(v: unknown): v is StrandsState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as StrandsState;
  return (
    typeof s.puzzleId === 'string' &&
    BY_ID.has(s.puzzleId) &&
    Array.isArray(s.found) &&
    Array.isArray(s.extraWords) &&
    typeof s.progress === 'number' &&
    typeof s.hintsUsed === 'number' &&
    Array.isArray(s.log) &&
    (s.status === 'playing' || s.status === 'won')
  );
}
