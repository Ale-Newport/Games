import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'twisty-cube-2x2',
  number: 134,
  title: { en: 'Twisty Cube 2×2', es: 'Cubo giratorio 2×2' },
  tagline: {
    en: 'The 2×2 pocket cube: eight corners to sort, with a solver that always knows the shortest way.',
    es: 'El cubo de bolsillo 2×2: ocho esquinas que ordenar, con un solucionador que siempre conoce el camino más corto.',
  },
  description: {
    en: 'The 2×2 twisty cube in 3D: turn the faces with buttons or keys, drag to look around, and solve from a light scramble or a full one. Hints come from an optimal solver, so they always show the shortest way.',
    es: 'El cubo giratorio 2×2 en 3D: gira las caras con botones o teclas, arrástralo para mirarlo y resuélvelo desde una mezcla ligera o completa. Las pistas salen de un solucionador óptimo, así que siempre muestran el camino más corto.',
  },
  category: 'puzzle',
  genre: { en: 'Twisty puzzle', es: 'Puzle giratorio' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['cube', 'twisty', '3d', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Six Faces', es: 'Seis caras' },
      description: { en: 'Solve a scramble.', es: 'Resuelve una mezcla.' },
    },
    {
      id: 'own',
      title: { en: 'On My Own', es: 'Por mi cuenta' },
      description: {
        en: 'Solve a full scramble without hints.',
        es: 'Resuelve una mezcla completa sin pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Quick Corners', es: 'Esquinas rápidas' },
      description: {
        en: 'Solve a full 2×2 scramble in under a minute without hints.',
        es: 'Resuelve una mezcla completa del 2×2 en menos de un minuto sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Twist', es: 'Giro diario' },
      description: { en: "Solve today's scramble.", es: 'Resuelve la mezcla del día.' },
    },
  ],
};
