import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'vertical-jumper',
  number: 197,
  title: { en: 'Cloud Climber', es: 'Escaladora de nubes' },
  tagline: {
    en: 'Bounce from cloud to cloud, as high as the sky goes.',
    es: 'Rebota de nube en nube, tan alto como llegue el cielo.',
  },
  description: {
    en: 'A vertical jumping game with an original name and look: a little climber bounces by herself every time she lands on a cloud, and you steer her left and right — the sides wrap round. Higher up, clouds drift, thin clouds burst without a bounce, springs launch her and storm sprites patrol: land on one to pop it, touch it any other way and the climb is over. Drop below the view and you fall. Arrows, the pad, or point where to go; watch an AI that plans each bounce.',
    es: 'Un juego de saltos hacia arriba con nombre y aspecto originales: una pequeña escaladora rebota sola cada vez que cae en una nube y tú la guías a izquierda y derecha; los lados se conectan. Más arriba, las nubes se desplazan, las nubes finas se deshacen sin rebote, los muelles la lanzan y patrullan duendes de tormenta: cae encima de uno para hacerlo estallar; si lo tocas de otra forma, se acabó. Si caes por debajo de la vista, pierdes. Flechas, el panel o señala adónde ir; mira a una IA que planifica cada rebote.',
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
  scoring: { label: { en: 'Height (m)', es: 'Altura (m)' } },
  tags: ['arcade', 'real-time', 'jumping', 'endless'],
  achievements: [
    {
      id: 'spring',
      title: { en: 'Boing', es: 'Boing' },
      description: { en: 'Bounce off a spring.', es: 'Rebota en un muelle.' },
    },
    {
      id: 'pop',
      title: { en: 'Storm Breaker', es: 'Rompetormentas' },
      description: { en: 'Pop a storm sprite.', es: 'Haz estallar un duende de tormenta.' },
    },
    {
      id: 'm500',
      title: { en: 'Above the Rooftops', es: 'Por encima de los tejados' },
      description: { en: 'Climb 500 m.', es: 'Sube 500 m.' },
    },
    {
      id: 'm2000',
      title: { en: 'Edge of Space', es: 'Al borde del espacio' },
      description: { en: 'Climb 2000 m.', es: 'Sube 2000 m.' },
    },
  ],
};
