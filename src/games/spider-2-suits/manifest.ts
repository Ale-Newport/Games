import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'spider-2-suits',
  number: 75,
  title: { en: 'Spider — Two Suits', es: 'Spider — Dos palos' },
  tagline: {
    en: 'Spades and hearts, ten columns: sort the suits into king-to-ace runs.',
    es: 'Picas y corazones en diez columnas: separa los palos en escaleras del rey al as.',
  },
  description: {
    en: 'Spider with two suits: cards stack on any suit, but only runs of one suit move together and only one-suit runs from king to ace leave the table. Untangle spades from hearts and clear all eight runs.',
    es: 'Spider con dos palos: las cartas se apilan sobre cualquier palo, pero solo se mueven juntas las escaleras de un palo y solo salen las escaleras de un palo del rey al as. Separa picas de corazones y completa las ocho escaleras.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['spider', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Two-Tone Web', es: 'Telaraña bicolor' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Swift Weaver', es: 'Tejedor veloz' },
      description: {
        en: 'Solve a deal in under 15 minutes.',
        es: 'Resuelve una partida en menos de 15 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Steady Hands', es: 'Pulso firme' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
    {
      id: 'high-score',
      title: { en: 'High Silk', es: 'Seda fina' },
      description: {
        en: 'Solve a deal with 1000 points or more.',
        es: 'Resuelve una partida con 1000 puntos o más.',
      },
    },
  ],
};
