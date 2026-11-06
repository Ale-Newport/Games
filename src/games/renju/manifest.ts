import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'renju',
  number: 8,
  title: { en: 'Renju', es: 'Renju' },
  tagline: {
    en: 'Five in a row with competition restrictions on Black.',
    es: 'Cinco en línea con las restricciones de competición para negras.',
  },
  description: {
    en: 'The professional form of five-in-a-row: Black may not make double threes, double fours or overlines. Forbidden points are shown on the board.',
    es: 'La forma profesional del cinco en línea: negras no pueden hacer dobles treses, dobles cuatros ni líneas largas. Los puntos prohibidos se muestran en el tablero.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['renju', 'gomoku', 'five in a row', 'RIF', 'forbidden moves', 'cinco en línea'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'By the Rules', es: 'Según las reglas' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Restricted Tactics', es: 'Táctica restringida' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Renju Adept', es: 'Adepto del renju' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Renju Master', es: 'Maestro del renju' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'win-as-white',
      title: { en: 'Second Is Enough', es: 'Segundo basta' },
      description: {
        en: 'Beat the computer playing White.',
        es: 'Vence a la CPU jugando con blancas.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Tournament Table', es: 'Mesa de torneo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
