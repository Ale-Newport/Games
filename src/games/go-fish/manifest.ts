import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'go-fish',
  number: 100,
  title: { en: 'Go Fish', es: 'Pesca' },
  tagline: {
    en: 'Ask for ranks, fish from the pond and collect books of four — against up to three AIs.',
    es: 'Pide números, pesca del estanque y reúne libros de cuatro, contra hasta tres IA.',
  },
  description: {
    en: 'The family classic: ask another player for a rank you hold and take every card of it they have; if they have none, go fish. Four of a rank make a book, and the most books wins. The opponents remember the asks, and the Hard one counts the unseen cards to ask where they most likely are.',
    es: 'El clásico familiar: pide a otro jugador un número que tengas y llévate todas sus cartas de ese número; si no tiene, a pescar. Cuatro iguales forman un libro y gana quien reúna más. Los rivales recuerdan las peticiones y el difícil cuenta las cartas que no ha visto para pedir donde es más probable.',
  },
  category: 'cards',
  genre: { en: 'Collecting', es: 'Colección' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Books', es: 'Libros' } },
  tags: ['go fish', 'books', 'memory', 'cards'],
  achievements: [
    {
      id: 'book',
      title: { en: 'First Book', es: 'Primer libro' },
      description: { en: 'Lay down a book.', es: 'Baja un libro.' },
    },
    {
      id: 'big-catch',
      title: { en: 'Big Catch', es: 'Gran captura' },
      description: {
        en: 'Get three cards from a single ask.',
        es: 'Consigue tres cartas con una sola petición.',
      },
    },
    {
      id: 'lucky',
      title: { en: 'Fish Your Wish', es: 'Pesca milagrosa' },
      description: {
        en: 'Fish up the very rank you asked for.',
        es: 'Pesca justo el número que pediste.',
      },
    },
    {
      id: 'win',
      title: { en: 'Best Angler', es: 'Mejor pescador' },
      description: { en: 'Win a game outright.', es: 'Gana una partida sin empate.' },
    },
    {
      id: 'full-table',
      title: { en: 'Crowded Pond', es: 'Estanque lleno' },
      description: {
        en: 'Win against three Hard opponents.',
        es: 'Gana contra tres rivales difíciles.',
      },
    },
  ],
};
