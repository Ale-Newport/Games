import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'centipede',
  number: 186,
  title: { en: 'Garden Guard', es: 'Guardián del huerto' },
  tagline: {
    en: 'Squirt the caterpillar winding down through the garden, one segment at a time.',
    es: 'Moja a la oruga que baja serpenteando por el huerto, segmento a segmento.',
  },
  description: {
    en: 'A crawler shooter with an original name and look: a twelve-segment caterpillar winds down through a garden of stones, turning at every stone and edge. Squirt it from your patch at the bottom — each hit segment becomes a stone and splits the caterpillar in two. Mind the zigzagging beetle and the falling acorns. Arrows and Space, or hold a finger to walk and squirt; watch an AI gardener.',
    es: 'Un juego de disparos con nombre y aspecto originales: una oruga de doce segmentos baja serpenteando por un huerto lleno de piedras, girando en cada piedra y en cada borde. Mójala desde tu parcela de abajo: cada segmento alcanzado se convierte en piedra y parte la oruga en dos. Cuidado con el escarabajo que zigzaguea y con las bellotas que caen. Flechas y Espacio, o mantén un dedo para andar y regar; mira a un jardinero de la IA.',
  },
  category: 'arcade',
  genre: { en: 'Shooter', es: 'Disparos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'shooter', 'garden'],
  achievements: [
    {
      id: 'head',
      title: { en: 'Heads Up', es: 'Cabeza abajo' },
      description: { en: 'Hit a caterpillar’s head.', es: 'Acierta en la cabeza de una oruga.' },
    },
    {
      id: 'beetle',
      title: { en: 'Pest Control', es: 'Control de plagas' },
      description: { en: 'Hit the beetle.', es: 'Acierta al escarabajo.' },
    },
    {
      id: 'wave',
      title: { en: 'Clean Patch', es: 'Parcela limpia' },
      description: { en: 'Clear a whole caterpillar.', es: 'Acaba con una oruga entera.' },
    },
    {
      id: 'score',
      title: { en: 'Head Gardener', es: 'Jardinero jefe' },
      description: { en: 'Score 15 000 points.', es: 'Consigue 15 000 puntos.' },
    },
  ],
};
