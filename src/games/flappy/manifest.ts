import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'flappy',
  number: 183,
  title: { en: 'Puffin Flap', es: 'Aleteo de frailecillo' },
  tagline: {
    en: 'One button, one puffin, endless sea stacks.',
    es: 'Un botón, un frailecillo y farallones sin fin.',
  },
  description: {
    en: 'A one-button flying game with an original puffin: each tap is a flap, gravity does the rest. Thread the gaps between scrolling sea stacks for a point each; the gaps narrow after 25 and the stacks speed up after 50. Tap the screen, press Space or the flap button; watch an AI flyer that only plans with what it can see.',
    es: 'Un juego de vuelo de un solo botón con un frailecillo original: cada toque es un aleteo y la gravedad hace el resto. Pasa por los huecos entre los farallones que se desplazan y gana un punto por cada uno; los huecos se estrechan a partir de 25 y los farallones aceleran a partir de 50. Toca la pantalla, pulsa Espacio o el botón de aletear; mira a una IA que solo planifica con lo que ve.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'one-button', 'flying'],
  achievements: [
    {
      id: 'ten',
      title: { en: 'Taking Off', es: 'Despegue' },
      description: { en: 'Pass 10 sea stacks.', es: 'Supera 10 farallones.' },
    },
    {
      id: 'twentyfive',
      title: { en: 'Sea Breeze', es: 'Brisa marina' },
      description: { en: 'Pass 25 sea stacks.', es: 'Supera 25 farallones.' },
    },
    {
      id: 'fifty',
      title: { en: 'Storm Rider', es: 'Jinete de tormentas' },
      description: { en: 'Pass 50 sea stacks.', es: 'Supera 50 farallones.' },
    },
    {
      id: 'hundred',
      title: { en: 'Ocean Crossing', es: 'Travesía oceánica' },
      description: { en: 'Pass 100 sea stacks.', es: 'Supera 100 farallones.' },
    },
  ],
};
