import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hangman',
  number: 121,
  title: { en: 'Hangman', es: 'Ahorcado' },
  tagline: {
    en: 'Guess the word letter by letter before the drawing is done, in six categories and two languages.',
    es: 'Adivina la palabra letra a letra antes de que se complete el dibujo, en seis categorías y dos idiomas.',
  },
  description: {
    en: 'The classic word game with original word lists: animals, food, nature, home, jobs and sports, in English or Spanish. Three levels, a daily word, a two-player mode where a friend types the secret word, hints that count the words still possible, and a solver you can watch.',
    es: 'El clásico juego de palabras con listas propias: animales, comida, naturaleza, casa, oficios y deportes, en inglés o en español. Tres niveles, palabra del día, modo de dos jugadores en el que un amigo escribe la palabra secreta, pistas que cuentan las palabras aún posibles y un solucionador que puedes ver jugar.',
  },
  category: 'puzzle',
  genre: { en: 'Word', es: 'Palabras' },
  players: { min: 1, max: 2 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Misses', es: 'Fallos' }, lowerIsBetter: true },
  tags: ['words', 'vocabulary', 'classic', 'two-player', 'spanish'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Saved', es: 'Salvado' },
      description: { en: 'Solve a word.', es: 'Resuelve una palabra.' },
    },
    {
      id: 'flawless',
      title: { en: 'Clean Sheet', es: 'Hoja en blanco' },
      description: {
        en: 'Solve a word without a wrong letter or a hint.',
        es: 'Resuelve una palabra sin fallar ninguna letra ni pedir pistas.',
      },
    },
    {
      id: 'hard',
      title: { en: 'In the Dark', es: 'A ciegas' },
      description: {
        en: 'Solve a word on Hard without hints.',
        es: 'Resuelve una palabra en Difícil sin pistas.',
      },
    },
    {
      id: 'close',
      title: { en: 'Close Call', es: 'Por los pelos' },
      description: {
        en: 'Solve a word with one life left.',
        es: 'Resuelve una palabra con una sola vida de sobra.',
      },
    },
    {
      id: 'streak',
      title: { en: 'On a Roll', es: 'En racha' },
      description: { en: 'Solve five words in a row.', es: 'Resuelve cinco palabras seguidas.' },
    },
  ],
};
