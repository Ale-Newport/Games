import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'asteroids',
  number: 171,
  title: { en: 'Space Rocks', es: 'Rocas espaciales' },
  tagline: {
    en: 'Drift, turn and blast rocks that split into smaller, faster ones.',
    es: 'Derrapa, gira y dispara a rocas que se parten en otras más pequeñas y rápidas.',
  },
  description: {
    en: 'A vector space shooter on a wrap-around field, in the mould of the classic rock-blasting arcade games, with its own name and art: a ship with momentum, rocks that split in three sizes, saucers that shoot back, and a risky hyperspace jump.',
    es: 'Un matamarcianos vectorial en un campo que da la vuelta por los bordes, al estilo de los clásicos de destrozar rocas, con nombre y gráficos propios: una nave con inercia, rocas que se parten en tres tamaños, platillos que disparan y un salto al hiperespacio arriesgado.',
  },
  category: 'arcade',
  genre: { en: 'Shooter', es: 'Matamarcianos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'shooter', 'vector'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Rock Breaker', es: 'Rompe rocas' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'field',
      title: { en: 'Clear Skies', es: 'Cielo despejado' },
      description: { en: 'Clear a field.', es: 'Despeja un campo.' },
    },
    {
      id: 'deep',
      title: { en: 'Deep Space', es: 'Espacio profundo' },
      description: { en: 'Reach field 5.', es: 'Llega al campo 5.' },
    },
    {
      id: 'score',
      title: { en: 'Ten Thousand', es: 'Diez mil' },
      description: { en: 'Score 10 000 points.', es: 'Consigue 10 000 puntos.' },
    },
  ],
};
