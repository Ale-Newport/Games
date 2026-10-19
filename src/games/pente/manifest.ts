import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'pente',
  number: 9,
  title: { en: 'Pente', es: 'Pente' },
  tagline: {
    en: 'Five in a row or five captured pairs. Bracket two to take them.',
    es: 'Cinco en línea o cinco parejas capturadas. Encierra dos para llevártelas.',
  },
  description: {
    en: 'Five-in-a-row with custodial pair captures on a 19×19 board, tournament opening rule, and three computer levels.',
    es: 'Cinco en línea con capturas de parejas por encierro en un tablero de 19×19, regla de apertura de torneo y tres niveles de CPU.',
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
  tags: ['pente', 'captures', 'capturas', 'five in a row', 'cinco en línea', 'stones'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Pente!', es: '¡Pente!' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Pair Hunter', es: 'Cazador de parejas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Pente Master', es: 'Maestro del pente' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'capture-win',
      title: { en: 'Five Pairs', es: 'Cinco parejas' },
      description: { en: 'Win by capturing five pairs.', es: 'Gana capturando cinco parejas.' },
    },
    {
      id: 'double-capture',
      title: { en: 'Double Take', es: 'Doble captura' },
      description: {
        en: 'Capture two pairs with one stone.',
        es: 'Captura dos parejas con una sola piedra.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Pente Partners', es: 'Compañeros de pente' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
