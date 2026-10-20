import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'reversi-6x6',
  number: 11,
  title: { en: 'Reversi 6×6', es: 'Reversi 6×6' },
  tagline: {
    en: 'Fast, sharp Reversi on a small board.',
    es: 'Reversi rápido y afilado en un tablero pequeño.',
  },
  description: {
    en: 'The 6×6 variant of Reversi: shorter games, sharper tactics, and an opponent that plays the second half perfectly.',
    es: 'La variante de 6×6 del reversi: partidas cortas, táctica afilada y un rival que juega perfecta la segunda mitad.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['othello', 'reversi', '6x6', 'discs', 'fichas'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Small Board, Big Win', es: 'Tablero pequeño, gran victoria' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Tight Squeeze', es: 'Aprieto' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Out-calculated', es: 'Mejor calculado' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'black-victory',
      title: { en: 'Against the Odds', es: 'Contra pronóstico' },
      description: {
        en: 'Beat the computer playing Black.',
        es: 'Vence a la CPU jugando con negras.',
      },
    },
    {
      id: 'wipeout',
      title: { en: 'Clean Sweep', es: 'Limpieza total' },
      description: {
        en: 'Win leaving your opponent with no discs.',
        es: 'Gana dejando a tu rival sin fichas.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Pocket Rivals', es: 'Rivales de bolsillo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
