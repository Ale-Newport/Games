import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'game-2048',
  number: 137,
  title: { en: 'Merge to 2048', es: 'Fusiona hasta 2048' },
  tagline: {
    en: 'Slide the tiles, merge equal pairs, and build your way up to 2048.',
    es: 'Desliza las fichas, fusiona las parejas iguales y construye hasta llegar a 2048.',
  },
  description: {
    en: 'The sliding number puzzle: every move slides all the tiles one way, equal tiles merge into their sum, and a new 2 or 4 drops in. Reach 2048 on the classic board, or try the tight 3×3 and the roomy 5×5. A daily game, one-step undo, hints and a watch mode come from an expectimax search.',
    es: 'El puzle de números deslizantes: cada movimiento desliza todas las fichas hacia un lado, las iguales se fusionan en su suma y cae un 2 o un 4 nuevo. Llega a 2048 en el tablero clásico o prueba el estrecho 3×3 y el amplio 5×5. Partida del día, deshacer un paso, pistas y modo de ver con una búsqueda expectimax.',
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
        en: "Make the board's goal tile (2048 on 4×4).",
        es: 'Consigue la ficha objetivo del tablero (2048 en 4×4).',
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
        en: 'Make a tile twice the goal (4096 on 4×4).',
        es: 'Consigue una ficha del doble del objetivo (4096 en 4×4).',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Merge', es: 'Fusión diaria' },
      description: {
        en: "Make the goal tile in today's 4×4 game.",
        es: 'Consigue la ficha objetivo en la partida del día de 4×4.',
      },
    },
  ],
};
