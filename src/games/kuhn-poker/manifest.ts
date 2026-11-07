import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'kuhn-poker',
  number: 91,
  title: { en: 'Kuhn Poker', es: 'Póker de Kuhn' },
  tagline: {
    en: 'Three cards, one bet — the tiny poker game theorists use, against a Nash-equilibrium AI.',
    es: 'Tres cartas y una apuesta: el póker diminuto de la teoría de juegos, contra una IA en equilibrio de Nash.',
  },
  description: {
    en: 'Jack, queen, king: one card each, one round of betting. Small enough to solve exactly — the Hard opponent plays the Nash equilibrium found by the CFR+ algorithm, and a coach shows you how often that strategy bets, checks, calls or folds in your spot. Play chips only.',
    es: 'Jota, dama y rey: una carta para cada uno y una ronda de apuestas. Tan pequeño que se resuelve exactamente: el rival difícil juega el equilibrio de Nash que encuentra el algoritmo CFR+, y un entrenador te muestra con qué frecuencia esa estrategia apuesta, pasa, iguala o se retira en tu situación. Solo fichas de juego.',
  },
  category: 'cards',
  genre: { en: 'Poker', es: 'Póker' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: {
    label: { en: 'Fastest win (hands)', es: 'Victoria más rápida (manos)' },
    lowerIsBetter: true,
  },
  tags: ['poker', 'game theory', 'nash', 'cfr', 'cards'],
  achievements: [
    {
      id: 'first-hand',
      title: { en: 'On the Board', es: 'Primera mano' },
      description: { en: 'Win a hand.', es: 'Gana una mano.' },
    },
    {
      id: 'bluff',
      title: { en: 'Jack of All Trades', es: 'Farol con jota' },
      description: {
        en: 'Bet with the jack and make the opponent fold.',
        es: 'Apuesta con la jota y haz que el rival se retire.',
      },
    },
    {
      id: 'hero-call',
      title: { en: 'Hero Call', es: 'Igualada heroica' },
      description: {
        en: 'Call a bet with the queen and win the showdown.',
        es: 'Iguala una apuesta con la dama y gana el enfrentamiento.',
      },
    },
    {
      id: 'match',
      title: { en: 'Match Winner', es: 'Partida ganada' },
      description: { en: 'Win a match.', es: 'Gana una partida.' },
    },
    {
      id: 'beat-nash',
      title: { en: 'Beat the Equilibrium', es: 'Batir el equilibrio' },
      description: {
        en: 'Win a match against Nash (luck helps).',
        es: 'Gana una partida contra Nash (la suerte ayuda).',
      },
    },
  ],
};
