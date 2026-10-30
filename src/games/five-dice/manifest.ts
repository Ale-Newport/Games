import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'five-dice',
  number: 149,
  title: { en: 'Five Dice', es: 'Cinco dados' },
  tagline: {
    en: 'The scorecard dice classic: three rolls a turn, thirteen boxes, and the chase for five of a kind.',
    es: 'El clásico de dados con hoja de puntos: tres tiradas por turno, trece casillas y la caza de los cinco iguales.',
  },
  description: {
    en: 'Five dice, up to three rolls a turn holding what you like, and a card of thirteen boxes: the six faces with a 35-point bonus at 63, three and four of a kind, full house, small and large straights, five of a kind with 100-point extras and the joker rule, and chance. Play solo for a high score, against computer players that plan every roll exactly, or with friends on one device.',
    es: 'Cinco dados, hasta tres tiradas por turno guardando los que quieras, y una hoja de trece casillas: las seis caras con un bono de 35 al llegar a 63, trío y póquer, full, escaleras corta y larga, cinco iguales con extras de 100 y regla de comodín, y suerte. Juega solo por la mejor puntuación, contra rivales que planifican cada tirada con exactitud o con amigos en un dispositivo.',
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
  tags: ['dice', 'scorecard', 'family', 'solo', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Full Card', es: 'Hoja completa' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'score250',
      title: { en: 'Two Hundred Fifty', es: 'Doscientos cincuenta' },
      description: { en: 'Score 250 points or more.', es: 'Consigue 250 puntos o más.' },
    },
    {
      id: 'fiveKind',
      title: { en: 'Five Alike', es: 'Cinco iguales' },
      description: { en: 'Score 50 in the five-of-a-kind box.', es: 'Anota 50 en cinco iguales.' },
    },
    {
      id: 'beat',
      title: { en: 'Beat the Planner', es: 'Vence al planificador' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
  ],
};
