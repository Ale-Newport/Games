import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sprouts',
  number: 51,
  title: { en: 'Sprouts', es: 'Sprouts' },
  tagline: {
    en: 'Draw curves between spots, grow a new spot on each — and draw the last one.',
    es: 'Traza curvas entre puntos, añade un punto en cada una y traza la última.',
  },
  description: {
    en: 'Start with 3 to 5 spots. Draw a curve joining two spots (or a spot to itself) without crossing any curve, then a new spot appears on it. No spot may have more than three curve ends. Whoever cannot draw loses. Draw with your finger or mouse, or tap two spots.',
    es: 'Empieza con 3 a 5 puntos. Traza una curva que una dos puntos (o un punto consigo mismo) sin cruzar ninguna curva y aparecerá un punto nuevo sobre ella. Ningún punto puede tener más de tres extremos de curva. Pierde quien no puede trazar. Dibuja con el dedo o el ratón, o toca dos puntos.',
  },
  category: 'strategy',
  genre: { en: 'Pencil and paper', es: 'Lápiz y papel' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['sprouts', 'topology', 'pencil and paper', 'drawing'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Shoots', es: 'Primeros brotes' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Green Thumb', es: 'Buena mano' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Topologist', es: 'Topólogo' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'five-spots',
      title: { en: 'Full Bloom', es: 'En plena flor' },
      description: {
        en: 'Win against the computer starting from five spots.',
        es: 'Gana a la CPU empezando con cinco puntos.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
