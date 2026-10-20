import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'spanish-checkers',
  number: 14,
  title: { en: 'Spanish Checkers', es: 'Damas españolas' },
  tagline: {
    en: 'Flying kings and the laws of quantity and quality.',
    es: 'Damas voladoras y las leyes de la cantidad y la calidad.',
  },
  description: {
    en: 'Damas españolas on 8×8: flying kings, forward-only men, and compulsory captures that must take the most pieces, then the most kings.',
    es: 'Damas españolas en 8×8: damas voladoras, peones que solo avanzan y capturas obligatorias de la mayor cantidad de piezas y, después, de damas.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['damas', 'damas españolas', 'checkers', 'draughts', 'flying kings'],
  achievements: [
    {
      id: 'first-win',
      title: { en: '¡Victoria!', es: '¡Victoria!' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Law of Quantity', es: 'Ley de la cantidad' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Law of Quality', es: 'Ley de la calidad' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'crowned',
      title: { en: 'A New Dama', es: 'Nueva dama' },
      description: { en: 'Crown a king.', es: 'Corona una dama.' },
    },
    {
      id: 'king-hunter',
      title: { en: 'King Hunter', es: 'Cazadamas' },
      description: { en: 'Capture an enemy king.', es: 'Captura una dama rival.' },
    },
    {
      id: 'hot-seat',
      title: { en: 'Café Table', es: 'Mesa de café' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
