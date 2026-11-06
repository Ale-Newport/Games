import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'reversi-8x8',
  number: 10,
  title: { en: 'Reversi', es: 'Reversi' },
  tagline: {
    en: 'Outflank, flip, and fight for the corners.',
    es: 'Encierra, voltea y lucha por las esquinas.',
  },
  description: {
    en: 'The classic 8×8 disc-flipping strategy game with forced passes, three computer levels and a perfect-endgame Hard opponent.',
    es: 'El clásico juego de estrategia de 8×8 en el que se voltean fichas, con pases obligatorios, tres niveles de CPU y un rival Difícil con final perfecto.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['othello', 'reversi', 'discs', 'fichas', 'flip', 'voltear'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Outflanked', es: 'Rodeado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Corner Grabber', es: 'Cazaesquinas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Perfect Endgame? Not Today', es: '¿Final perfecto? Hoy no' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'wipeout',
      title: { en: 'Wipeout', es: 'Barrido' },
      description: {
        en: 'Win leaving your opponent with no discs.',
        es: 'Gana dejando a tu rival sin fichas.',
      },
    },
    {
      id: 'four-corners',
      title: { en: 'Four Corners', es: 'Cuatro esquinas' },
      description: { en: 'Win owning all four corners.', es: 'Gana con las cuatro esquinas.' },
    },
    {
      id: 'hot-seat',
      title: { en: 'Flip Rivals', es: 'Rivales del volteo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
