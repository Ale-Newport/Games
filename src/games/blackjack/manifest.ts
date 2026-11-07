import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'blackjack',
  number: 86,
  title: { en: 'Blackjack', es: 'Blackjack' },
  tagline: {
    en: 'Beat the dealer to 21 from a six-deck shoe — with a basic-strategy coach at hand.',
    es: 'Gánale a la banca llegando a 21 con un zapato de seis barajas y un entrenador de estrategia básica.',
  },
  description: {
    en: 'Bet your chips, then hit, stand, double or split to get closer to 21 than the dealer without going over. Blackjack pays 3 to 2, the dealer stands on soft 17, and the hint button shows the textbook best play for every hand. Play chips only — no real money.',
    es: 'Apuesta tus fichas y pide, plántate, dobla o separa para acercarte a 21 más que la banca sin pasarte. El blackjack paga 3 a 2, la banca se planta con 17 blando y el botón de pista muestra la mejor jugada de manual en cada mano. Solo fichas de juego, sin dinero real.',
  },
  category: 'cards',
  genre: { en: 'Casino', es: 'Casino' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Chips', es: 'Fichas' } },
  tags: ['blackjack', '21', 'casino', 'cards'],
  achievements: [
    {
      id: 'natural',
      title: { en: 'Natural', es: 'Natural' },
      description: { en: 'Get a blackjack.', es: 'Consigue un blackjack.' },
    },
    {
      id: 'double-down',
      title: { en: 'Double Trouble', es: 'Doble o nada' },
      description: { en: 'Win a doubled hand.', es: 'Gana una mano doblada.' },
    },
    {
      id: 'split-sweep',
      title: { en: 'Clean Split', es: 'Separación perfecta' },
      description: {
        en: 'Win every hand of a split.',
        es: 'Gana todas las manos de una separación.',
      },
    },
    {
      id: 'hot-streak',
      title: { en: 'Hot Streak', es: 'Racha caliente' },
      description: { en: 'Win five rounds in a row.', es: 'Gana cinco rondas seguidas.' },
    },
    {
      id: 'high-roller',
      title: { en: 'High Roller', es: 'Gran apostador' },
      description: { en: 'Double your starting chips.', es: 'Duplica tus fichas iniciales.' },
    },
  ],
};
