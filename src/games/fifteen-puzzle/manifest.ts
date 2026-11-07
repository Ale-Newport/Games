import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'fifteen-puzzle',
  number: 125,
  title: { en: '15-Puzzle', es: 'Puzle de 15' },
  tagline: {
    en: 'The classic 4×4 sliding puzzle, with a solver that hints the way.',
    es: 'El clásico puzle deslizante de 4×4, con un solucionador que da pistas.',
  },
  description: {
    en: 'Slide fifteen wooden tiles into order around one gap. Easy and medium scrambles (with the best possible move count when the optimal solver finds it in time) and fully random boards, number or picture tiles, undo, hints from an IDA* / weighted A* solver, a daily puzzle, and the solver to watch.',
    es: 'Desliza quince fichas de madera hasta ordenarlas alrededor de un hueco. Mezclas fácil y media (con el mínimo de movimientos cuando el solucionador óptimo lo encuentra a tiempo) y tableros totalmente aleatorios, fichas con números o con imagen, deshacer, pistas de un solucionador IDA* / A* ponderado, puzle del día y el solucionador para verlo jugar.',
  },
  category: 'puzzle',
  genre: { en: 'Sliding', es: 'Deslizante' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Moves', es: 'Movimientos' }, lowerIsBetter: true },
  tags: ['sliding', 'tiles', 'classic', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Fifteen in Line', es: 'Quince en fila' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un puzle.' },
    },
    {
      id: 'optimal',
      title: { en: 'Not One Wasted', es: 'Ni uno de más' },
      description: {
        en: 'Solve in the fewest moves possible, without hints.',
        es: 'Resuelve con el mínimo de movimientos posible, sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Any Board', es: 'Cualquier tablero' },
      description: {
        en: 'Solve a random board without hints.',
        es: 'Resuelve un tablero aleatorio sin pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Two-Minute Slide', es: 'Desliz de dos minutos' },
      description: {
        en: 'Solve a random board in under two minutes without hints.',
        es: 'Resuelve un tablero aleatorio en menos de dos minutos sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Slide', es: 'Desliz diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
