import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'crossing',
  number: 178,
  title: { en: 'Hedgehog Crossing', es: 'El cruce del erizo' },
  tagline: {
    en: 'Cross the road, ride the river and fill all five burrows.',
    es: 'Cruza la carretera, navega el río y llena las cinco madrigueras.',
  },
  description: {
    en: 'A crossing arcade game with an original hedgehog: hop over a busy road, then ride logs and turtles (some of which dive) across a river into the five burrows in the hedge, each within thirty seconds. Fill all five for a bonus and a faster level; a beetle in a burrow is worth extra. Arrow keys or the touch pad, and a planning AI to watch.',
    es: 'Un arcade de cruzar con un erizo original: salta una carretera llena de tráfico y luego viaja sobre troncos y tortugas (algunas se sumergen) por el río hasta las cinco madrigueras del seto, cada vez en menos de treinta segundos. Llena las cinco para ganar una bonificación y pasar a un nivel más rápido; un escarabajo en una madriguera vale más. Flechas o panel táctil, y una IA que planifica para mirar.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'crossing', 'timing'],
  achievements: [
    {
      id: 'home',
      title: { en: 'Home Safe', es: 'A salvo en casa' },
      description: { en: 'Reach a burrow.', es: 'Llega a una madriguera.' },
    },
    {
      id: 'beetle',
      title: { en: 'Snack Time', es: 'Hora del tentempié' },
      description: {
        en: 'Reach the burrow with a beetle in it.',
        es: 'Llega a la madriguera con un escarabajo.',
      },
    },
    {
      id: 'level',
      title: { en: 'Full House', es: 'Casa llena' },
      description: { en: 'Fill all five burrows.', es: 'Llena las cinco madrigueras.' },
    },
    {
      id: 'score',
      title: { en: 'High Scorer', es: 'Gran puntuación' },
      description: { en: 'Score 5000 points.', es: 'Consigue 5000 puntos.' },
    },
  ],
};
