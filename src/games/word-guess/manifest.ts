import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'word-guess',
  number: 120,
  title: { en: 'Word Guess', es: 'Adivina la palabra' },
  tagline: {
    en: 'Find the five-letter word in six guesses, in English or Spanish, with a daily word and hard mode.',
    es: 'Encuentra la palabra de cinco letras en seis intentos, en inglés o en español, con palabra del día y modo difícil.',
  },
  description: {
    en: 'A five-letter word guessing game with original word lists: each guess marks its letters as right place, elsewhere in the word, or absent. Play English or Spanish words, today’s word or a random one, hard mode where every clue binds, hints that count the words still possible, and a solver that finds words in about three guesses while you watch.',
    es: 'Un juego de adivinar palabras de cinco letras con listas de palabras propias: cada intento marca sus letras en su sitio, en otro sitio o ausentes. Juega con palabras en inglés o en español, la palabra del día o una al azar, modo difícil en el que todas las pistas obligan, pistas que cuentan las palabras aún posibles y un solucionador que encuentra palabras en unos tres intentos mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Word', es: 'Palabras' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['words', 'vocabulary', 'deduction', 'daily', 'spanish'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Wordsmith', es: 'Forjapalabras' },
      description: { en: 'Solve a word.', es: 'Resuelve una palabra.' },
    },
    {
      id: 'three',
      title: { en: 'Sharp Eye', es: 'Ojo fino' },
      description: {
        en: 'Solve a word in three guesses or fewer.',
        es: 'Resuelve una palabra en tres intentos o menos.',
      },
    },
    {
      id: 'hard',
      title: { en: 'No Shortcuts', es: 'Sin atajos' },
      description: {
        en: 'Solve a word in hard mode.',
        es: 'Resuelve una palabra en modo difícil.',
      },
    },
    {
      id: 'bilingual',
      title: { en: 'Bilingual', es: 'Bilingüe' },
      description: {
        en: 'Solve words in both English and Spanish.',
        es: 'Resuelve palabras en inglés y en español.',
      },
    },
    {
      id: 'streak',
      title: { en: 'On a Roll', es: 'En racha' },
      description: { en: 'Solve five words in a row.', es: 'Resuelve cinco palabras seguidas.' },
    },
  ],
};
