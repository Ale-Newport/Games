import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'nim',
  number: 41,
  title: { en: 'Nim', es: 'Nim' },
  tagline: {
    en: 'The classic take-away game with a hidden mathematical key.',
    es: 'El clásico juego de retirar fichas con una clave matemática oculta.',
  },
  description: {
    en: 'Three to five heaps of counters. On your turn take as many as you like from a single heap; whoever takes the last counter wins. A fresh setup every round, and a perfect-play computer on Hard.',
    es: 'De tres a cinco montones de fichas. En tu turno toma las que quieras de un solo montón; quien se lleva la última gana. Nueva disposición cada ronda y una CPU de juego perfecto en Difícil.',
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
  tags: ['nim', 'combinatorial', 'math', 'heaps'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Last Counter', es: 'Última ficha' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Binary Thinker', es: 'Pensamiento binario' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Nim-Sum Zero', es: 'Suma nim cero' },
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
