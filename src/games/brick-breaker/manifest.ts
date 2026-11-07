import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'brick-breaker',
  number: 168,
  title: { en: 'Enhanced Brick Breaker', es: 'Rompeladrillos mejorado' },
  tagline: {
    en: 'Tough bricks, gold blocks and power capsules across five walls.',
    es: 'Ladrillos duros, bloques de oro y cápsulas de poder en cinco muros.',
  },
  description: {
    en: 'A brick breaker with five designed walls: bricks that take one, two or three hits (marked by colour and number), unbreakable gold blocks, and capsules from broken bricks — Wide paddle, Multi-ball, Slow, Laser and an extra life. Three lives, keys, touch or a finger on the field.',
    es: 'Un rompeladrillos con cinco muros diseñados: ladrillos de uno, dos o tres golpes (marcados por color y número), bloques de oro irrompibles y cápsulas de los ladrillos rotos: pala Ancha, Multibola, Lenta, Láser y una vida extra. Tres vidas, teclas, táctil o el dedo sobre el campo.',
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
      title: { en: 'First Wall', es: 'Primer muro' },
      description: { en: 'Clear the first wall.', es: 'Limpia el primer muro.' },
    },
    {
      id: 'capsules',
      title: { en: 'Collector', es: 'Coleccionista' },
      description: { en: 'Catch a capsule.', es: 'Atrapa una cápsula.' },
    },
    {
      id: 'all',
      title: { en: 'All Five', es: 'Los cinco' },
      description: { en: 'Clear all five walls.', es: 'Limpia los cinco muros.' },
    },
    {
      id: 'score',
      title: { en: 'High Scorer', es: 'Gran puntuación' },
      description: { en: 'Score 1500 points.', es: 'Consigue 1500 puntos.' },
    },
  ],
};
