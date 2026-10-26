import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'leduc-poker',
  number: 92,
  title: { en: 'Leduc Poker', es: 'Póker de Leduc' },
  tagline: {
    en: 'Six cards, a public card, two betting rounds — the research poker, against a precomputed Nash AI.',
    es: 'Seis cartas, una carta pública y dos rondas de apuestas: el póker de investigación, contra una IA de Nash precalculada.',
  },
  description: {
    en: 'Two jacks, two queens, two kings. One private card each, a round of betting, a public card, another round with doubled bets: pair the public card or hold the higher card. Small enough to solve — the Hard opponent plays a Nash equilibrium computed with CFR+, and a coach shows how often it would make each move in your place. Play chips only.',
    es: 'Dos jotas, dos damas y dos reyes. Una carta privada para cada uno, una ronda de apuestas, una carta pública y otra ronda con apuestas dobles: empareja la carta pública o ten la carta más alta. Tan pequeño que se puede resolver: el rival difícil juega un equilibrio de Nash calculado con CFR+, y un entrenador muestra con qué frecuencia haría cada jugada en tu lugar. Solo fichas de juego.',
  },
  category: 'cards',
  genre: { en: 'Poker', es: 'Póker' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: {
    label: { en: 'Fastest win (hands)', es: 'Victoria más rápida (manos)' },
    lowerIsBetter: true,
  },
  tags: ['poker', 'game theory', 'nash', 'cfr', 'leduc', 'cards'],
  achievements: [
    {
      id: 'first-hand',
      title: { en: 'On the Board', es: 'Primera mano' },
      description: { en: 'Win a hand.', es: 'Gana una mano.' },
    },
    {
      id: 'bluff',
      title: { en: 'Jack Attack', es: 'Ataque de jota' },
      description: {
        en: 'Bet or raise with a jack and make the opponent fold.',
        es: 'Apuesta o sube con una jota y haz que el rival se retire.',
      },
    },
    {
      id: 'trips',
      title: { en: 'Paired Up', es: 'Emparejado' },
      description: {
        en: 'Win a showdown by pairing the public card.',
        es: 'Gana un enfrentamiento emparejando la carta pública.',
      },
    },
    {
      id: 'big-pot',
      title: { en: 'Big Pot', es: 'Bote grande' },
      description: {
        en: 'Win 10 chips or more in one hand.',
        es: 'Gana 10 fichas o más en una mano.',
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
