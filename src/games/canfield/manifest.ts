import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'canfield',
  number: 85,
  title: { en: 'Canfield', es: 'Canfield' },
  tagline: {
    en: 'Thirteen cards in reserve, foundations from a random base — a gambler’s patience.',
    es: 'Trece cartas en reserva y fundaciones desde una base al azar: un solitario de apostadores.',
  },
  description: {
    en: 'A thirteen-card reserve feeds four small tableau piles while you build the foundations up by suit from a base rank chosen by the deal, wrapping from king to ace. Turn the stock three at a time, empty the reserve, and bring every card home.',
    es: 'Una reserva de trece cartas alimenta cuatro pequeños montones mientras construyes las fundaciones por palo desde un rango base que decide el reparto, pasando del rey al as. Gira el mazo de tres en tres, vacía la reserva y lleva todas las cartas a casa.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: null,
  tags: ['canfield', 'demon', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'reserve',
      title: { en: 'Reserve Spent', es: 'Reserva agotada' },
      description: { en: 'Empty the reserve.', es: 'Vacía la reserva.' },
    },
    {
      id: 'first-win',
      title: { en: 'Beat the House', es: 'Ganarle a la banca' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'clean',
      title: { en: 'Fair Dealer', es: 'Juego limpio' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
  ],
};
