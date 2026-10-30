import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'parchis',
  number: 147,
  title: { en: 'Parchís', es: 'Parchís' },
  tagline: {
    en: "Spain's race game: out on a five, barriers that block the road, and bonus moves for every capture.",
    es: 'El juego de carreras de España: se sale con cinco, las barreras cortan el paso y cada captura da premio.',
  },
  description: {
    en: 'The Spanish cousin of Pachisi on the 68-square cross: a 5 brings a pawn out (and must, when it can), sixes roll again and count seven once all pawns are out, three sixes send the last pawn home, two pawns together make a barrier no one can pass, twelve safe squares, and bonus moves of 20 for a capture and 10 for a pawn home. Two to four players against the computer, on one device, or watch the AI.',
    es: 'El primo español del pachisi en la cruz de 68 casillas: un 5 saca una ficha (y obliga, si se puede), los seises repiten y cuentan siete con todas fuera, tres seises mandan a casa la última ficha, dos fichas juntas forman una barrera que nadie pasa, doce seguros, y premios de 20 por comer y 10 por llegar a la meta. De dos a cuatro jugadores contra el ordenador, en un dispositivo o mirando a la IA.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pawns home', es: 'Fichas en la meta' } },
  tags: ['dice', 'race', 'family', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'To the Goal', es: 'A la meta' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Kitchen-Table Champion', es: 'Campeón de sobremesa' },
      description: {
        en: 'Win against hard computer players.',
        es: 'Gana contra rivales difíciles.',
      },
    },
    {
      id: 'four',
      title: { en: 'Four at the Table', es: 'Cuatro a la mesa' },
      description: {
        en: 'Win a four-player game against the computer.',
        es: 'Gana una partida a cuatro contra el ordenador.',
      },
    },
    {
      id: 'hunter',
      title: { en: 'Eats Twenty', es: 'Me como una y cuento veinte' },
      description: {
        en: 'Win after capturing at least three pawns.',
        es: 'Gana tras comerte al menos tres fichas.',
      },
    },
  ],
};
