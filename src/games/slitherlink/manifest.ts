import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'slitherlink',
  number: 113,
  title: { en: 'Slitherlink', es: 'Slitherlink' },
  tagline: {
    en: 'Draw one loop that agrees with every number: generated grids from 5×5 to 12×12, hints that teach.',
    es: 'Dibuja un lazo que cuadre con todos los números: tableros generados de 5×5 a 12×12 y pistas que enseñan.',
  },
  description: {
    en: 'A single closed loop runs along the dotted grid; each number counts the loop sides around its cell. Grids are generated with exactly one loop, checked to be drawable by reasoning, and the hints explain each step. Drag from dot to dot, undo, a daily puzzle and an AI that draws while you watch.',
    es: 'Un único lazo cerrado recorre la cuadrícula punteada; cada número cuenta los lados del lazo alrededor de su casilla. Los tableros se generan con un único lazo, se comprueba que se dibuja razonando y las pistas explican cada paso. Arrastra de punto a punto, deshacer, puzle del día y una IA que dibuja mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Loop logic', es: 'Lógica de lazos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['slitherlink', 'loop', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Full Circle', es: 'Círculo completo' },
      description: { en: 'Solve a slitherlink.', es: 'Resuelve un slitherlink.' },
    },
    {
      id: 'clean',
      title: { en: 'Clean Sheet', es: 'Hoja limpia' },
      description: {
        en: 'Solve without a mistake or a hint.',
        es: 'Resuelve sin errores ni pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Quick Pencil', es: 'Lápiz rápido' },
      description: {
        en: 'Solve a 10×10 slitherlink in under 5 minutes without hints.',
        es: 'Resuelve un slitherlink de 10×10 en menos de 5 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Long Way Round', es: 'La vuelta larga' },
      description: { en: 'Solve a 12×12 slitherlink.', es: 'Resuelve un slitherlink de 12×12.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
