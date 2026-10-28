import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'eight-puzzle',
  number: 124,
  title: { en: '8-Puzzle', es: 'Puzle de 8' },
  tagline: {
    en: 'The classic 3×3 sliding puzzle, with the shortest solution always known.',
    es: 'El clásico puzle deslizante de 3×3, con la solución más corta siempre conocida.',
  },
  description: {
    en: 'Slide eight wooden tiles into order around one gap. Easy, medium and fully random scrambles, number or picture tiles, a counter against the best possible move count, undo, hints from an optimal IDA* solver, a daily puzzle, and the solver to watch.',
    es: 'Desliza ocho fichas de madera hasta ordenarlas alrededor de un hueco. Mezclas fácil, media y totalmente aleatoria, fichas con números o con imagen, un marcador frente al mínimo de movimientos posible, deshacer, pistas de un solucionador IDA* óptimo, puzle del día y el solucionador para verlo jugar.',
  },
  category: 'puzzle',
  genre: { en: 'Sliding', es: 'Deslizante' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Moves', es: 'Movimientos' }, lowerIsBetter: true },
  tags: ['sliding', 'tiles', 'classic', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'In Order', es: 'En orden' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un puzle.' },
    },
    {
      id: 'optimal',
      title: { en: 'Shortest Path', es: 'Camino más corto' },
      description: {
        en: 'Solve a puzzle in the fewest moves possible, without hints.',
        es: 'Resuelve un puzle con el mínimo de movimientos posible, sin pistas.',
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
      title: { en: 'Quick Hands', es: 'Manos rápidas' },
      description: {
        en: 'Solve a random board in under 30 seconds without hints.',
        es: 'Resuelve un tablero aleatorio en menos de 30 segundos sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Slide', es: 'Desliz diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
