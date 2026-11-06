import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'ultimate-tic-tac-toe',
  number: 3,
  title: { en: 'Ultimate Tic-Tac-Toe', es: 'Tres en raya definitivo' },
  tagline: {
    en: 'Nine boards, one battle. Your move sends your rival.',
    es: 'Nueve tableros, una batalla. Tu jugada decide dónde juega tu rival.',
  },
  description: {
    en: 'Win small boards to claim the big one. Every move dictates where your opponent plays next. Three computer levels, hot-seat and AI-vs-AI.',
    es: 'Gana tableros pequeños para conquistar el grande. Cada jugada decide dónde juega tu rival. Tres niveles de CPU, dos jugadores e IA contra IA.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['ultimate', 'meta tic tac toe', 'super tic tac toe', 'tres en raya', 'gato'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Board Conqueror', es: 'Conquistador' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra la CPU.',
      },
    },
    {
      id: 'beat-medium',
      title: { en: 'Strategist', es: 'Estratega' },
      description: { en: 'Beat the Medium computer.', es: 'Vence a la CPU en nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Grandmaster of Nine', es: 'Gran maestro de los nueve' },
      description: { en: 'Beat the Hard computer.', es: 'Vence a la CPU en nivel Difícil.' },
    },
    {
      id: 'diagonal-boards',
      title: { en: 'Corner to Corner', es: 'De esquina a esquina' },
      description: {
        en: 'Win with a diagonal of boards.',
        es: 'Gana con una diagonal de tableros.',
      },
    },
    {
      id: 'comeback',
      title: { en: 'Comeback', es: 'Remontada' },
      description: {
        en: 'Win after trailing in captured boards.',
        es: 'Gana tras ir por detrás en tableros conquistados.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Nine-Board Rivals', es: 'Rivales de nueve tableros' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
