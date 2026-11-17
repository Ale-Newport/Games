import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'globe-hot-cold',
  number: 212,
  title: { en: 'Hot & Cold Globe', es: 'Globo frío o caliente' },
  tagline: {
    en: 'Spin the globe and follow the heat: the closer your guess, the redder it glows.',
    es: 'Gira el globo y sigue el calor: cuanto más cerca tu intento, más rojo brilla.',
  },
  description: {
    en: 'The daily hot-and-cold geography game on a draggable 3D globe: guess any country and it lights up in a colour that shows how close its border is to the mystery country’s — from near-white far away to deep red when touching. Unlimited guesses, a closest-guess readout, guesses sorted by distance, daily and practice countries, and an AI that tracks borders.',
    es: 'El juego diario de frío o caliente en un globo 3D que se puede girar: prueba cualquier país y se ilumina con un color que indica lo cerca que está su frontera de la del país misterioso, de casi blanco si está lejos a rojo intenso si se tocan. Intentos ilimitados, el intento más cercano, lista ordenada por distancia, países diarios y de práctica, y una IA que rastrea fronteras.',
  },
  category: 'viral',
  genre: { en: 'Geography', es: 'Geografía' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['globle', 'globe', 'geography', 'hot cold', 'daily', 'map', 'spanish'],
  achievements: [
    {
      id: 'first-find',
      title: { en: 'Found on the Globe', es: 'Encontrado en el globo' },
      description: { en: 'Find a mystery country.', es: 'Encuentra un país misterioso.' },
    },
    {
      id: 'five',
      title: { en: 'Warm Hands', es: 'Manos calientes' },
      description: {
        en: 'Find it in five guesses or fewer.',
        es: 'Encuéntralo en cinco intentos o menos.',
      },
    },
    {
      id: 'three',
      title: { en: 'Red Hot', es: 'Al rojo vivo' },
      description: {
        en: 'Find it in three guesses or fewer.',
        es: 'Encuéntralo en tres intentos o menos.',
      },
    },
    {
      id: 'week',
      title: { en: 'Globetrotter', es: 'Trotamundos' },
      description: { en: 'Find seven daily countries.', es: 'Encuentra siete países diarios.' },
    },
  ],
};
