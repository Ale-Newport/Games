import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'killer-sudoku',
  number: 106,
  title: { en: 'Killer Sudoku', es: 'Sudoku asesino' },
  tagline: {
    en: 'Sudoku with sums instead of givens: cages, combinations and the 45 rule, with hints that teach.',
    es: 'Sudoku con sumas en lugar de pistas: jaulas, combinaciones y la regla del 45, con pistas que enseñan.',
  },
  description: {
    en: 'A sudoku with no given digits: dashed cages show the sum of their cells, and digits never repeat inside a cage. Puzzles are generated with a unique solution and checked to be solvable by reasoning — cage combinations, the 45 rule and the classic techniques — and the hints explain those steps. Notes, undo, a daily puzzle and an AI that solves while you watch.',
    es: 'Un sudoku sin números de partida: las jaulas punteadas muestran la suma de sus casillas, y dentro de una jaula no se repite ningún número. Los sudokus se generan con solución única y se comprueba que se resuelven razonando (combinaciones de jaula, la regla del 45 y las técnicas clásicas), y las pistas explican esos pasos. Notas, deshacer, sudoku del día y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (sums)', es: 'Puzle de lógica (sumas)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['sudoku', 'killer', 'sums', 'cages', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Solved', es: 'Resuelto' },
      description: { en: 'Solve a killer sudoku.', es: 'Resuelve un sudoku asesino.' },
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
        en: 'Solve a Medium killer sudoku in under 15 minutes without hints.',
        es: 'Resuelve un sudoku asesino medio en menos de 15 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Assassin', es: 'Asesino' },
      description: { en: 'Solve a Hard killer sudoku.', es: 'Resuelve un sudoku asesino difícil.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
