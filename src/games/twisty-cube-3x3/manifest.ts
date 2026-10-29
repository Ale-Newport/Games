import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'twisty-cube-3x3',
  number: 135,
  title: { en: 'Twisty Cube 3×3', es: 'Cubo giratorio 3×3' },
  tagline: {
    en: 'The classic 3×3 twisty cube in 3D, with a two-phase solver for hints.',
    es: 'El clásico cubo giratorio 3×3 en 3D, con un solucionador en dos fases para las pistas.',
  },
  description: {
    en: 'The 3×3 twisty cube in 3D: turn the faces with buttons or keys, drag to look around, and start from a light scramble or a full one. Hints and the watch mode come from a two-phase solver that finds solutions of about 21 turns in a few hundredths of a second, and about as short as the scramble for light ones.',
    es: 'El cubo giratorio 3×3 en 3D: gira las caras con botones o teclas, arrástralo para mirarlo y empieza desde una mezcla ligera o completa. Las pistas y el modo de ver vienen de un solucionador en dos fases que encuentra soluciones de unos 21 giros en unas centésimas de segundo, y casi tan cortas como la mezcla en las ligeras.',
  },
  category: 'puzzle',
  genre: { en: 'Twisty puzzle', es: 'Puzle giratorio' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 10,
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
      title: { en: 'Five-Minute Cube', es: 'Cubo en cinco minutos' },
      description: {
        en: 'Solve a full 3×3 scramble in under five minutes without hints.',
        es: 'Resuelve una mezcla completa del 3×3 en menos de cinco minutos sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Twist', es: 'Giro diario' },
      description: { en: "Solve today's scramble.", es: 'Resuelve la mezcla del día.' },
    },
  ],
};
