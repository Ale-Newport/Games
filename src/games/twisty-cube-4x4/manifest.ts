import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'twisty-cube-4x4',
  number: 136,
  title: { en: 'Twisty Cube 4×4', es: 'Cubo giratorio 4×4' },
  tagline: {
    en: 'The 4×4 twisty cube in 3D, with wide turns for its inner layers.',
    es: 'El cubo giratorio 4×4 en 3D, con giros dobles para sus capas interiores.',
  },
  description: {
    en: 'The 4×4 twisty cube in 3D: outer and wide turns with buttons or keys, drag to look around, light or full scrambles. Hints undo the scramble and your turns, so they always lead home, though not by the shortest way.',
    es: 'El cubo giratorio 4×4 en 3D: giros exteriores y dobles con botones o teclas, arrástralo para mirarlo, mezclas ligeras o completas. Las pistas deshacen la mezcla y tus giros, así que siempre llevan a la solución, aunque no por el camino más corto.',
  },
  category: 'puzzle',
  genre: { en: 'Twisty puzzle', es: 'Puzle giratorio' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 4,
  sessionMinutes: 20,
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
      title: { en: 'Big Cube Sprint', es: 'Sprint del cubo grande' },
      description: {
        en: 'Solve a full 4×4 scramble in under fifteen minutes without hints.',
        es: 'Resuelve una mezcla completa del 4×4 en menos de quince minutos sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Twist', es: 'Giro diario' },
      description: { en: "Solve today's scramble.", es: 'Resuelve la mezcla del día.' },
    },
  ],
};
