import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hearts',
  number: 93,
  title: { en: 'Hearts', es: 'Corazones' },
  tagline: {
    en: 'Dodge the hearts and the queen of spades — or shoot the moon — against three AI players.',
    es: 'Esquiva los corazones y la reina de picas, o dispara a la luna, contra tres jugadores de IA.',
  },
  description: {
    en: 'The classic four-player trick-taking game: pass three cards, follow suit, and avoid taking hearts (1 point each) and the queen of spades (13). Take all of them to shoot the moon. The Hard opponents simulate the rest of the hand over possible deals of the cards they cannot see.',
    es: 'El clásico juego de bazas para cuatro: pasa tres cartas, sigue el palo y evita llevarte corazones (1 punto cada uno) y la reina de picas (13). Llévatelos todos para disparar a la luna. Los rivales difíciles simulan el resto de la mano sobre repartos posibles de las cartas que no ven.',
  },
  category: 'cards',
  genre: { en: 'Trick-taking', es: 'Bazas' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Final score', es: 'Puntuación final' }, lowerIsBetter: true },
  tags: ['hearts', 'trick-taking', 'cards'],
  achievements: [
    {
      id: 'clean-hand',
      title: { en: 'Clean Hands', es: 'Manos limpias' },
      description: { en: 'Finish a hand without a point.', es: 'Termina una mano sin puntos.' },
    },
    {
      id: 'queen-dump',
      title: { en: 'Special Delivery', es: 'Envío especial' },
      description: {
        en: 'Play the queen of spades on a trick someone else takes.',
        es: 'Juega la reina de picas en una baza que se lleve otro.',
      },
    },
    {
      id: 'moon',
      title: { en: 'Shoot the Moon', es: 'Disparar a la luna' },
      description: {
        en: 'Take all 26 points in a hand.',
        es: 'Llévate los 26 puntos de una mano.',
      },
    },
    {
      id: 'win-game',
      title: { en: 'Lowest Wins', es: 'Gana el más bajo' },
      description: { en: 'Win a game.', es: 'Gana una partida.' },
    },
    {
      id: 'win-hard',
      title: { en: 'Heartbreaker', es: 'Rompecorazones' },
      description: {
        en: 'Win a game against Hard opponents.',
        es: 'Gana una partida contra rivales difíciles.',
      },
    },
  ],
};
