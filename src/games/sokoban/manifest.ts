import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sokoban',
  number: 127,
  title: { en: 'Sokoban', es: 'Sokoban' },
  tagline: {
    en: 'Push every crate onto a goal in generated warehouses, with the fewest pushes shown.',
    es: 'Empuja cada caja hasta una meta en almacenes generados, con el mínimo de empujes a la vista.',
  },
  description: {
    en: 'The warehouse-keeper puzzle with original levels from the game’s own generator, in three tiers. Tap to walk, swipe or use the keys to push, undo and restart freely, see crates that can no longer reach a goal, take hints from a solver that knows the fewest pushes, and track the levels you have cleared.',
    es: 'El puzle del mozo de almacén con niveles originales del propio generador del juego, en tres grupos. Toca para andar, desliza o usa las teclas para empujar, deshaz y reinicia cuando quieras, ve las cajas que ya no pueden llegar a una meta, pide pistas a un solucionador que conoce el mínimo de empujes y sigue tu progreso por niveles.',
  },
  category: 'puzzle',
  genre: { en: 'Pushing blocks', es: 'Empujar bloques' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pushes', es: 'Empujes' }, lowerIsBetter: true },
  tags: ['sokoban', 'boxes', 'logic', 'levels', 'classic'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Stocked', es: 'Almacenado' },
      description: { en: 'Solve a warehouse.', es: 'Resuelve un almacén.' },
    },
    {
      id: 'optimal',
      title: { en: 'Not a Push Wasted', es: 'Ni un empuje de más' },
      description: {
        en: 'Solve a warehouse in the fewest pushes, without hints.',
        es: 'Resuelve un almacén con el mínimo de empujes, sin pistas.',
      },
    },
    {
      id: 'ten',
      title: { en: 'Warehouse Hand', es: 'Mozo de almacén' },
      description: { en: 'Solve ten easy warehouses.', es: 'Resuelve diez almacenes fáciles.' },
    },
    {
      id: 'hard',
      title: { en: 'Heavy Lifting', es: 'Carga pesada' },
      description: {
        en: 'Solve a hard warehouse without hints.',
        es: 'Resuelve un almacén difícil sin pistas.',
      },
    },
    {
      id: 'all-tiers',
      title: { en: 'Every Floor', es: 'Todas las plantas' },
      description: {
        en: 'Solve a warehouse in every tier.',
        es: 'Resuelve un almacén de cada grupo.',
      },
    },
  ],
};
