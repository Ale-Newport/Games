import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'flag-reveal',
  number: 211,
  title: { en: 'Flag Reveal', es: 'Bandera oculta' },
  tagline: {
    en: 'Name the flag hidden behind six tiles — every miss lifts one and points the way.',
    es: 'Nombra la bandera oculta tras seis piezas: cada fallo levanta una y señala el camino.',
  },
  description: {
    en: 'The daily flag guessing game: a country’s flag is covered by six tiles. Each wrong guess lifts a tile and shows the distance, a compass arrow and a proximity score. Six guesses, all 196 flags, English or Spanish names with suggestions, km or miles, daily and practice flags, and an AI that triangulates from the clues.',
    es: 'El juego diario de banderas: la bandera de un país está tapada por seis piezas. Cada fallo levanta una y muestra la distancia, una flecha y una proximidad. Seis intentos, las 196 banderas, nombres en inglés o español con sugerencias, km o millas, banderas diarias y de práctica, y una IA que triangula con las pistas.',
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
  tags: ['flagle', 'flags', 'geography', 'daily', 'country', 'spanish'],
  achievements: [
    {
      id: 'first-flag',
      title: { en: 'Flag Spotter', es: 'Observador de banderas' },
      description: { en: 'Name a flag.', es: 'Acierta una bandera.' },
    },
    {
      id: 'blind',
      title: { en: 'Without a Peek', es: 'Sin mirar' },
      description: {
        en: 'Name a flag before any tile is lifted.',
        es: 'Acierta una bandera sin levantar ninguna pieza.',
      },
    },
    {
      id: 'quick',
      title: { en: 'Quick Salute', es: 'Saludo rápido' },
      description: {
        en: 'Name a flag in three guesses or fewer.',
        es: 'Acierta una bandera en tres intentos o menos.',
      },
    },
    {
      id: 'week',
      title: { en: 'Flag Week', es: 'Semana de banderas' },
      description: { en: 'Solve seven daily flags.', es: 'Acierta siete banderas diarias.' },
    },
  ],
};
