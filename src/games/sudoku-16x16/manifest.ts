import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sudoku-16x16',
  number: 104,
  title: { en: 'Sudoku 16×16', es: 'Sudoku 16×16' },
  tagline: {
    en: 'A marathon sudoku: 256 cells, sixteen symbols, 4×4 boxes, three graded levels.',
    es: 'Un sudoku maratón: 256 casillas, dieciséis símbolos, regiones de 4×4 y tres niveles graduados.',
  },
  description: {
    en: 'Sudoku on a 16×16 grid with 4×4 boxes and the symbols 1–9 and A–G. Puzzles are generated with a unique solution and graded by technique. Notes, undo, a daily puzzle, explained hints and an AI that solves while you watch — and your progress is saved, so a long puzzle can take several sittings.',
    es: 'Sudoku en una cuadrícula de 16×16 con regiones de 4×4 y los símbolos 1–9 y A–G. Los sudokus se generan con solución única y se gradúan por técnica. Notas, deshacer, sudoku del día, pistas explicadas y una IA que resuelve mientras miras; el progreso se guarda, así que un sudoku largo puede llevar varias sesiones.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle', es: 'Puzle de lógica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 45,
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
      description: { en: 'Solve a 16×16 sudoku.', es: 'Resuelve un sudoku 16×16.' },
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
        en: 'Solve an Easy 16×16 sudoku in under 30 minutes without hints.',
        es: 'Resuelve un sudoku 16×16 fácil en menos de 30 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Marathon', es: 'Maratón' },
      description: { en: 'Solve a Hard 16×16 sudoku.', es: 'Resuelve un sudoku 16×16 difícil.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el sudoku del día.' },
    },
  ],
};
