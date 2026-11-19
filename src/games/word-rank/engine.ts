/**
 * Pure rules for #206 Word Rank (ruleset `word-rank-30k`): find the secret word. Every guess is
 * ranked against all 30,000 words of the vocabulary by meaning (vector similarity to the secret):
 * the secret is #1, its closest word #2, and so on. Hints reveal a word halfway to the secret.
 * Games are in English or Spanish (`lang`), each with its own vocabulary and secret list.
 */
import { Rng } from '../../core/game-engine/random';
import { lookup, rankAll, type SemanticLang, type Vectors } from '../shared/semantic/semantic';
import { secretsFor } from './secrets';

export const MAX_GUESSES = 500;
/** Day 0 of the daily game numbering. */
export const EPOCH = Date.UTC(2026, 0, 1);

export interface Guess {
  word: number;
  rank: number;
  hint: boolean;
}

export interface RankState {
  secret: string;
  /** Daily game number, or null for a random game. */
  gameNo: number | null;
  guesses: Guess[];
  hints: number;
  status: 'playing' | 'won' | 'gave-up';
  /** Guess limit (500 in play; smaller for AI episodes). */
  limit: number;
  /** Vocabulary language; saves from before Spanish existed have none and are English. */
  lang?: SemanticLang;
}

export const langOf = (s: RankState): SemanticLang => s.lang ?? 'en';

export type Rejection = 'unknown' | 'repeat' | null;

const rankCache = new Map<string, Int32Array>();

export function ranksFor(v: Vectors, secret: string): Int32Array {
  const key = `${v.lang}:${secret}`;
  let r = rankCache.get(key);
  if (!r) {
    r = rankAll(v, v.index.get(secret)!);
    rankCache.set(key, r);
  }
  return r;
}

/** The daily secret: a fixed shuffle of the list, one word per day since the epoch. */
export function dailySecret(gameNo: number, lang: SemanticLang = 'en'): string {
  const order = new Rng(lang === 'es' ? 20260102 : 20260101).shuffle(secretsFor(lang));
  return order[((gameNo % order.length) + order.length) % order.length]!;
}

export function gameNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}

export function newGame(
  secret: string,
  gameNo: number | null = null,
  limit = MAX_GUESSES,
  lang: SemanticLang = 'en',
): RankState {
  return { secret, gameNo, guesses: [], hints: 0, status: 'playing', limit, lang };
}

export function randomGame(
  seed: number,
  limit = MAX_GUESSES,
  lang: SemanticLang = 'en',
): RankState {
  return newGame(new Rng(seed >>> 0).pick(secretsFor(lang)), null, limit, lang);
}

export function check(
  v: Vectors,
  s: RankState,
  text: string,
): { word: number | null; rejection: Rejection } {
  const word = lookup(v, text);
  if (word === null) return { word: null, rejection: 'unknown' };
  if (s.guesses.some((g) => g.word === word)) return { word, rejection: 'repeat' };
  return { word, rejection: null };
}

function add(v: Vectors, s: RankState, word: number, hint: boolean): RankState {
  const rank = ranksFor(v, s.secret)[word]!;
  const guesses = [...s.guesses, { word, rank, hint }];
  const status = rank === 1 ? 'won' : guesses.length >= s.limit ? 'gave-up' : 'playing';
  return { ...s, guesses, hints: s.hints + (hint ? 1 : 0), status };
}

export function guess(v: Vectors, s: RankState, word: number): RankState {
  if (s.status !== 'playing') return s;
  if (s.guesses.some((g) => g.word === word)) return s;
  return add(v, s, word, false);
}

export const bestRank = (s: RankState) => Math.min(Infinity, ...s.guesses.map((g) => g.rank));

/**
 * A hint is the unguessed word at half the best rank so far (rank 300 with no guesses yet); when
 * the best is already 2, the hint is the secret's runner-up neighbour still unguessed, never the
 * secret itself.
 */
export function hintWord(v: Vectors, s: RankState): number | null {
  if (s.status !== 'playing') return null;
  const ranks = ranksFor(v, s.secret);
  const best = bestRank(s);
  let target = best === Infinity ? 300 : Math.max(2, Math.floor(best / 2));
  const guessed = new Set(s.guesses.map((g) => g.word));
  const byRank = new Int32Array(ranks.length + 1);
  ranks.forEach((r, w) => (byRank[r] = w));
  for (; target < ranks.length; target++) {
    const w = byRank[target]!;
    if (!guessed.has(w)) return w;
  }
  return null;
}

export function takeHint(v: Vectors, s: RankState): RankState {
  const w = hintWord(v, s);
  return w === null ? s : add(v, s, w, true);
}

export function giveUp(s: RankState): RankState {
  return s.status === 'playing' ? { ...s, status: 'gave-up' } : s;
}

/** The n closest words to the secret (rank 1 first). */
export function closest(v: Vectors, s: RankState, n: number): number[] {
  const ranks = ranksFor(v, s.secret);
  const out: number[] = new Array<number>(n);
  ranks.forEach((r, w) => {
    if (r <= n) out[r - 1] = w;
  });
  return out;
}

/** Colour band of a rank, as on the original: close, warm, far. */
export function band(rank: number): 'close' | 'warm' | 'far' {
  return rank <= 300 ? 'close' : rank <= 1500 ? 'warm' : 'far';
}

export function isValidState(v: unknown): v is RankState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as RankState;
  if (s.lang !== undefined && s.lang !== 'en' && s.lang !== 'es') return false;
  return (
    typeof s.secret === 'string' &&
    secretsFor(langOf(s)).includes(s.secret) &&
    (s.gameNo === null || typeof s.gameNo === 'number') &&
    Array.isArray(s.guesses) &&
    s.guesses.every((g) => typeof g.word === 'number' && typeof g.rank === 'number') &&
    typeof s.hints === 'number' &&
    typeof s.limit === 'number' &&
    ['playing', 'won', 'gave-up'].includes(s.status)
  );
}
