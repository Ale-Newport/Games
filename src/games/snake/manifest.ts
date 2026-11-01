import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'snake',
  number: 172,
  title: { en: 'Classic Snake', es: 'Serpiente clásica' },
  tagline: {
    en: 'Eat, grow, speed up — and keep clear of the walls and your own tail.',
    es: 'Come, crece, acelera, y aléjate de las paredes y de tu propia cola.',
  },
  description: {
    en: 'The snake game on a walled 20 × 20 grid: every apple makes you longer and, every few apples, faster. Touch a wall or your own body and the run is over. Turn with the arrow keys or the touch pad, and watch a path-finding AI play.',
    es: 'El juego de la serpiente en una cuadrícula de 20 × 20 con paredes: cada manzana te alarga y, cada pocas, te acelera. Si tocas una pared o tu cuerpo, se acabó. Gira con las flechas o el panel táctil, y mira jugar a una IA que busca caminos.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'snake', 'grid'],
  achievements: [
    {
      id: 'first',
      title: { en: 'First Bite', es: 'Primer bocado' },
      description: { en: 'Eat an apple.', es: 'Cómete una manzana.' },
    },
    {
      id: 'twenty',
      title: { en: 'Growing', es: 'Creciendo' },
      description: { en: 'Reach length 20.', es: 'Llega a longitud 20.' },
    },
    {
      id: 'fifty',
      title: { en: 'Long Snake', es: 'Serpiente larga' },
      description: { en: 'Reach length 50.', es: 'Llega a longitud 50.' },
    },
    {
      id: 'score',
      title: { en: 'Snake Charmer', es: 'Encantador' },
      description: { en: 'Score 1000 points.', es: 'Consigue 1000 puntos.' },
    },
  ],
};
