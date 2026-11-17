/**
 * Pure rules for #207 Word Warmth (ruleset `word-warmth-30k`): find the secret word from how
 * similar in meaning each guess is. A guess shows its similarity × 100 (cosine of word vectors)
 * and, when it is among the secret's 1,000 nearest words, its place in that list ("742/1000").
 */
import { Rng } from '../../core/game-engine/random';
import { lookup, similaritiesTo, type Vectors } from '../shared/semantic/semantic';
import { SECRETS } from './secrets';

export const NEAREST = 1000;
export const MAX_GUESSES = 500;
export const EPOCH = Date.UTC(2026, 0, 1);

export interface WarmGuess {
  word: number;
  /** Similarity × 100, two decimals. */
  score: number;
  /** 1000 = nearest word, 1 = thousandth; null when not among the nearest thousand. */
  near: number | null;
  n: number;
}

export interface WarmState {
  secret: string;
  gameNo: number | null;
  guesses: WarmGuess[];
  status: 'playing' | 'won' | 'gave-up';
  limit: number;
}

export interface SecretInfo {
  sims: Float32Array;
  /** Word index → place among the nearest 1000 (1000 = nearest), absent otherwise. */
  near: Map<number, number>;
  /** Similarities × 100 of the nearest, tenth nearest and thousandth nearest words. */
  top1: number;
  top10: number;
  top1000: number;
  nearestList: number[];
}

const cache = new Map<string, SecretInfo>();
const round2 = (x: number) => Math.round(x * 10000) / 100;

export function secretInfo(v: Vectors, secret: string): SecretInfo {
  let info = cache.get(secret);
  if (info) return info;
  const target = v.index.get(secret)!;
  const sims = similaritiesTo(v, target);
  const order = Array.from({ length: v.words.length }, (_, i) => i)
    .filter((i) => i !== target)
    .sort((a, b) => sims[b]! - sims[a]!)
    .slice(0, NEAREST);
  const near = new Map(order.map((w, i) => [w, NEAREST - i]));
  info = {
    sims,
    near,
    top1: round2(sims[order[0]!]!),
    top10: round2(sims[order[9]!]!),
    top1000: round2(sims[order[NEAREST - 1]!]!),
    nearestList: order,
  };
  cache.set(secret, info);
  return info;
}

export function dailySecret(gameNo: number): string {
  const order = new Rng(20260707).shuffle(SECRETS);
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
): WarmState {
  return { secret, gameNo, guesses: [], status: 'playing', limit };
}

export function randomGame(seed: number, limit = MAX_GUESSES): WarmState {
  return newGame(new Rng(seed >>> 0).pick(SECRETS), null, limit);
}

export function check(
  v: Vectors,
  s: WarmState,
  text: string,
): { word: number | null; rejection: 'unknown' | 'repeat' | null } {
  const word = lookup(v, text);
  if (word === null) return { word: null, rejection: 'unknown' };
  if (s.guesses.some((g) => g.word === word)) return { word, rejection: 'repeat' };
  return { word, rejection: null };
}

export function guess(v: Vectors, s: WarmState, word: number): WarmState {
  if (s.status !== 'playing' || s.guesses.some((g) => g.word === word)) return s;
  const info = secretInfo(v, s.secret);
  const won = v.words[word] === s.secret;
  const g: WarmGuess = {
    word,
    score: won ? 100 : round2(info.sims[word]!),
    near: won ? NEAREST : (info.near.get(word) ?? null),
    n: s.guesses.length + 1,
  };
  const guesses = [...s.guesses, g];
  return { ...s, guesses, status: won ? 'won' : guesses.length >= s.limit ? 'gave-up' : 'playing' };
}

export function giveUp(s: WarmState): WarmState {
  return s.status === 'playing' ? { ...s, status: 'gave-up' } : s;
}

/** Temperature label for a guess, as shown next to its score. */
export function temperature(g: WarmGuess): 'found' | 'hot' | 'warm' | 'tepid' | 'cold' {
  if (g.near === NEAREST && g.score === 100) return 'found';
  if (g.near !== null && g.near >= 900) return 'hot';
  if (g.near !== null) return 'warm';
  return g.score >= 20 ? 'tepid' : 'cold';
}

export function isValidState(v: unknown): v is WarmState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as WarmState;
  return (
    typeof s.secret === 'string' &&
    SECRETS.includes(s.secret) &&
    Array.isArray(s.guesses) &&
    s.guesses.every((g) => typeof g.word === 'number' && typeof g.score === 'number') &&
    typeof s.limit === 'number' &&
    ['playing', 'won', 'gave-up'].includes(s.status)
  );
}
