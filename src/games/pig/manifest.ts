import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'pig',
  number: 152,
  title: { en: 'Pig', es: 'Cerdo' },
  tagline: {
    en: 'Roll or hold? The purest push-your-luck dice game — against an opponent that plays it perfectly.',
    es: '¿Tirar o plantarse? El juego de dados de suerte más puro, contra un rival que lo juega a la perfección.',
  },
  description: {
    en: 'Pig to 100 with one die: keep rolling to build your turn total or hold to bank it, and a 1 loses it all. The game is solved by value iteration, so the Perfect opponent always makes the best choice, the hints show it, and they tell you your exact chance of winning. Or play the hold-at-20 rule of thumb, or a friend.',
    es: 'Cerdo a 100 con un dado: sigue tirando para aumentar el total del turno o plántate para guardarlo, y un 1 lo pierde todo. El juego está resuelto por iteración de valor, así que el rival Perfecto siempre elige lo mejor, las pistas lo muestran y te dicen tu probabilidad exacta de ganar. O juega contra la regla práctica de plantarse con 20, o contra alguien.',
  },
  category: 'dice',
  genre: { en: 'Dice game', es: 'Juego de dados' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Margin', es: 'Margen' } },
  tags: ['dice', 'push-your-luck', 'solved', 'two-player', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Home to 100', es: 'Hasta 100' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Beat Perfection', es: 'Vence a la perfección' },
      description: { en: 'Beat the Perfect opponent.', es: 'Vence al rival Perfecto.' },
    },
    {
      id: 'shutout',
      title: { en: 'Hog-Tied', es: 'Sin dejar un punto' },
      description: {
        en: 'Win before the computer banks a point.',
        es: 'Gana antes de que el ordenador guarde un punto.',
      },
    },
    {
      id: 'greedy',
      title: { en: 'Greedy Pig', es: 'Cerdo glotón' },
      description: { en: 'Bank a turn of 40 or more.', es: 'Guarda un turno de 40 o más.' },
    },
  ],
};
