import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'seven-card-stud',
  number: 90,
  title: { en: 'Seven Card Stud', es: 'Stud de siete cartas' },
  tagline: {
    en: 'Three down, four up: read the open cards and bet fixed limits against up to five AI opponents.',
    es: 'Tres tapadas y cuatro destapadas: lee las cartas a la vista y apuesta con límite fijo contra hasta cinco rivales de IA.',
  },
  description: {
    en: 'No community cards: each player gets seven of their own, four of them face up for everyone to see. Antes and a bring-in start the pot, the best showing hand bets first, and bets double from fifth street. Opponents count the cards they can see when they estimate their chances. Play chips only — no real money.',
    es: 'Sin cartas comunitarias: cada jugador recibe siete propias, cuatro de ellas destapadas a la vista de todos. Los antes y la entrada abren el bote, apuesta primero quien muestra la mejor jugada y las apuestas se doblan desde la quinta calle. Los rivales tienen en cuenta las cartas que ven al estimar sus opciones. Solo fichas de juego, sin dinero real.',
  },
  category: 'cards',
  genre: { en: 'Poker', es: 'Póker' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Finish place', es: 'Puesto final' }, lowerIsBetter: true },
  tags: ['poker', 'stud', 'tournament', 'cards'],
  achievements: [
    {
      id: 'first-pot',
      title: { en: 'First Pot', es: 'Primer bote' },
      description: { en: 'Win a pot.', es: 'Gana un bote.' },
    },
    {
      id: 'steal',
      title: { en: 'Daylight Robbery', es: 'Robo a plena luz' },
      description: {
        en: 'Win a pot by raising and making everyone fold.',
        es: 'Gana un bote subiendo y haciendo que todos se retiren.',
      },
    },
    {
      id: 'rolled-up',
      title: { en: 'Rolled Up', es: 'Trío de salida' },
      description: {
        en: 'Be dealt three of a kind in your first three cards.',
        es: 'Recibe un trío en tus tres primeras cartas.',
      },
    },
    {
      id: 'double-up',
      title: { en: 'Double Up', es: 'Doblar fichas' },
      description: { en: 'Win an all-in showdown.', es: 'Gana un enfrentamiento yendo con todo.' },
    },
    {
      id: 'monster',
      title: { en: 'Monster Hand', es: 'Mano monstruo' },
      description: {
        en: 'Win a showdown with a full house or better.',
        es: 'Gana un enfrentamiento con full o mejor.',
      },
    },
    {
      id: 'champion',
      title: { en: 'Champion', es: 'Campeón' },
      description: { en: 'Win a sit-and-go tournament.', es: 'Gana un torneo.' },
    },
    {
      id: 'shark',
      title: { en: 'Shark', es: 'Tiburón' },
      description: {
        en: 'Win a full table of five Hard opponents.',
        es: 'Gana una mesa completa contra cinco rivales difíciles.',
      },
    },
  ],
};
