import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'calcudoku',
  number: 109,
  title: { en: 'Calcudoku', es: 'Calcudoku' },
  tagline: {
    en: 'Arithmetic cages on a Latin square, from 4×4 to 7×7: + − × ÷, unique solutions, hints that teach.',
    es: 'Jaulas de cuentas sobre un cuadrado latino, de 4×4 a 7×7: + − × ÷, solución única y pistas que enseñan.',
  },
  description: {
    en: 'An original take on the arithmetic-cage puzzle: no digit repeats in a row or column, and every cage must reach its target with its operation. Puzzles are generated with a unique solution and checked to be solvable by reasoning; hints explain the cage arithmetic. Notes, undo, a daily puzzle and an AI that solves while you watch.',
    es: 'Una versión original del puzle de jaulas aritméticas: ningún número se repite en fila ni columna, y cada jaula debe alcanzar su resultado con su operación. Los puzles se generan con solución única y se comprueba que se resuelven razonando; las pistas explican las cuentas de cada jaula. Notas, deshacer, puzle del día y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (arithmetic)', es: 'Puzle de lógica (cuentas)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['calcudoku', 'arithmetic', 'latin square', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Do the Math', es: 'Echa cuentas' },
      description: { en: 'Solve a calcudoku.', es: 'Resuelve un calcudoku.' },
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
        en: 'Solve a 6×6 calcudoku in under 10 minutes without hints.',
        es: 'Resuelve un calcudoku de 6×6 en menos de 10 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Seven Up', es: 'Siete por siete' },
      description: { en: 'Solve a 7×7 calcudoku.', es: 'Resuelve un calcudoku de 7×7.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
