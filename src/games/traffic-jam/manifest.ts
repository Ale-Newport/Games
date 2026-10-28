import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'traffic-jam',
  number: 126,
  title: { en: 'Traffic Jam', es: 'Atasco' },
  tagline: {
    en: 'Slide cars and trucks along their lanes to free the red car — with the fewest moves shown.',
    es: 'Desliza coches y camiones por sus carriles para liberar el coche rojo, con el mínimo de movimientos a la vista.',
  },
  description: {
    en: 'A sliding-block parking puzzle with original puzzles from the game’s own generator, each with its fewest-move solution. Drag vehicles along their lanes, play with the keyboard, undo, take hints that name the vehicle and the slide, try the daily puzzle, or watch the breadth-first solver.',
    es: 'Un puzle de bloques deslizantes en un aparcamiento, con puzles originales del propio generador del juego, cada uno con su solución de menos movimientos. Arrastra los vehículos por sus carriles, juega con el teclado, deshaz, pide pistas que nombran el vehículo y el deslizamiento, prueba el puzle del día o mira el solucionador en anchura.',
  },
  category: 'puzzle',
  genre: { en: 'Sliding blocks', es: 'Bloques deslizantes' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Moves', es: 'Movimientos' }, lowerIsBetter: true },
  tags: ['sliding', 'blocks', 'cars', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Way Out', es: 'Salida' },
      description: { en: 'Free the red car.', es: 'Libera el coche rojo.' },
    },
    {
      id: 'optimal',
      title: { en: 'Shortest Route', es: 'Ruta más corta' },
      description: {
        en: 'Free it in the fewest moves possible, without hints.',
        es: 'Libéralo con el mínimo de movimientos posible, sin pistas.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Gridlock Breaker', es: 'Rompeatascos' },
      description: {
        en: 'Solve a hard puzzle without hints.',
        es: 'Resuelve un puzle difícil sin pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Green Light', es: 'Luz verde' },
      description: {
        en: 'Solve a medium puzzle in under a minute without hints.',
        es: 'Resuelve un puzle medio en menos de un minuto sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Commute', es: 'Trayecto diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
