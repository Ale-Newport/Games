import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'ball-sort',
  number: 132,
  title: { en: 'Ball Sort', es: 'Ordena las bolas' },
  tagline: {
    en: 'Move balls one at a time between tubes until each tube holds one color.',
    es: 'Mueve bolas de una en una entre tubos hasta que cada tubo tenga un solo color.',
  },
  description: {
    en: 'A ball-sorting puzzle with four to twelve colors and tubes of four or five. Every shuffle is checked by a solver, so it can always be finished; undo and restart freely, take hints for the next move, try the daily puzzle or watch the solver sort it.',
    es: 'Un puzle de ordenar bolas con de cuatro a doce colores y tubos de cuatro o cinco. Cada mezcla se comprueba con un solucionador, así que siempre se puede terminar; deshaz y reinicia cuando quieras, pide pistas para el siguiente movimiento, prueba el puzle del día o mira cómo lo ordena el solucionador.',
  },
  category: 'puzzle',
  genre: { en: 'Sorting', es: 'Ordenar' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Moves', es: 'Movimientos' }, lowerIsBetter: true },
  tags: ['sorting', 'colors', 'balls', 'casual', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Sorted', es: 'Ordenado' },
      description: { en: 'Sort a set of tubes.', es: 'Ordena un juego de tubos.' },
    },
    {
      id: 'clean',
      title: { en: 'Steady Hand', es: 'Pulso firme' },
      description: {
        en: 'Sort without undo or hints.',
        es: 'Ordena sin deshacer ni pedir pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Full Rack', es: 'Estante completo' },
      description: {
        en: 'Sort twelve colors without hints.',
        es: 'Ordena doce colores sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Drop', es: 'Bola diaria' },
      description: { en: "Sort today's puzzle.", es: 'Ordena el puzle del día.' },
    },
  ],
};
