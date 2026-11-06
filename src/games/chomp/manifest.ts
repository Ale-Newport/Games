import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'chomp',
  number: 45,
  title: { en: 'Chomp', es: 'Chomp' },
  tagline: {
    en: 'Share a chocolate bar — whoever gets the poisoned corner loses.',
    es: 'Comparte una tableta de chocolate: a quien le toque la esquina envenenada pierde.',
  },
  description: {
    en: 'Each turn pick a square of the bar and eat it along with everything below and to its right. Leave your opponent nothing but the poisoned corner to win. The bar size changes every round; Hard plays perfectly with an exact solver.',
    es: 'En cada turno elige un cuadrado de la tableta y cómetelo junto con todo lo que hay debajo y a su derecha. Deja al rival solo la esquina envenenada para ganar. El tamaño cambia cada ronda; Difícil juega perfecto con un solucionador exacto.',
  },
  category: 'strategy',
  genre: { en: 'Mathematical game', es: 'Juego matemático' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['chomp', 'combinatorial', 'math', 'chocolate'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Sweet Victory', es: 'Dulce victoria' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Careful Bites', es: 'Mordiscos con cuidado' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Strategy Stealer', es: 'Robo de estrategia' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'big-bar',
      title: { en: 'Family Size', es: 'Tamaño familiar' },
      description: {
        en: 'Win on a bar of 42 squares or more.',
        es: 'Gana en una tableta de 42 cuadrados o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
