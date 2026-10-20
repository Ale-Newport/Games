import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'shogi',
  number: 21,
  title: { en: 'Shogi', es: 'Shogi' },
  tagline: {
    en: 'Capture, drop, promote: the pieces you take fight for you.',
    es: 'Captura, lanza, promociona: las piezas que tomas luchan por ti.',
  },
  description: {
    en: 'Japanese chess on a 9×9 board with drops, promotion zones, the two-pawn and pawn-drop-mate rules, repetition with perpetual check, clocks and four computer levels.',
    es: 'Ajedrez japonés en un tablero de 9×9 con lanzamientos, zonas de promoción, las reglas de dos peones y mate de peón lanzado, repetición con jaque perpetuo, relojes y cuatro niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 5,
  sessionMinutes: 30,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['shogi', 'japanese chess', 'ajedrez japonés', 'drops', 'board game'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Victory', es: 'Primera victoria' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Silver Rank', es: 'Rango de plata' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Gold Rank', es: 'Rango de oro' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Dragon Rank', es: 'Rango de dragón' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'dragon',
      title: { en: 'Here Be Dragons', es: 'Aquí hay dragones' },
      description: {
        en: 'Promote a rook into a dragon against the computer.',
        es: 'Promociona una torre a dragón contra la CPU.',
      },
    },
    {
      id: 'drop-mate',
      title: { en: 'From the Hand', es: 'Desde la mano' },
      description: {
        en: 'Checkmate the computer with a drop.',
        es: 'Da mate a la CPU con un lanzamiento.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Tatami Duel', es: 'Duelo en el tatami' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
