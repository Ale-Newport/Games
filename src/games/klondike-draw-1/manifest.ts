import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'klondike-draw-1',
  number: 71,
  title: { en: 'Klondike — Draw One', es: 'Klondike — Robar una' },
  tagline: {
    en: 'The classic patience: build down in alternating colors and send every suit home.',
    es: 'El solitario clásico: baja en colores alternos y lleva cada palo a casa.',
  },
  description: {
    en: 'Seven columns, a stock turned one card at a time, and four foundations to fill from ace to king. Move runs of alternating colors, free the face-down cards and bring all 52 cards home.',
    es: 'Siete columnas, un mazo que se gira de carta en carta y cuatro fundaciones que llenar del as al rey. Mueve escaleras de colores alternos, destapa las cartas boca abajo y lleva las 52 a casa.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['klondike', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Full House', es: 'Casa llena' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Quick Hands', es: 'Manos rápidas' },
      description: {
        en: 'Solve a deal in under 4 minutes.',
        es: 'Resuelve una partida en menos de 4 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'No Second Thoughts', es: 'Sin dudar' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
    {
      id: 'one-pass',
      title: { en: 'Single Pass', es: 'Una sola vuelta' },
      description: {
        en: 'Solve a deal without going through the stock twice.',
        es: 'Resuelve una partida sin dar dos vueltas al mazo.',
      },
    },
  ],
};
