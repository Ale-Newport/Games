import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'go-13x13',
  number: 26,
  title: { en: 'Go 13×13', es: 'Go 13×13' },
  tagline: {
    en: 'Surround territory, capture stones — on the 13×13 board.',
    es: 'Rodea territorio y captura piedras en el tablero de 13×13.',
  },
  description: {
    en: 'Go with captures, positional superko, passing and area scoring (komi 7.5), a counted-territory view at the end, clocks and four Monte Carlo computer levels.',
    es: 'Go con capturas, superko posicional, pase y recuento por área (komi 7,5), vista del territorio contado al final, relojes y cuatro niveles de CPU Monte Carlo.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 30,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['go', 'weiqi', 'baduk', '13x13', 'territory'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Living Group', es: 'Primer grupo vivo' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Kyu Player', es: 'Jugador kyu' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Strong Shape', es: 'Buena forma' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Frameworks', es: 'Marcos' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'big-capture',
      title: { en: 'Big Catch', es: 'Gran captura' },
      description: {
        en: 'Capture 10 or more stones in a game against the computer.',
        es: 'Captura 10 piedras o más en una partida contra la CPU.',
      },
    },
    {
      id: 'by-ten',
      title: { en: 'Clear Margin', es: 'Margen claro' },
      description: {
        en: 'Beat the computer by 10 points or more.',
        es: 'Vence a la CPU por 10 puntos o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Teahouse Game', es: 'Partida en la casa de té' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
