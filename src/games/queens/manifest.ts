import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'queens',
  number: 122,
  title: { en: 'Royal Regions', es: 'Reinas por regiones' },
  tagline: {
    en: 'One queen per row, column and colored region — and no two queens touching.',
    es: 'Una reina por fila, columna y región de color, y ninguna reina tocando a otra.',
  },
  description: {
    en: 'A colored-regions queens puzzle with generated grids from 6×6 to 10×10, each with a single solution reachable by reasoning. Tap for ✕ then queen, drag to cross, optional automatic crosses, undo and redo, a daily puzzle, and hints that explain the next deduction.',
    es: 'Un puzle de reinas por regiones de color con cuadrículas generadas de 6×6 a 10×10, cada una con una única solución alcanzable razonando. Toca para ✕ y luego reina, arrastra para tachar, ✕ automáticas opcionales, deshacer y rehacer, puzle del día y pistas que explican la siguiente deducción.',
  },
  category: 'puzzle',
  genre: { en: 'Logic', es: 'Lógica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['queens', 'regions', 'logic', 'grid', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Crowned', es: 'Coronado' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un puzle.' },
    },
    {
      id: 'clean',
      title: { en: 'Royal Decree', es: 'Real decreto' },
      description: {
        en: 'Solve a puzzle without mistakes or hints.',
        es: 'Resuelve un puzle sin errores ni pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Swift Court', es: 'Corte veloz' },
      description: {
        en: 'Solve an 8×8 puzzle in under a minute without hints.',
        es: 'Resuelve un 8×8 en menos de un minuto sin pistas.',
      },
    },
    {
      id: 'expert',
      title: { en: 'Grand Realm', es: 'Gran reino' },
      description: { en: 'Solve a 10×10 puzzle.', es: 'Resuelve un puzle de 10×10.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Audience', es: 'Audiencia diaria' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
