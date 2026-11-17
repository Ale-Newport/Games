import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'breakout',
  number: 167,
  title: { en: 'Breakout', es: 'Breakout' },
  tagline: {
    en: 'Clear six walls with three balls — the paddle shrinks once you break through.',
    es: 'Limpia seis muros con tres pelotas: la pala encoge cuando abres paso.',
  },
  description: {
    en: 'The classic wall of eight coloured rows, then five more walls of original patterns — checkerboard, pyramid, window, pillars and chevrons — with three balls. Rows score 1, 3, 5 and 7 points from the bottom up, the ball quickens as it reaches the upper rows, and your paddle shrinks to half once a ball reaches the top wall. Keys, touch buttons or a finger on the field.',
    es: 'El muro clásico de ocho filas de colores y después cinco muros más con formas originales (tablero, pirámide, ventana, pilares y galones), con tres pelotas. Las filas valen 1, 3, 5 y 7 puntos de abajo arriba, la pelota se acelera al llegar a las filas altas y tu pala se reduce a la mitad cuando una pelota toca el techo. Teclas, botones táctiles o el dedo sobre el campo.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'paddle', 'bricks'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Breakthrough', es: 'Abriendo paso' },
      description: { en: 'Reach the top wall.', es: 'Llega al techo.' },
    },
    {
      id: 'wall',
      title: { en: 'Wall Down', es: 'Muro abajo' },
      description: { en: 'Clear the first wall.', es: 'Limpia el primer muro.' },
    },
    {
      id: 'both',
      title: { en: 'Six Walls Down', es: 'Seis muros abajo' },
      description: { en: 'Clear all six walls.', es: 'Limpia los seis muros.' },
    },
    {
      id: 'perfect',
      title: { en: 'Perfect Score', es: 'Puntuación perfecta' },
      description: { en: 'Score all 1340 points.', es: 'Consigue los 1340 puntos.' },
    },
  ],
};
