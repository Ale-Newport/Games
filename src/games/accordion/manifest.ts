import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'accordion',
  number: 83,
  title: { en: 'Accordion', es: 'Acordeón' },
  tagline: {
    en: 'Squeeze a row of 52 cards into a single pile, matching suit or rank.',
    es: 'Comprime una fila de 52 cartas en un solo montón emparejando palo o rango.',
  },
  description: {
    en: 'Deal the cards one at a time into a row. A pile can jump onto its neighbor, or onto the pile three places to its left, when their top cards share a suit or a rank. Close the row up like an accordion — ending with a single pile is a rare triumph.',
    es: 'Reparte las cartas de una en una en fila. Un montón puede saltar sobre su vecino, o sobre el que está tres puestos a su izquierda, si sus cartas de arriba comparten palo o rango. Cierra la fila como un acordeón: acabar con un solo montón es un triunfo poco común.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Piles', es: 'Montones' }, lowerIsBetter: true },
  tags: ['accordion', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'five',
      title: { en: 'Squeezebox', es: 'Fuelle' },
      description: {
        en: 'Finish a deal with five piles or fewer.',
        es: 'Termina con cinco montones o menos.',
      },
    },
    {
      id: 'three',
      title: { en: 'Tight Squeeze', es: 'Bien apretado' },
      description: {
        en: 'Finish a deal with three piles or fewer.',
        es: 'Termina con tres montones o menos.',
      },
    },
    {
      id: 'first-win',
      title: { en: 'One Pile', es: 'Un solo montón' },
      description: {
        en: 'Squeeze the whole deck into one pile.',
        es: 'Reúne toda la baraja en un montón.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Virtuoso', es: 'Virtuoso' },
      description: { en: 'Win without undo or hints.', es: 'Gana sin deshacer ni pistas.' },
    },
  ],
};
