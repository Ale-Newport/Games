import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'cribbage',
  number: 97,
  title: { en: 'Cribbage', es: 'Cribbage' },
  tagline: {
    en: 'Fifteen two, fifteen four — peg to 31 and count your hand on the way to 121.',
    es: 'Quince dos, quince cuatro: anota hasta 31 y cuenta tu mano camino de 121.',
  },
  description: {
    en: 'The classic two-player counting game: throw two cards to the crib, peg fifteens, pairs and runs while the count climbs to 31, then score your hand and crib with the starter. The Hard opponent averages every possible starter before it throws and weighs your replies when it pegs.',
    es: 'El clásico juego de contar para dos: echa dos cartas a la cuna, anota quinces, parejas y escaleras mientras la cuenta sube hasta 31 y luego puntúa tu mano y la cuna con el corte. El rival difícil promedia todos los cortes posibles antes de descartar y sopesa tus respuestas al anotar.',
  },
  category: 'cards',
  genre: { en: 'Counting', es: 'Conteo' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Winning margin', es: 'Margen de victoria' } },
  tags: ['cribbage', 'counting', 'cards'],
  achievements: [
    {
      id: 'thirty-one',
      title: { en: 'Thirty-One', es: 'Treinta y uno' },
      description: { en: 'Peg 31 exactly.', es: 'Llega a 31 exactos.' },
    },
    {
      id: 'pair-royal',
      title: { en: 'Pair Royal', es: 'Trío real' },
      description: {
        en: 'Peg 6 or more with one card.',
        es: 'Anota 6 o más con una sola carta.',
      },
    },
    {
      id: 'big-hand',
      title: { en: 'Big Hand', es: 'Mano grande' },
      description: { en: 'Score 16 or more in a hand.', es: 'Suma 16 o más en una mano.' },
    },
    {
      id: 'match',
      title: { en: '121', es: '121' },
      description: { en: 'Win a game.', es: 'Gana una partida.' },
    },
    {
      id: 'skunk',
      title: { en: 'Skunk', es: 'Paliza' },
      description: {
        en: 'Win with the opponent below 91.',
        es: 'Gana con el rival por debajo de 91.',
      },
    },
    {
      id: 'match-hard',
      title: { en: 'Cribbage Master', es: 'Maestro del cribbage' },
      description: { en: 'Win a game against Hard.', es: 'Gana una partida contra Difícil.' },
    },
  ],
};
