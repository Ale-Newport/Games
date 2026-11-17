/**
 * Pure rules for the quiz games (#204 Quiz Arcade, #205 World Quiz). A quiz is a list of items
 * with accepted answers; formats decide how the player gives them:
 * - `type`: free typing; an answer is accepted the moment it matches any item still open
 *   (the input clears), in any order. With hints, items show as a table of hint → blank.
 * - `slideshow`: one item at a time (a hint, a flag or a shape); type it or skip.
 * - `click`: one prompt at a time; click the matching tile in a grid of every answer.
 * - `pick`: click every correct tile among distractors; wrong clicks cost a strike.
 * - `map-type`: free typing of countries, filled in on a map.
 * - `map-click`: a country is named; click it on the map.
 * Results: items found, time used, wrong clicks; giving up or the clock reveals the rest.
 */
import { Rng } from '../../../core/game-engine/random';
import type { LocalizedText } from '../../../core/i18n';

const ARTICLES = new Set(['the', 'a', 'an', 'el', 'la', 'los', 'las', 'un', 'una']);

/**
 * Quiz answer key: case, accents, punctuation, spacing and leading articles ignored. Unlike the
 * survey games there is no plural folding, because answers are accepted as they are typed
 * ("Mar" must not count as "Mars").
 */
export function normalize(text: string): string {
  const words = text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  while (words.length > 1 && ARTICLES.has(words[0]!)) words.shift();
  return words.join('');
}

export type Lang = 'en' | 'es';
export type Format = 'type' | 'slideshow' | 'click' | 'pick' | 'map-type' | 'map-click';

export interface QuizItem {
  /** What a found item shows. */
  display: LocalizedText;
  /** Normalized accepted answers per language. */
  keys: Record<Lang, string[]>;
  hint?: LocalizedText;
  /** Country code for map and flag quizzes. */
  iso2?: string;
  /** Picture shown in a slideshow. */
  picture?: { kind: 'flag'; iso2: string } | { kind: 'polygon'; sides: number };
  /** For `pick` quizzes: false for distractors. */
  correct?: boolean;
}

export interface Quiz {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  format: Format;
  seconds: number;
  items: QuizItem[];
  /** Column headers for hint tables. */
  columns?: { hint: LocalizedText; answer: LocalizedText };
  /** Slideshow / click order is shuffled per attempt. */
  shuffle?: boolean;
  /** Map view for map quizzes: region filter on continents. */
  region?: string[];
  category: string;
}

export type Status = 'playing' | 'won' | 'gave-up' | 'timeout';

export interface QuizState {
  quizId: string;
  lang: Lang;
  seed: number;
  /** Item order for slideshow/click formats. */
  order: number[];
  /** Position in `order` for sequential formats. */
  cursor: number;
  found: boolean[];
  /** Items skipped in a slideshow (shown again after the others). */
  skipped: number;
  wrong: number;
  elapsedMs: number;
  status: Status;
}

export const MAX_STRIKES = 3;

/** Builds keys from display names plus extra aliases. */
export function keysOf(names: Record<Lang, string[]>): Record<Lang, string[]> {
  return {
    en: [...new Set(names.en.map(normalize).filter(Boolean))],
    es: [...new Set(names.es.map(normalize).filter(Boolean))],
  };
}

const SMALL = new Set(['of', 'the', 'and', 'at', 'de', 'del', 'la', 'las', 'los', 'el', 'y', 'en']);

