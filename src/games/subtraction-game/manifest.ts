import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'subtraction-game',
  number: 44,
  title: { en: 'Subtraction Game', es: 'Juego de la resta' },
  tagline: {
    en: 'Take one, two or three. Can you find the magic number?',
    es: 'Toma una, dos o tres. ¿Encontrarás el número mágico?',
  },
  description: {
    en: 'A single heap of 15 to 30 counters. Each turn take 1, 2 or 3; whoever takes the last counter wins. Simple to learn, with a neat pattern to discover. A fresh heap every round and a perfect-play computer on Hard.',
    es: 'Un solo montón de 15 a 30 fichas. En cada turno toma 1, 2 o 3; quien se lleva la última gana. Fácil de aprender y con un patrón elegante por descubrir. Montón nuevo cada ronda y una CPU de juego perfecto en Difícil.',
  },
  category: 'strategy',
  genre: { en: 'Mathematical game', es: 'Juego matemático' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 2,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['subtraction game', 'take-away', 'combinatorial', 'math'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Count Down', es: 'Cuenta atrás' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Pattern Spotter', es: 'Detecta el patrón' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Multiples of Four', es: 'Múltiplos de cuatro' },
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
