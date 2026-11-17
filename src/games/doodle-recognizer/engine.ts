/**
 * Doodle Recognizer rules: six words, twenty seconds each. While you draw, the recognizer (a small
 * neural network trained on real doodles) keeps naming what it sees; the round is won as soon as
 * its top guess is the word. Pure: the drawing itself is input from outside.
 */
import { Rng } from '../../core/game-engine/random';
import type { Guess, Stroke } from '../shared/doodle/doodle';
import { CLASS_NAMES } from '../shared/doodle/words';

export const ROUNDS = 6;
export const SECONDS = 20;
export const WORDS: readonly string[] = Object.keys(CLASS_NAMES);
export type Lang = 'en' | 'es';

export const wordName = (word: string, lang: Lang) => {
  const [en = '', es = ''] = CLASS_NAMES[word]!.split('|');
  return (lang === 'en' ? en : es).split('/')[0]!;
};

export interface Round {
  word: string;
  strokes: Stroke[];
  recognized: boolean;
  /** Milliseconds until it was recognized (or the full time). */
  ms: number;
  /** The recognizer's last guesses. */
  guesses: Guess[];
}

export interface Game {
  seed: number;
  words: string[];
  rounds: Round[];
}

export function newGame(seed: number, pool: readonly string[] = WORDS): Game {
  const words = new Rng(seed >>> 0).shuffle([...pool]).slice(0, ROUNDS);
  return { seed, words, rounds: [] };
}

export const current = (g: Game) => g.words[g.rounds.length] ?? null;
export const over = (g: Game) => g.rounds.length >= ROUNDS;
export const score = (g: Game) => g.rounds.filter((r) => r.recognized).length;

/** Recognized when the top guess is the word. */
export function recognizes(guesses: readonly Guess[], word: string): boolean {
  return guesses[0]?.label === word && guesses[0].p >= 0.15;
}

export function finishRound(g: Game, strokes: Stroke[], guesses: Guess[], ms: number): Game {
  const word = current(g);
  if (!word) return g;
  const recognized = recognizes(guesses, word);
  return {
    ...g,
    rounds: [
      ...g.rounds,
      { word, strokes, recognized, ms: recognized ? ms : SECONDS * 1000, guesses },
    ],
  };
}

/** Skipping (or running out of time) without being recognized. */
export function giveUp(g: Game, strokes: Stroke[], guesses: Guess[]): Game {
  const word = current(g);
  if (!word) return g;
  return {
    ...g,
    rounds: [...g.rounds, { word, strokes, recognized: false, ms: SECONDS * 1000, guesses }],
  };
}