/** Capitalizes a lower-case display name ("north america" → "North America"). */
export function titleCase(text: string): string {
  if (text !== text.toLowerCase()) return text;
  return text
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Item from `"english/alias|español/alias"` (+ optional hint). */
export function item(spec: string, hint?: LocalizedText, extra: Partial<QuizItem> = {}): QuizItem {
  const [en = '', es = en] = spec.split('|');
  const enN = en.split('/').map((s) => s.trim());
  const esN = es.split('/').map((s) => s.trim());
  return {
    display: { en: titleCase(enN[0]!), es: titleCase(esN[0]!) },
    keys: keysOf({ en: enN, es: esN }),
    ...(hint ? { hint } : {}),
    ...extra,
  };
}

export const sequential = (q: Quiz) =>
  q.format === 'slideshow' || q.format === 'click' || q.format === 'map-click';

export function targets(q: Quiz): number[] {
  return q.items.flatMap((it, i) => (q.format === 'pick' && it.correct === false ? [] : [i]));
}

export function newAttempt(q: Quiz, lang: Lang, seed: number): QuizState {
  const idx = targets(q);
  const order =
    q.shuffle || q.format === 'click' || q.format === 'map-click'
      ? new Rng(seed >>> 0).shuffle(idx)
      : idx;
  return {
    quizId: q.id,
    lang,
    seed: seed >>> 0,
    order,
    cursor: 0,
    found: q.items.map(() => false),
    skipped: 0,
    wrong: 0,
    elapsedMs: 0,
    status: 'playing',
  };
}

export const foundCount = (q: Quiz, s: QuizState) => targets(q).filter((i) => s.found[i]).length;
export const total = (q: Quiz) => targets(q).length;

function settle(q: Quiz, s: QuizState): QuizState {
  if (foundCount(q, s) === total(q)) return { ...s, status: 'won' };
  if (q.format === 'pick' && s.wrong >= MAX_STRIKES) return { ...s, status: 'gave-up' };
  return s;
}

/** The item a sequential quiz is asking about, if any. */
export function currentItem(q: Quiz, s: QuizState): number | null {
  if (!sequential(q) || s.status !== 'playing') return null;
  for (let k = 0; k < s.order.length; k++) {
    const i = s.order[(s.cursor + k) % s.order.length]!;
    if (!s.found[i]) return i;
  }
  return null;
}

function matches(it: QuizItem, key: string, lang: Lang): boolean {
  return it.keys[lang].includes(key) || it.keys[lang === 'en' ? 'es' : 'en'].includes(key);
}

/**
 * Typed text. Free formats accept any open item it matches; slideshows only the current item.
 * Returns the item found, or null (no penalty: typing continues, as on the original sites).
 */
export function typeAnswer(
  q: Quiz,
  s: QuizState,
  text: string,
): { state: QuizState; hit: number | null } {
  if (s.status !== 'playing') return { state: s, hit: null };
  const key = normalize(text);
  if (!key) return { state: s, hit: null };
  if (q.format === 'slideshow') {
    const cur = currentItem(q, s);
    if (cur === null || !matches(q.items[cur]!, key, s.lang)) return { state: s, hit: null };
    const found = s.found.map((f, i) => f || i === cur);
    return { state: settle(q, { ...s, found, cursor: s.order.indexOf(cur) + 1 }), hit: cur };
  }
  if (q.format !== 'type' && q.format !== 'map-type') return { state: s, hit: null };
  // Every open item with this answer is filled at once (repeated answers in hint tables).
  const hits = q.items.flatMap((it, i) => (!s.found[i] && matches(it, key, s.lang) ? [i] : []));
  if (hits.length === 0) return { state: s, hit: null };
  const found = s.found.map((f, i) => f || hits.includes(i));
  return { state: settle(q, { ...s, found }), hit: hits[0]! };
}

/** Clicks a tile (click/pick) or a country (map-click). Wrong clicks count. */
export function click(
  q: Quiz,
  s: QuizState,
  index: number,
): { state: QuizState; correct: boolean } {
  if (s.status !== 'playing' || !q.items[index]) return { state: s, correct: false };
  if (q.format === 'pick') {
    if (s.found[index]) return { state: s, correct: true };
    const ok = q.items[index]!.correct !== false;
    const next = ok
      ? { ...s, found: s.found.map((f, i) => f || i === index) }
      : { ...s, wrong: s.wrong + 1 };
    return { state: settle(q, next), correct: ok };
  }
  if (q.format !== 'click' && q.format !== 'map-click') return { state: s, correct: false };
  const cur = currentItem(q, s);
  if (cur === null) return { state: s, correct: false };
  if (index !== cur) return { state: { ...s, wrong: s.wrong + 1 }, correct: false };
  const found = s.found.map((f, i) => f || i === cur);
  return { state: settle(q, { ...s, found, cursor: s.order.indexOf(cur) + 1 }), correct: true };
}

/** Clicks a country by code on a map-click quiz. */
export function clickCountry(q: Quiz, s: QuizState, iso2: string) {
  const index = q.items.findIndex((it) => it.iso2 === iso2);
  if (index < 0) return { state: { ...s, wrong: s.wrong + 1 }, correct: false };
  return click(q, s, index);
}

/** Skips the current slide or prompt (it comes back after the others). */
export function skip(q: Quiz, s: QuizState): QuizState {
  const cur = currentItem(q, s);
  if (cur === null) return s;
  return { ...s, cursor: s.order.indexOf(cur) + 1, skipped: s.skipped + 1 };
}

export function tick(q: Quiz, s: QuizState, ms: number): QuizState {
  if (s.status !== 'playing') return s;
  const elapsedMs = Math.min(q.seconds * 1000, s.elapsedMs + ms);
  return elapsedMs >= q.seconds * 1000
    ? { ...s, elapsedMs, status: 'timeout' }
    : { ...s, elapsedMs };
}

export function giveUp(s: QuizState): QuizState {
  return s.status === 'playing' ? { ...s, status: 'gave-up' } : s;
}

/** Score 0–100: share found, with a small bonus for time left on a full clear. */
export function percent(q: Quiz, s: QuizState): number {
  return Math.round((foundCount(q, s) / total(q)) * 100);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isValidAttempt(v: unknown, q: Quiz): v is QuizState {
  return (
    isObj(v) &&
    v.quizId === q.id &&
    (v.lang === 'en' || v.lang === 'es') &&
    Array.isArray(v.found) &&
    v.found.length === q.items.length &&
    Array.isArray(v.order) &&
    typeof v.cursor === 'number' &&
    typeof v.wrong === 'number' &&
    typeof v.elapsedMs === 'number' &&
    typeof v.seed === 'number' &&
    ['playing', 'won', 'gave-up', 'timeout'].includes(v.status as string)
  );
}
