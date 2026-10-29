import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'threes',
  number: 138,
  title: { en: 'Number Trios', es: 'Tríos numéricos' },
  tagline: {
    en: 'Shift tiles one step at a time: 1 and 2 make 3, equal tiles double, and you always see the next tile.',
    es: 'Desplaza las fichas de casilla en casilla: 1 y 2 hacen 3, las iguales se duplican y siempre ves la siguiente ficha.',
  },
  description: {
    en: 'A sliding number puzzle in the threes style. Every move shifts the tiles a single cell; a 1 and a 2 merge into a 3, equal tiles from 3 up double, and the next tile — always shown — enters behind a line that moved. Tiles come from a shuffled deck, so planning pays. Three board sizes, a daily game, one-step undo, hints and a watch mode from an expectimax search.',
    es: 'Un puzle de números deslizantes al estilo de los tríos. Cada movimiento desplaza las fichas una sola casilla; un 1 y un 2 se fusionan en un 3, las fichas iguales desde 3 se duplican y la siguiente ficha, siempre a la vista, entra detrás de una línea que se movió. Las fichas salen de un mazo barajado, así que planificar compensa. Tres tamaños de tablero, partida del día, deshacer un paso, pistas y modo de ver con una búsqueda expectimax.',
  },
  category: 'puzzle',
  genre: { en: 'Sliding number puzzle', es: 'Puzle de números deslizantes' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['numbers', 'merge', 'sliding', 'logic', 'daily'],
  achievements: [
    {
      id: 'goal',
      title: { en: 'Goal Tile', es: 'Ficha objetivo' },
      description: {
        en: "Make the board's goal tile (384 on 4×4).",
        es: 'Consigue la ficha objetivo del tablero (384 en 4×4).',
      },
    },
    {
      id: 'clean',
      title: { en: 'No Second Thoughts', es: 'Sin vuelta atrás' },
      description: {
        en: 'Make the goal tile without undo or hints.',
        es: 'Consigue la ficha objetivo sin deshacer ni pistas.',
      },
    },
    {
      id: 'beyond',
      title: { en: 'Twice the Goal', es: 'El doble del objetivo' },
      description: {
        en: 'Make a tile twice the goal (768 on 4×4).',
        es: 'Consigue una ficha del doble del objetivo (768 en 4×4).',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Trio', es: 'Trío diario' },
      description: {
        en: "Make the goal tile in today's 4×4 game.",
        es: 'Consigue la ficha objetivo en la partida del día de 4×4.',
      },
    },
  ],
};
