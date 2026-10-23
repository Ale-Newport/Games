import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hnefatafl',
  number: 55,
  title: { en: 'Hnefatafl', es: 'Hnefatafl' },
  tagline: {
    en: 'The Norse king’s escape: 24 raiders against a king and his twelve guards.',
    es: 'La huida del rey nórdico: 24 asaltantes contra un rey y sus doce guardias.',
  },
  description: {
    en: 'An asymmetric battle on an 11×11 board. The defenders win by bringing their king to a corner; the attackers win by surrounding him on all four sides. Every piece moves like a rook and captures by sandwiching. Play either side.',
    es: 'Una batalla asimétrica en un tablero de 11×11. Los defensores ganan si su rey llega a una esquina; los atacantes, si lo rodean por los cuatro lados. Todas las piezas mueven como torres y capturan encerrando entre dos. Juega con cualquier bando.',
  },
  category: 'strategy',
  genre: { en: 'Traditional strategy', es: 'Estrategia tradicional' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['hnefatafl', 'tafl', 'norse', 'asymmetric'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Saga Begins', es: 'Empieza la saga' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Shield Wall', es: 'Muro de escudos' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Jarl', es: 'Jarl' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'king-escapes',
      title: { en: 'The King Escapes', es: 'El rey escapa' },
      description: {
        en: 'Win against the computer as the defenders.',
        es: 'Gana a la CPU con los defensores.',
      },
    },
    {
      id: 'king-taken',
      title: { en: 'The King Falls', es: 'Cae el rey' },
      description: {
        en: 'Win against the computer as the attackers.',
        es: 'Gana a la CPU con los atacantes.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
