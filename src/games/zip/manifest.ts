import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'zip',
  number: 123,
  title: { en: 'Number Trail', es: 'Sendero numerado' },
  tagline: {
    en: 'One trail through every cell, from 1 through each number in order, around the walls.',
    es: 'Un único sendero por todas las casillas, del 1 por cada número en orden, sorteando muros.',
  },
  description: {
    en: 'A numbered path puzzle with generated grids from 5×5 to 8×8: drag a single trail through every cell, passing the numbers in order and never crossing a wall. Each puzzle has one solution, checked by a pruned search. Drag back to undo, a daily puzzle, and hints that point out forced cells.',
    es: 'Un puzle de camino numerado con cuadrículas generadas de 5×5 a 8×8: arrastra un único sendero por todas las casillas, pasando por los números en orden y sin cruzar muros. Cada puzle tiene una sola solución, comprobada con una búsqueda con poda. Vuelve atrás arrastrando, puzle del día y pistas que señalan las casillas forzadas.',
  },
  category: 'puzzle',
  genre: { en: 'Path', es: 'Caminos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['path', 'numbers', 'logic', 'grid', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Trailblazer', es: 'Pionero' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un puzle.' },
    },
    {
      id: 'clean',
      title: { en: 'Own Way', es: 'Por mi cuenta' },
      description: { en: 'Solve a puzzle without hints.', es: 'Resuelve un puzle sin pistas.' },
    },
    {
      id: 'speed',
      title: { en: 'Fast Feet', es: 'Pies ligeros' },
      description: {
        en: 'Solve a 7×7 in under 45 seconds without hints.',
        es: 'Resuelve un 7×7 en menos de 45 segundos sin pistas.',
      },
    },
    {
      id: 'expert',
      title: { en: 'Long Road', es: 'Camino largo' },
      description: {
        en: 'Solve an 8×8 without hints.',
        es: 'Resuelve un 8×8 sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Walk', es: 'Paseo diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
