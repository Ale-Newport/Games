import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'misere-nim',
  number: 42,
  title: { en: 'Misère Nim', es: 'Nim misère' },
  tagline: {
    en: 'Nim where the last counter is poison.',
    es: 'El Nim en el que la última ficha es veneno.',
  },
  description: {
    en: 'The same heaps and moves as Nim, but whoever takes the last counter loses. The strategy is almost the same — until only single counters remain. A fresh setup every round, and a perfect-play computer on Hard.',
    es: 'Los mismos montones y jugadas que el Nim, pero quien toma la última ficha pierde. La estrategia es casi igual… hasta que solo quedan fichas sueltas. Nueva disposición cada ronda y una CPU de juego perfecto en Difícil.',
  },
  category: 'strategy',
  genre: { en: 'Mathematical game', es: 'Juego matemático' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['nim', 'misère', 'combinatorial', 'math', 'heaps'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Poisoned Chalice', es: 'Cáliz envenenado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Upside Down', es: 'Del revés' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'The Endgame Switch', es: 'El cambio final' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'second-wins',
      title: { en: 'Turnaround', es: 'Remontada' },
      description: {
        en: 'Win a round in which the computer moved first.',
        es: 'Gana una ronda en la que la CPU empezó.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
