import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'farkle',
  number: 151,
  title: { en: 'Farkle', es: 'Farkle' },
  tagline: {
    en: 'The push-your-luck dice game: bank your points or roll on — one bad roll and the turn is gone.',
    es: 'El juego de dados de tentar a la suerte: guarda tus puntos o sigue tirando; una mala tirada y adiós al turno.',
  },
  description: {
    en: 'Six dice, scoring 1s and 5s, sets, straights and pairs, hot dice, a 500-point opening and a final round at 10 000. Play solo against the clock of turns, against computer players at two levels — the hard one weighs every choice by an exact dynamic-programming value of rolling on — or with friends on one device.',
    es: 'Seis dados, unos y cincos que puntúan, tríos, escaleras y parejas, dados calientes, una apertura de 500 y una última ronda al llegar a 10 000. Juega en solitario contra el reloj de turnos, contra rivales en dos niveles —el difícil valora cada elección con el valor exacto de seguir tirando, por programación dinámica— o con amigos en un dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Dice game', es: 'Juego de dados' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['dice', 'push-your-luck', 'party', 'solo', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Ten Thousand', es: 'Diez mil' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'fast',
      title: { en: 'Quick Ten', es: 'Diez mil rápidos' },
      description: {
        en: 'Reach 10 000 solo in 20 turns or fewer.',
        es: 'Llega a 10 000 en solitario en 20 turnos o menos.',
      },
    },
    {
      id: 'beat',
      title: { en: 'Nerves of Steel', es: 'Nervios de acero' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'clean',
      title: { en: 'No Farkle', es: 'Sin farkle' },
      description: { en: 'Win without a single farkle.', es: 'Gana sin un solo farkle.' },
    },
  ],
};
