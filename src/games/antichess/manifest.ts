import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'antichess',
  number: 17,
  title: { en: 'Antichess', es: 'Antiajedrez' },
  tagline: {
    en: 'Give everything away first. Captures are compulsory.',
    es: 'Entrégalo todo primero. Capturar es obligatorio.',
  },
  description: {
    en: 'Losing chess: you must capture whenever you can, the king has no royal powers, and you win by running out of pieces or moves. Four computer levels, clocks and resignation.',
    es: 'Ajedrez perdedor: debes capturar siempre que puedas, el rey no tiene poderes reales y ganas al quedarte sin piezas o sin jugadas. Cuatro niveles de CPU, relojes y rendición.',
  },
  category: 'board',
  genre: { en: 'Chess variant', es: 'Variante de ajedrez' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['antichess', 'losing chess', 'giveaway', 'suicide chess', 'antiajedrez', 'variant'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Generous', es: 'Generoso' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Gift Giver', es: 'Dadivoso' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of Losing', es: 'Maestro de perder' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Nothing Left', es: 'No queda nada' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'king-promotion',
      title: { en: 'Long Live the Kings', es: 'Larga vida a los reyes' },
      description: {
        en: 'Promote a pawn to a king against the computer.',
        es: 'Corona un peón en rey contra la CPU.',
      },
    },
    {
      id: 'blocked-win',
      title: { en: 'Stuck and Happy', es: 'Atascado y feliz' },
      description: {
        en: 'Win against the computer with pieces still on the board (no legal moves).',
        es: 'Gana contra la CPU con piezas aún en el tablero (sin jugadas legales).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Race to the Bottom', es: 'Carrera hacia abajo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
