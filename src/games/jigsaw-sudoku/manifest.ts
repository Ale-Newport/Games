import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'jigsaw-sudoku',
  number: 107,
  title: { en: 'Jigsaw Sudoku', es: 'Sudoku puzle' },
  tagline: {
    en: 'Sudoku with irregular regions — fresh shapes in every puzzle, four graded levels.',
    es: 'Sudoku con regiones irregulares: figuras nuevas en cada sudoku y cuatro niveles graduados.',
  },
  description: {
    en: 'The 3×3 boxes become irregular nine-cell shapes, drawn anew for every puzzle and kept connected. Puzzles are generated with a unique solution and graded by technique; the hints reason with the odd shapes too. Notes, undo, a daily puzzle and an AI that solves while you watch.',
    es: 'Las regiones de 3×3 se convierten en figuras irregulares de nueve casillas, dibujadas de nuevo en cada sudoku y siempre conectadas. Los sudokus se generan con solución única y se gradúan por técnica; las pistas también razonan con las figuras. Notas, deshacer, sudoku del día y una IA que resuelve mientras miras.',
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
  tags: ['sudoku', 'jigsaw', 'irregular', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Solved', es: 'Resuelto' },
      description: { en: 'Solve a jigsaw sudoku.', es: 'Resuelve un sudoku puzle.' },
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
        en: 'Solve a Medium jigsaw sudoku in under 10 minutes without hints.',
        es: 'Resuelve un sudoku puzle medio en menos de 10 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Odd Shapes', es: 'Formas raras' },
      description: {
        en: 'Solve an Expert jigsaw sudoku.',
        es: 'Resuelve un sudoku puzle experto.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
