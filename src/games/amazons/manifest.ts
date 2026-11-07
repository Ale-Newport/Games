import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'amazons',
  number: 67,
  title: { en: 'Game of the Amazons', es: 'El juego de las amazonas' },
  tagline: {
    en: 'Move a queen, shoot an arrow, wall off the board: the last one able to move wins.',
    es: 'Mueve una reina, dispara una flecha y amuralla el tablero: gana el último que pueda mover.',
  },
  description: {
    en: 'Each turn, move one of your four amazons like a chess queen, then shoot an arrow from where it lands, again like a queen. Arrows burn their square for good. As the board fills, fence off space for your own amazons — the player left without a move loses.',
    es: 'En cada turno, mueve una de tus cuatro amazonas como una reina de ajedrez y dispara una flecha desde donde caiga, también como una reina. Las flechas queman su casilla para siempre. A medida que se llena el tablero, reserva espacio para tus amazonas: quien se queda sin jugada pierde.',
  },
  category: 'strategy',
  genre: { en: 'Territory', es: 'Territorio' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['amazons', 'territory', 'queens', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Last One Standing', es: 'El último en pie' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Archer', es: 'Arquera' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Queen of the Board', es: 'Reina del tablero' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'landslide',
      title: { en: 'Room to Spare', es: 'Espacio de sobra' },
      description: {
        en: 'Win with 20 or more squares still yours.',
        es: 'Gana con 20 casillas o más aún tuyas.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
