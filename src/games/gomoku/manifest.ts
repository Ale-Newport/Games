import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'gomoku',
  number: 7,
  title: { en: 'Gomoku', es: 'Gomoku' },
  tagline: {
    en: 'Five stones in a row on a 15×15 board.',
    es: 'Cinco piedras en línea en un tablero de 15×15.',
  },
  description: {
    en: 'Freestyle Gomoku: the classic five-in-a-row stone game, with four computer levels up to a six-move-deep searcher.',
    es: 'Gomoku libre: el clásico juego de piedras de cinco en línea, con cuatro niveles de CPU hasta un buscador de seis jugadas.',
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
  tags: ['five in a row', 'gobang', 'cinco en línea', 'stones', 'piedras', 'go board'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Five Alive', es: 'Cinco vivos' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Threat Spotter', es: 'Ojo para las amenazas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Four Moves Deep', es: 'Cuatro jugadas de fondo' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Gomoku Master', es: 'Maestro del gomoku' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'swift-five',
      title: { en: 'Swift Five', es: 'Cinco rápidos' },
      description: {
        en: 'Win with seven or fewer stones on the board.',
        es: 'Gana con siete piedras o menos en el tablero.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Stone Rivals', es: 'Rivales de piedra' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
