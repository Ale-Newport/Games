import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sudoku-6x6',
  number: 103,
  title: { en: 'Sudoku 6×6', es: 'Sudoku 6×6' },
  tagline: {
    en: 'Quick sudoku on a 6×6 grid with 2×3 boxes: three graded levels and hints that teach.',
    es: 'Sudoku rápido en una cuadrícula de 6×6 con regiones de 2×3: tres niveles graduados y pistas que enseñan.',
  },
  description: {
    en: 'The sudoku rules on a 6×6 grid with rectangular 2×3 boxes — a short game that still asks for real techniques at Hard (locked candidates, pairs, X-Wing, Y-Wing). Puzzles are generated with a unique solution. Notes, undo, a daily puzzle, explained hints and an AI that solves while you watch.',
    es: 'Las reglas del sudoku en una cuadrícula de 6×6 con regiones rectangulares de 2×3: una partida corta que en Difícil exige técnicas de verdad (candidatos bloqueados, pares, X-Wing, Y-Wing). Los sudokus se generan con solución única. Notas, deshacer, sudoku del día, pistas explicadas y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle', es: 'Puzle de lógica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 6,
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
      description: { en: 'Solve a 6×6 sudoku.', es: 'Resuelve un sudoku 6×6.' },
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
        en: 'Solve a Medium 6×6 sudoku in under 3 minutes without hints.',
        es: 'Resuelve un sudoku 6×6 medio en menos de 3 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Six Appeal', es: 'Seis de seis' },
      description: { en: 'Solve a Hard 6×6 sudoku.', es: 'Resuelve un sudoku 6×6 difícil.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
