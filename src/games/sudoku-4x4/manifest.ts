import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sudoku-4x4',
  number: 102,
  title: { en: 'Mini Sudoku 4×4', es: 'Minisudoku 4×4' },
  tagline: {
    en: 'A first sudoku: 4×4 grids with the digits 1 to 4, hints that explain, and three levels.',
    es: 'Un primer sudoku: cuadrículas de 4×4 con los números del 1 al 4, pistas que explican y tres niveles.',
  },
  description: {
    en: 'The sudoku rules on a small 4×4 grid with 2×2 boxes — ideal to learn. Puzzles are generated with a unique solution, from 8 clues down to the minimum of 4. Notes, undo, a daily puzzle, hints that explain each step and an AI that solves while you watch.',
    es: 'Las reglas del sudoku en una cuadrícula pequeña de 4×4 con regiones de 2×2: ideal para aprender. Los sudokus se generan con solución única, de 8 pistas hasta el mínimo de 4. Notas, deshacer, sudoku del día, pistas que explican cada paso y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle', es: 'Puzle de lógica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['sudoku', 'logic', 'numbers', 'kids', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Solved', es: 'Resuelto' },
      description: { en: 'Solve a mini sudoku.', es: 'Resuelve un minisudoku.' },
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
        en: 'Solve a Hard mini sudoku in under a minute without hints.',
        es: 'Resuelve un minisudoku difícil en menos de un minuto sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Four Clues', es: 'Cuatro pistas' },
      description: { en: 'Solve a Hard mini sudoku.', es: 'Resuelve un minisudoku difícil.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
