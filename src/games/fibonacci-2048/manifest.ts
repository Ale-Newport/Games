import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'fibonacci-2048',
  number: 139,
  title: { en: 'Fibonacci Merge', es: 'Fusión de Fibonacci' },
  tagline: {
    en: 'Slide and merge neighbours of the Fibonacci sequence: 1+2, 2+3, 3+5… all the way to 2584.',
    es: 'Desliza y fusiona vecinas de la sucesión de Fibonacci: 1+2, 2+3, 3+5… hasta llegar a 2584.',
  },
  description: {
    en: 'A sliding merge puzzle where tiles merge only with their Fibonacci neighbour: 1 and 1 make 2, 2 and 3 make 5, 5 and 8 make 13. Equal tiles no longer pair up, so the board asks for a different order. Reach 2584 on 4×4, 144 on 3×3 or 4181 on 5×5, with a daily game, one-step undo, hints and a watch mode from an expectimax search.',
    es: 'Un puzle de fusiones deslizantes en el que las fichas solo se fusionan con su vecina de Fibonacci: 1 y 1 hacen 2, 2 y 3 hacen 5, 5 y 8 hacen 13. Las fichas iguales ya no se emparejan, así que el tablero pide otro orden. Llega a 2584 en 4×4, 144 en 3×3 o 4181 en 5×5, con partida del día, deshacer un paso, pistas y modo de ver con una búsqueda expectimax.',
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
  tags: ['numbers', 'merge', 'sliding', 'math', 'daily'],
  achievements: [
    {
      id: 'goal',
      title: { en: 'Golden Tile', es: 'Ficha áurea' },
      description: {
        en: "Make the board's goal tile (2584 on 4×4).",
        es: 'Consigue la ficha objetivo del tablero (2584 en 4×4).',
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
      title: { en: 'Past the Goal', es: 'Más allá del objetivo' },
      description: {
        en: 'Make a tile of at least twice the goal (6765 on 4×4).',
        es: 'Consigue una ficha de al menos el doble del objetivo (6765 en 4×4).',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Spiral', es: 'Espiral diaria' },
      description: {
        en: "Make the goal tile in today's 4×4 game.",
        es: 'Consigue la ficha objetivo en la partida del día de 4×4.',
      },
    },
  ],
};
