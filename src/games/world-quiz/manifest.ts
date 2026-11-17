import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'world-quiz',
  number: 205,
  title: { en: 'World Quiz', es: 'Test del mundo' },
  tagline: {
    en: 'Can you name all 196 countries in 15 minutes? Maps, capitals and flags against the clock.',
    es: '¿Sabes nombrar los 196 países en 15 minutos? Mapas, capitales y banderas contrarreloj.',
  },
  description: {
    en: 'The classic geography challenges: type every country of the world or of a continent and watch the map fill in, click countries as they are named, name capitals from their countries and countries from their flags, and list the most populous and largest nations. Answers are accepted as you type, in English or Spanish, on real Natural Earth maps.',
    es: 'Los retos clásicos de geografía: escribe todos los países del mundo o de un continente y mira cómo se rellena el mapa, haz clic en los países según se nombran, nombra capitales a partir de su país y países a partir de su bandera, y enumera los países más poblados y más grandes. Las respuestas se aceptan al escribirlas, en inglés o español, sobre mapas reales de Natural Earth.',
  },
  category: 'viral',
  genre: { en: 'Geography quiz', es: 'Test de geografía' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Best %', es: 'Mejor %' } },
  tags: ['jetpunk', 'geography', 'countries', 'capitals', 'flags', 'map', 'quiz', 'spanish'],
  achievements: [
    {
      id: 'first-quiz',
      title: { en: 'Explorer', es: 'Explorador' },
      description: { en: 'Finish a quiz.', es: 'Termina un test.' },
    },
    {
      id: 'perfect',
      title: { en: 'Cartographer', es: 'Cartógrafo' },
      description: { en: 'Get 100% on a quiz.', es: 'Saca un 100 % en un test.' },
    },
    {
      id: 'hundred',
      title: { en: 'Century', es: 'Centenario' },
      description: {
        en: 'Name 100 countries of the world in one try.',
        es: 'Nombra 100 países del mundo en un intento.',
      },
    },
    {
      id: 'whole-world',
      title: { en: 'The Whole World', es: 'El mundo entero' },
      description: {
        en: 'Name every country of the world.',
        es: 'Nombra todos los países del mundo.',
      },
    },
    {
      id: 'flag-master',
      title: { en: 'Flag Master', es: 'Maestro de banderas' },
      description: {
        en: 'Name every flag of the world.',
        es: 'Nombra todas las banderas del mundo.',
      },
    },
    {
      id: 'sharp-shooter',
      title: { en: 'Sharp Shooter', es: 'Puntería' },
      description: {
        en: 'Finish a map-click quiz without a wrong click.',
        es: 'Termina un test de mapa sin fallar un clic.',
      },
    },
    {
      id: 'six-continents',
      title: { en: 'Six Continents', es: 'Seis continentes' },
      description: {
        en: 'Get 100% on the countries of every continent.',
        es: 'Saca un 100 % en los países de cada continente.',
      },
    },
  ],
};
