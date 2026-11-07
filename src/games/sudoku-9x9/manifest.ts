import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sudoku-9x9',
  number: 101,
  title: { en: 'Classic Sudoku 9×9', es: 'Sudoku clásico 9×9' },
  tagline: {
    en: 'Endless generated puzzles with a unique solution, four graded levels and hints that teach.',
    es: 'Sudokus generados sin fin con solución única, cuatro niveles graduados y pistas que enseñan.',
  },
  description: {
    en: 'Every row, column and box holds 1 to 9 once. Puzzles are generated with a unique solution and graded by the techniques they need, from singles to X-Wing and Swordfish. Pencil marks, undo, a daily puzzle, hints that explain each step, and an AI that solves step by step while you watch.',
    es: 'Cada fila, columna y región tiene del 1 al 9 una vez. Los sudokus se generan con solución única y se gradúan por las técnicas que exigen, de los únicos al X-Wing y el pez espada. Notas, deshacer, sudoku del día, pistas que explican cada paso y una IA que resuelve paso a paso mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle', es: 'Puzle de lógica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['sudoku', 'logic', 'numbers', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Solved', es: 'Resuelto' },
      description: { en: 'Solve a sudoku.', es: 'Resuelve un sudoku.' },
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
        en: 'Solve a Medium sudoku in under 10 minutes without hints.',
        es: 'Resuelve un sudoku medio en menos de 10 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Expert', es: 'Experto' },
      description: { en: 'Solve an Expert sudoku.', es: 'Resuelve un sudoku experto.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
