import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'spider-1-suit',
  number: 74,
  title: { en: 'Spider — One Suit', es: 'Spider — Un palo' },
  tagline: {
    en: 'Two decks of spades, ten columns: build king-to-ace runs and clear the table.',
    es: 'Dos barajas de picas y diez columnas: forma escaleras del rey al as y limpia la mesa.',
  },
  description: {
    en: 'The gentle Spider: every card is a spade. Stack cards one rank lower in any order, move runs together, deal ten new cards when you are stuck, and clear all eight king-to-ace runs.',
    es: 'El Spider más amable: todas las cartas son picas. Coloca cartas un rango más bajo, mueve escaleras enteras, reparte diez cartas nuevas cuando te atasques y completa las ocho escaleras del rey al as.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['spider', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Web Spinner', es: 'Tejedor' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Quick Legs', es: 'Ocho patas veloces' },
      description: {
        en: 'Solve a deal in under 10 minutes.',
        es: 'Resuelve una partida en menos de 10 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Unaided', es: 'Sin ayuda' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
    {
      id: 'high-score',
      title: { en: 'Thousand Club', es: 'Club de los mil' },
      description: {
        en: 'Solve a deal with 1000 points or more.',
        es: 'Resuelve una partida con 1000 puntos o más.',
      },
    },
  ],
};
