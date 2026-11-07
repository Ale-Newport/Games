import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'spider-4-suits',
  number: 76,
  title: { en: 'Spider — Four Suits', es: 'Spider — Cuatro palos' },
  tagline: {
    en: 'Two full decks, four suits, ten columns: the classic expert patience.',
    es: 'Dos barajas completas, cuatro palos y diez columnas: el solitario clásico para expertos.',
  },
  description: {
    en: 'Spider with all four suits: cards stack on any suit, but only runs of one suit move together and only one-suit runs from king to ace leave the table. Untangle all four suits and clear all eight runs — a real challenge.',
    es: 'Spider con los cuatro palos: las cartas se apilan sobre cualquier palo, pero solo se mueven juntas las escaleras de un palo y solo salen las escaleras de un palo del rey al as. Separa los cuatro palos y completa las ocho escaleras: todo un reto.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 4,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['spider', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Four-Color Web', es: 'Telaraña de cuatro palos' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Master Weaver', es: 'Maestro tejedor' },
      description: {
        en: 'Solve a deal in under 20 minutes.',
        es: 'Resuelve una partida en menos de 20 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Iron Nerves', es: 'Nervios de hierro' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
    {
      id: 'high-score',
      title: { en: 'Golden Thread', es: 'Hilo de oro' },
      description: {
        en: 'Solve a deal with 1000 points or more.',
        es: 'Resuelve una partida con 1000 puntos o más.',
      },
    },
  ],
};
