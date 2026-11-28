import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'farmstead',
  number: 255,
  title: { en: 'Farmstead', es: 'Granja' },
  tagline: {
    en: 'Twelve rounds, one family, a muddy yard: build the farm and keep everyone fed.',
    es: 'Doce rondas, una familia y un patio embarrado: levanta la granja y que nadie pase hambre.',
  },
  description: {
    en: 'A worker-placement farming game for 2 to 4 players. Each round a new action space opens and the stacks of timber, clay, reed, food and animals grow; send your family members, one space each, to gather, plough, sow and bake, build rooms and stables, fence pastures, renovate the house, buy one of ten improvements or have children. After rounds 3, 6, 8, 10 and 12 the fields yield, every member must eat — or you beg — and animals breed. The farm is scored on fields, pastures, crops, animals, house, family and improvements, with points lost for every empty square. Play against farmhands or stewards, or everyone on one device.',
    es: 'Un juego de colocación de trabajadores sobre una granja para 2 a 4 jugadores. Cada ronda se abre un espacio de acción nuevo y crecen los montones de madera, arcilla, junco, comida y animales; manda a los miembros de tu familia, uno por espacio, a recoger, arar, sembrar y hornear, construir habitaciones y establos, vallar pastos, reformar la casa, comprar una de diez mejoras o tener hijos. Tras las rondas 3, 6, 8, 10 y 12 dan fruto los campos, cada miembro debe comer —o mendigar— y se reproducen los animales. La granja puntúa por campos, pastos, cosechas, animales, casa, familia y mejoras, y resta por cada casilla vacía. Juega contra peones o mayorales, o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Worker placement', es: 'Colocación de trabajadores' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 40,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['board', 'worker-placement', 'farming', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Good Harvest', es: 'Buena cosecha' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'steward-win',
      title: { en: 'Master of the Land', es: 'Señor de la tierra' },
      description: { en: 'Beat the stewards.', es: 'Vence a los mayorales.' },
    },
    {
      id: 'family',
      title: { en: 'Full Table', es: 'Mesa llena' },
      description: { en: 'Have a family of four.', es: 'Ten una familia de cuatro.' },
    },
    {
      id: 'menagerie',
      title: { en: 'Menagerie', es: 'Corral completo' },
      description: {
        en: 'Keep sheep, pigs and cows at once.',
        es: 'Ten ovejas, cerdos y vacas a la vez.',
      },
    },
    {
      id: 'stone',
      title: { en: 'Built to Last', es: 'Hecha para durar' },
      description: { en: 'Live in a stone house.', es: 'Vive en una casa de piedra.' },
    },
  ],
};
