import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'country-shape',
  number: 209,
  title: { en: 'Country Shape', es: 'Silueta de país' },
  tagline: {
    en: 'Name the country from its outline in six guesses, guided by distance and direction.',
    es: 'Nombra el país por su contorno en seis intentos, guiado por distancia y dirección.',
  },
  description: {
    en: 'The daily geography guessing game: a country’s silhouette, six guesses, and for each miss the distance, a compass arrow and a proximity score. Then two bonus questions — the capital and the flag. Real Natural Earth outlines, every country in English or Spanish with suggestions as you type, km or miles, daily and practice shapes, and an AI that triangulates from the clues.',
    es: 'El juego diario de adivinar países: la silueta de un país, seis intentos y, por cada fallo, la distancia, una flecha y una proximidad. Después, dos preguntas extra: la capital y la bandera. Contornos reales de Natural Earth, todos los países en inglés o español con sugerencias al escribir, km o millas, siluetas diarias y de práctica, y una IA que triangula con las pistas.',
  },
  category: 'viral',
  genre: { en: 'Geography', es: 'Geografía' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['worldle', 'geography', 'country', 'silhouette', 'daily', 'map', 'spanish'],
  achievements: [
    {
      id: 'first-shape',
      title: { en: 'Map Reader', es: 'Lector de mapas' },
      description: { en: 'Name a country.', es: 'Acierta un país.' },
    },
    {
      id: 'first-try',
      title: { en: 'At First Sight', es: 'A la primera' },
      description: {
        en: 'Name a country on the first guess.',
        es: 'Acierta un país al primer intento.',
      },
    },
    {
      id: 'three-stars',
      title: { en: 'Three Stars', es: 'Tres estrellas' },
      description: {
        en: 'Get the country, its capital and its flag.',
        es: 'Acierta el país, la capital y la bandera.',
      },
    },
    {
      id: 'week',
      title: { en: 'World Tour', es: 'Vuelta al mundo' },
      description: { en: 'Solve seven daily shapes.', es: 'Acierta siete siluetas diarias.' },
    },
  ],
};
