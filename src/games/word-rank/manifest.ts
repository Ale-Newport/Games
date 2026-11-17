import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'word-rank',
  number: 206,
  title: { en: 'Word Rank', es: 'Ranking de palabras' },
  tagline: {
    en: 'Every guess gets a rank by meaning. Climb from #9,000 to #1 and find the secret word.',
    es: 'Cada intento recibe un puesto por significado. Sube del n.º 9000 al n.º 1 y encuentra la palabra.',
  },
  description: {
    en: 'A daily word-meaning game: guess any English word and see how close it is in meaning to the secret, as a rank among 30,000 words — #1 is the answer. Hints reveal a word halfway to it; give up to see the closest words. Daily game with past games by number, random words and an AI that climbs by meaning while you watch.',
    es: 'Un juego diario de significados: prueba cualquier palabra inglesa y mira lo cerca que está de la secreta, como un puesto entre 30 000 palabras; la n.º 1 es la respuesta. Las pistas revelan una palabra a mitad de camino; ríndete para ver las más cercanas. Partida diaria con partidas anteriores por número, palabras al azar y una IA que escala por significado mientras miras.',
  },
  category: 'viral',
  genre: { en: 'Word / semantics', es: 'Palabras / semántica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['contexto', 'semantic', 'words', 'daily', 'meaning', 'ranking'],
  achievements: [
    {
      id: 'first-find',
      title: { en: 'Found It', es: 'Encontrada' },
      description: { en: 'Find a secret word.', es: 'Encuentra una palabra secreta.' },
    },
    {
      id: 'no-hints',
      title: { en: 'On My Own', es: 'Por mi cuenta' },
      description: { en: 'Find a word without hints.', es: 'Encuentra una palabra sin pistas.' },
    },
    {
      id: 'quick',
      title: { en: 'Sharp Mind', es: 'Mente aguda' },
      description: {
        en: 'Find a word in 15 guesses or fewer.',
        es: 'Encuentra una palabra en 15 intentos o menos.',
      },
    },
    {
      id: 'telepath',
      title: { en: 'Telepath', es: 'Telépata' },
      description: {
        en: 'Find a word on the first guess.',
        es: 'Encuentra una palabra al primer intento.',
      },
    },
    {
      id: 'week',
      title: { en: 'Seven Days', es: 'Siete días' },
      description: { en: 'Find seven daily words.', es: 'Encuentra siete palabras diarias.' },
    },
  ],
};
