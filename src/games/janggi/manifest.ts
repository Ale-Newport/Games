import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'janggi',
  number: 24,
  title: { en: 'Janggi', es: 'Janggi' },
  tagline: {
    en: 'Korean chess: palace diagonals, leaping cannons and the right to pass.',
    es: 'Ajedrez coreano: diagonales del palacio, cañones saltarines y derecho a pasar.',
  },
  description: {
    en: 'Janggi on the 9×10 points with four horse/elephant setups, palace diagonals, cannons that must jump, passing, bikjang and point counting, clocks and four computer levels.',
    es: 'Janggi en los 9×10 puntos con cuatro disposiciones de caballos y elefantes, diagonales del palacio, cañones que deben saltar, pase, bikjang y recuento de puntos, relojes y cuatro niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['janggi', 'korean chess', 'ajedrez coreano', 'board game'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Campaign', es: 'Primera campaña' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Captain', es: 'Capitán' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Commander', es: 'Comandante' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Grand Strategist', es: 'Gran estratega' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'cannon-mate',
      title: { en: 'Over the Wall', es: 'Por encima del muro' },
      description: {
        en: 'Checkmate the computer with a cannon move.',
        es: 'Da mate a la CPU con una jugada de cañón.',
      },
    },
    {
      id: 'on-points',
      title: { en: 'Counted Victory', es: 'Victoria a los puntos' },
      description: {
        en: 'Beat the computer on points (bikjang, passes or the move limit).',
        es: 'Vence a la CPU por puntos (bikjang, pases o límite de jugadas).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Village Square', es: 'Plaza del pueblo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
