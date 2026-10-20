import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'international-draughts',
  number: 13,
  title: { en: 'International Draughts', es: 'Damas internacionales' },
  tagline: {
    en: 'Flying kings and the majority rule on a 10×10 board.',
    es: 'Damas voladoras y la ley de la mayoría en un tablero de 10×10.',
  },
  description: {
    en: 'The world-championship form of draughts: 20 men each, backward captures, flying kings, compulsory majority captures and FMJD draw rules.',
    es: 'La forma de campeonato mundial de las damas: 20 peones por bando, capturas hacia atrás, damas voladoras, capturas mayoritarias obligatorias y reglas de tablas de la FMJD.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['draughts', 'damas', '10x10', 'FMJD', 'flying kings', 'damas voladoras'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Breakthrough', es: 'Avance' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Majority Rules', es: 'Manda la mayoría' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Grandmaster Draughts', es: 'Gran maestro de damas' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'crowned',
      title: { en: 'Flying Crown', es: 'Corona voladora' },
      description: { en: 'Crown a king.', es: 'Corona una dama.' },
    },
    {
      id: 'grand-capture',
      title: { en: 'Grand Capture', es: 'Gran redada' },
      description: {
        en: 'Capture four or more pieces in one move.',
        es: 'Captura cuatro o más piezas en una jugada.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Club Night', es: 'Noche de club' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
