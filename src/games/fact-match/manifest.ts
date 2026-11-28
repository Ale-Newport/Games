import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'fact-match',
  number: 241,
  title: { en: 'Fact Match', es: 'Empareja datos' },
  tagline: {
    en: 'Five facts, seven true numbers, two of them decoys. Match them up in three checks.',
    es: 'Cinco datos, siete números reales, dos de ellos señuelos. Empareja en tres comprobaciones.',
  },
  description: {
    en: 'A matching puzzle over real data: one commodity’s price across five years, distances from one city, a property of five chemical elements, or one kind of world fact for five places. Seven numbers, all true — two belong to members of the same family that are not on the board. Place the numbers, check, and correct matches lock in; you have three checks, and early locks score more. Daily three boards and endless runs by difficulty and topic.',
    es: 'Un rompecabezas de emparejar con datos reales: el precio de una materia prima en cinco años, distancias desde una ciudad, una propiedad de cinco elementos químicos o un tipo de dato del mundo para cinco lugares. Siete números, todos verdaderos: dos son de miembros de la misma familia que no están en el tablero. Coloca los números, comprueba y los aciertos quedan fijados; tienes tres comprobaciones y los aciertos tempranos valen más. Tres tableros diarios y partidas sin fin por dificultad y tema.',
  },
  category: 'estimation',
  genre: { en: 'Matching puzzle', es: 'Emparejar' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'logic', 'matching', 'prices', 'geography', 'daily'],
  achievements: [
    {
      id: 'first-board',
      title: { en: 'Matched Up', es: 'Emparejado' },
      description: { en: 'Finish your first board.', es: 'Termina tu primer tablero.' },
    },
    {
      id: 'perfect',
      title: { en: 'Clean Sweep', es: 'Pleno' },
      description: {
        en: 'Lock all five facts on the first check.',
        es: 'Fija los cinco datos en la primera comprobación.',
      },
    },
    {
      id: 'close-call',
      title: { en: 'Down to the Wire', es: 'Por los pelos' },
      description: {
        en: 'Complete a board on the very last check.',
        es: 'Completa un tablero en la última comprobación.',
      },
    },
    {
      id: 'sharp',
      title: { en: 'Sharp Eye', es: 'Ojo fino' },
      description: { en: 'Score 250 or more in a daily.', es: 'Consigue 250 o más en un diario.' },
    },
    {
      id: 'week',
      title: { en: 'Daily Matcher', es: 'Emparejador diario' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
