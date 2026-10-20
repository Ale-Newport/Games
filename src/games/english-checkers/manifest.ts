import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'english-checkers',
  number: 12,
  title: { en: 'English Checkers', es: 'Damas inglesas' },
  tagline: {
    en: 'Jump, chain captures and crown your kings.',
    es: 'Salta, encadena capturas y corona tus damas.',
  },
  description: {
    en: 'Classic 8×8 checkers with compulsory captures, multi-jumps, kings and official draw rules, against three computer levels or a friend.',
    es: 'Damas clásicas de 8×8 con capturas obligatorias, saltos múltiples, damas y reglas oficiales de tablas, contra tres niveles de CPU o un amigo.',
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
  tags: ['checkers', 'draughts', 'damas', 'english draughts', 'american checkers'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Jump', es: 'Primer salto' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Board Tactician', es: 'Táctico del tablero' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Checkers Champion', es: 'Campeón de damas' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'crowned',
      title: { en: 'Crowned', es: 'Coronado' },
      description: { en: 'Crown a king.', es: 'Corona una dama.' },
    },
    {
      id: 'triple-jump',
      title: { en: 'Triple Jump', es: 'Triple salto' },
      description: {
        en: 'Capture three or more pieces in one move.',
        es: 'Captura tres o más piezas en una jugada.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Kitchen Table', es: 'Mesa de cocina' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
