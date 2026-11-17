import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'word-warmth',
  number: 207,
  title: { en: 'Word Warmth', es: 'Calor de palabras' },
  tagline: {
    en: 'Hot or cold by meaning: chase the similarity score until you hit 1000/1000.',
    es: 'Frío o caliente por significado: persigue la similitud hasta llegar a 1000/1000.',
  },
  description: {
    en: 'A daily semantic guessing game: each English guess shows its similarity in meaning to the secret word, and once you are among its thousand nearest words a counter shows exactly how close. The header tells you how similar the nearest, tenth and thousandth words are. Daily puzzles, random words, give up to see the nearest words, and a hill-climbing AI to watch.',
    es: 'Un juego semántico diario: cada intento en inglés muestra su similitud de significado con la palabra secreta y, cuando entras entre sus mil palabras más cercanas, un contador dice exactamente lo cerca que estás. La cabecera indica la similitud de la más cercana, la décima y la milésima. Retos diarios, palabras al azar, ríndete para ver las más cercanas y una IA escaladora para mirar.',
  },
  category: 'viral',
  genre: { en: 'Word / semantics', es: 'Palabras / semántica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['semantle', 'semantic', 'similarity', 'words', 'daily', 'hot cold'],
  achievements: [
    {
      id: 'warming-up',
      title: { en: 'Warming Up', es: 'Entrando en calor' },
      description: {
        en: 'Reach the thousand nearest words.',
        es: 'Entra entre las mil palabras más cercanas.',
      },
    },
    {
      id: 'first-solve',
      title: { en: 'Found the Heat', es: 'Encontraste el calor' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un reto.' },
    },
    {
      id: 'quick',
      title: { en: 'Heat Seeker', es: 'Buscacalor' },
      description: { en: 'Solve in 25 guesses or fewer.', es: 'Resuelve en 25 intentos o menos.' },
    },
    {
      id: 'psychic',
      title: { en: 'Psychic', es: 'Vidente' },
      description: { en: 'Solve in 10 guesses or fewer.', es: 'Resuelve en 10 intentos o menos.' },
    },
    {
      id: 'week',
      title: { en: 'Warm Week', es: 'Semana cálida' },
      description: { en: 'Solve seven daily puzzles.', es: 'Resuelve siete retos diarios.' },
    },
  ],
};
