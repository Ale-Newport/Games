import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'memory-pairs',
  number: 165,
  title: { en: 'Memory Pairs', es: 'Parejas' },
  tagline: {
    en: 'Turn over two cards at a time and remember where every face is.',
    es: 'Da la vuelta a dos cartas cada vez y recuerda dónde está cada figura.',
  },
  description: {
    en: 'The concentration game on grids of 16, 24 or 36 cards with original faces: clear the grid solo in as few turns as you can, or race a computer that remembers the last 6 or 14 cards it saw — or never forgets.',
    es: 'El juego de memoria en cuadrículas de 16, 24 o 36 cartas con figuras originales: despeja la cuadrícula en solitario en el menor número de turnos, o compite con un ordenador que recuerda las últimas 6 o 14 cartas vistas, o que nunca olvida.',
  },
  category: 'dice',
  genre: { en: 'Memory game', es: 'Juego de memoria' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pairs', es: 'Parejas' } },
  tags: ['memory', 'cards', 'solo', 'vs-ai', 'family'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Matched Up', es: 'Emparejado' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'perfect',
      title: { en: 'Total Recall', es: 'Memoria total' },
      description: { en: 'Beat the Perfect opponent.', es: 'Vence al rival Perfecto.' },
    },
    {
      id: 'sharp',
      title: { en: 'Sharp Mind', es: 'Mente aguda' },
      description: {
        en: 'Clear a grid solo within 1.6 turns per pair.',
        es: 'Despeja una cuadrícula en solitario en 1,6 turnos por pareja o menos.',
      },
    },
    {
      id: 'large',
      title: { en: 'Big Board', es: 'Tablero grande' },
      description: { en: 'Finish a 6 × 6 game.', es: 'Termina una partida de 6 × 6.' },
    },
  ],
};
