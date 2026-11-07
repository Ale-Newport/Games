import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'klondike-draw-3',
  number: 72,
  title: { en: 'Klondike — Draw Three', es: 'Klondike — Robar tres' },
  tagline: {
    en: 'The tougher Klondike: the stock turns three cards at a time, and only the top one plays.',
    es: 'El Klondike más exigente: el mazo se gira de tres en tres y solo juega la de arriba.',
  },
  description: {
    en: 'Seven columns, a stock turned three cards at a time (only the top one plays), and four foundations to fill from ace to king. Move runs of alternating colors, free the face-down cards and bring all 52 cards home.',
    es: 'Siete columnas, un mazo que se gira de tres en tres (solo juega la de arriba) y cuatro fundaciones que llenar del as al rey. Mueve escaleras de colores alternos, destapa las cartas boca abajo y lleva las 52 a casa.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['klondike', 'draw three', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Three Up', es: 'De tres en tres' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Fast Fingers', es: 'Dedos veloces' },
      description: {
        en: 'Solve a deal in under 5 minutes.',
        es: 'Resuelve una partida en menos de 5 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Steady Nerves', es: 'Nervios de acero' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
    {
      id: 'three-passes',
      title: { en: 'Three Passes', es: 'Tres vueltas' },
      description: {
        en: 'Solve a deal going through the stock at most three times.',
        es: 'Resuelve una partida dando como mucho tres vueltas al mazo.',
      },
    },
  ],
};
