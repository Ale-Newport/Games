import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'four-in-a-row',
  number: 5,
  title: { en: 'Four in a Row', es: 'Cuatro en línea' },
  tagline: {
    en: 'Drop, stack and connect four before your rival.',
    es: 'Suelta, apila y conecta cuatro antes que tu rival.',
  },
  description: {
    en: 'The classic 7×6 vertical disc-dropping game: gravity, threats and traps, against three computer levels or a friend.',
    es: 'El clásico juego vertical de 7×6 con fichas que caen: gravedad, amenazas y trampas, contra tres niveles de CPU o un amigo.',
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
  tags: ['connect four', 'connect 4', 'conecta 4', 'cuatro en raya', 'gravity', 'discs'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Connected', es: 'Conectado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Five Moves Ahead', es: 'Cinco jugadas adelante' },
      description: { en: 'Beat the Medium computer.', es: 'Vence a la CPU en nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Deep Diver', es: 'Buzo profundo' },
      description: { en: 'Beat the Hard computer.', es: 'Vence a la CPU en nivel Difícil.' },
    },
    {
      id: 'diagonal',
      title: { en: 'On the Slant', es: 'En diagonal' },
      description: { en: 'Win with a diagonal line.', es: 'Gana con una línea diagonal.' },
    },
    {
      id: 'full-board',
      title: { en: 'Every Last Cell', es: 'Hasta la última casilla' },
      description: {
        en: 'Play a game that fills all 42 cells.',
        es: 'Juega una partida que llene las 42 casillas.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Table Rivals', es: 'Rivales de mesa' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
