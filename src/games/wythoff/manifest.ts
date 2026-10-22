import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'wythoff',
  number: 43,
  title: { en: "Wythoff's Game", es: 'Juego de Wythoff' },
  tagline: {
    en: 'Two heaps, a diagonal move, and the golden ratio in disguise.',
    es: 'Dos montones, una jugada en diagonal y la razón áurea disfrazada.',
  },
  description: {
    en: 'Two heaps of counters. Take any number from one heap, or the same number from both. Whoever takes the last counter wins. The losing positions follow the golden ratio. A fresh setup every round and a perfect-play computer on Hard.',
    es: 'Dos montones de fichas. Toma las que quieras de un montón, o el mismo número de ambos. Quien se lleva la última gana. Las posiciones perdedoras siguen la razón áurea. Nueva disposición cada ronda y una CPU de juego perfecto en Difícil.',
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
  tags: ['wythoff', 'combinatorial', 'math', 'golden ratio'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Queen to the Corner', es: 'Reina a la esquina' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Cold Pairs', es: 'Pares fríos' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Golden Ratio', es: 'Razón áurea' },
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
