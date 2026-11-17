import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'higher-lower',
  number: 225,
  title: { en: 'Higher or Lower', es: 'Más o menos' },
  tagline: {
    en: 'Which has more people, which summit is taller, which animal is heavier? Keep the streak.',
    es: '¿Cuál tiene más habitantes, qué cumbre es más alta, qué animal pesa más? Mantén la racha.',
  },
  description: {
    en: 'The classic streak game of comparisons: one card shows its number, you guess whether the next is higher or lower. Real figures for country populations and areas, mountain heights, river lengths and animal weights, plus a mix mode, with flags, a count-up reveal and best scores per category.',
    es: 'El clásico juego de rachas comparando: una carta muestra su número y adivinas si la siguiente es mayor o menor. Cifras reales de población y superficie de países, altura de montañas, longitud de ríos y peso de animales, más un modo mezcla, con banderas, revelado con contador y récords por categoría.',
  },
  category: 'viral',
  genre: { en: 'Trivia', es: 'Preguntas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Streak', es: 'Racha' } },
  tags: ['trivia', 'geography', 'numbers', 'streak'],
  achievements: [
    {
      id: 'score-10',
      title: { en: 'On a Roll', es: 'Racha' },
      description: { en: 'Score 10 in a run.', es: 'Consigue 10 en una partida.' },
    },
    {
      id: 'score-25',
      title: { en: 'Number Sense', es: 'Olfato numérico' },
      description: { en: 'Score 25 in a run.', es: 'Consigue 25 en una partida.' },
    },
    {
      id: 'score-50',
      title: { en: 'Walking Almanac', es: 'Almanaque andante' },
      description: { en: 'Score 50 in a run.', es: 'Consigue 50 en una partida.' },
    },
    {
      id: 'mix-20',
      title: { en: 'Jack of All Trades', es: 'Todoterreno' },
      description: { en: 'Score 20 in Mix.', es: 'Consigue 20 en Mezcla.' },
    },
    {
      id: 'all-categories',
      title: { en: 'Well Rounded', es: 'Completo' },
      description: {
        en: 'Score 10 in every category.',
        es: 'Consigue 10 en todas las categorías.',
      },
    },
  ],
};
