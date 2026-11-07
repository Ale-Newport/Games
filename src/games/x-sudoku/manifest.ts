import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'x-sudoku',
  number: 105,
  title: { en: 'X-Sudoku', es: 'Sudoku X' },
  tagline: {
    en: 'Sudoku where both diagonals count too — four graded levels and hints that teach.',
    es: 'Sudoku en el que también cuentan las dos diagonales: cuatro niveles graduados y pistas que enseñan.',
  },
  description: {
    en: 'Classic 9×9 sudoku with an extra rule: the two main diagonals must also hold 1 to 9 once. Puzzles are generated with a unique solution and graded by technique, and the hints reason with the diagonals too. Notes, undo, a daily puzzle and an AI that solves while you watch.',
    es: 'Sudoku clásico de 9×9 con una regla más: las dos diagonales principales también deben tener del 1 al 9 una vez. Los sudokus se generan con solución única y se gradúan por técnica, y las pistas también razonan con las diagonales. Notas, deshacer, sudoku del día y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (variant)', es: 'Puzle de lógica (variante)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['sudoku', 'x-sudoku', 'diagonal', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Solved', es: 'Resuelto' },
      description: { en: 'Solve an X-Sudoku.', es: 'Resuelve un sudoku X.' },
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
        en: 'Solve a Medium X-Sudoku in under 10 minutes without hints.',
        es: 'Resuelve un sudoku X medio en menos de 10 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Crossed Out', es: 'Tachado' },
      description: { en: 'Solve an Expert X-Sudoku.', es: 'Resuelve un sudoku X experto.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
