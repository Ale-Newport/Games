import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'yukon',
  number: 80,
  title: { en: 'Yukon', es: 'Yukon' },
  tagline: {
    en: 'Klondike without a stock: move any face-up card together with everything on it.',
    es: 'Klondike sin mazo: mueve cualquier carta boca arriba con todo lo que tiene encima.',
  },
  description: {
    en: 'All 52 cards are dealt into seven columns, most of them face up. Build down in alternating colors, but move any face-up card along with all the cards on top of it — in order or not. Free the face-down cards and bring every suit home.',
    es: 'Las 52 cartas se reparten en siete columnas, casi todas boca arriba. Baja en colores alternos, pero mueve cualquier carta boca arriba con todas las que tiene encima, estén en orden o no. Libera las cartas boca abajo y lleva cada palo a casa.',
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
  scoring: null,
  tags: ['yukon', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Gold Rush', es: 'Fiebre del oro' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Sled Dash', es: 'Trineo veloz' },
      description: {
        en: 'Solve a deal in under 5 minutes.',
        es: 'Resuelve una partida en menos de 5 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Prospector', es: 'Buscador' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
  ],
};
