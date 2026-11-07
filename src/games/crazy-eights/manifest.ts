import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'crazy-eights',
  number: 99,
  title: { en: 'Crazy Eights', es: 'Ochos locos' },
  tagline: {
    en: 'Match suit or rank, play eights to switch suits, and go out first — against up to three AIs.',
    es: 'Iguala palo o número, juega ochos para cambiar de palo y quédate sin cartas el primero, contra hasta tres IA.',
  },
  description: {
    en: 'The classic shedding game: follow the suit or the rank of the top card, play an eight to name a new suit, draw when you are stuck. Going out scores the cards left in the other hands. The Hard opponent remembers which suit you could not follow and keeps you on it.',
    es: 'El clásico juego de descarte: sigue el palo o el número de la carta de arriba, juega un ocho para nombrar un palo nuevo y roba cuando no puedas. Quien se queda sin cartas suma las que quedan en las otras manos. El rival difícil recuerda qué palo no pudiste seguir y te lo mantiene.',
  },
  category: 'cards',
  genre: { en: 'Shedding', es: 'Descarte' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Final score', es: 'Puntuación final' } },
  tags: ['crazy eights', 'shedding', 'cards'],
  achievements: [
    {
      id: 'out',
      title: { en: 'All Gone', es: 'Sin cartas' },
      description: {
        en: 'Go out first in a hand.',
        es: 'Quédate sin cartas el primero en una mano.',
      },
    },
    {
      id: 'eight-finish',
      title: { en: 'Crazy Finish', es: 'Final loco' },
      description: { en: 'Go out with an eight.', es: 'Termina con un ocho.' },
    },
    {
      id: 'big-hand',
      title: { en: 'Big Haul', es: 'Gran botín' },
      description: { en: 'Score 50 or more in one hand.', es: 'Suma 50 o más en una mano.' },
    },
    {
      id: 'match',
      title: { en: 'Hundred', es: 'Cien' },
      description: { en: 'Win a game to 100.', es: 'Gana una partida a 100.' },
    },
    {
      id: 'full-table',
      title: { en: 'Crazy Table', es: 'Mesa loca' },
      description: {
        en: 'Win against three Hard opponents.',
        es: 'Gana contra tres rivales difíciles.',
      },
    },
  ],
};
