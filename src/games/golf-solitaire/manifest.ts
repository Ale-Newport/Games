import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'golf-solitaire',
  number: 79,
  title: { en: 'Golf', es: 'Golf' },
  tagline: {
    en: 'Clear seven columns one rank up or down — and finish under par.',
    es: 'Despeja siete columnas de rango en rango y termina bajo par.',
  },
  description: {
    en: 'Thirty-five cards lie face up in seven columns. Move the top card of any column onto the waste when it is one rank above or below the waste card, turn the stock when nothing fits, and score like golf: the fewer cards left, the better — and every card still in the stock when you clear the table is a stroke under par.',
    es: 'Treinta y cinco cartas boca arriba en siete columnas. Pasa la carta de arriba de cualquier columna al descarte si es un rango mayor o menor, gira el mazo cuando nada encaje y puntúa como en el golf: cuantas menos cartas queden, mejor, y cada carta que sobre en el mazo al despejar la mesa es un golpe bajo par.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Strokes', es: 'Golpes' }, lowerIsBetter: true },
  tags: ['golf', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'In the Hole', es: 'Al hoyo' },
      description: { en: 'Clear the whole table.', es: 'Despeja toda la mesa.' },
    },
    {
      id: 'birdie',
      title: { en: 'Birdie', es: 'Birdie' },
      description: {
        en: 'Clear the table with cards still in the stock.',
        es: 'Despeja la mesa con cartas aún en el mazo.',
      },
    },
    {
      id: 'eagle',
      title: { en: 'Eagle', es: 'Eagle' },
      description: {
        en: 'Clear the table with five or more cards in the stock.',
        es: 'Despeja la mesa con cinco cartas o más en el mazo.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Fair Way', es: 'Juego limpio' },
      description: { en: 'Win without undo or hints.', es: 'Gana sin deshacer ni pistas.' },
    },
  ],
};
