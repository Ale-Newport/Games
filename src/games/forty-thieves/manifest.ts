import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'forty-thieves',
  number: 82,
  title: { en: 'Forty Thieves', es: 'Cuarenta ladrones' },
  tagline: {
    en: 'Two decks, forty cards on show, one card at a time — a stern classic.',
    es: 'Dos barajas, cuarenta cartas a la vista y una carta cada vez: un clásico exigente.',
  },
  description: {
    en: 'Forty cards lie face up in ten columns, the rest wait in the stock for a single pass. Build down by suit one card at a time, use empty columns wisely, and bring all eight suits home from ace to king.',
    es: 'Cuarenta cartas boca arriba en diez columnas; el resto espera en el mazo para una sola vuelta. Baja del mismo palo carta a carta, aprovecha las columnas vacías y lleva los ocho palos a casa del as al rey.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: null,
  tags: ['forty thieves', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Open Sesame', es: 'Ábrete, sésamo' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'early',
      title: { en: 'Quick Getaway', es: 'Huida rápida' },
      description: {
        en: 'Solve a deal with cards still in the stock.',
        es: 'Resuelve una partida con cartas aún en el mazo.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Honest Thief', es: 'Ladrón honrado' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
  ],
};
