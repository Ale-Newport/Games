import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'endless-runner',
  number: 196,
  title: { en: 'Rooftop Dash', es: 'Carrera por los tejados' },
  tagline: {
    en: 'Jump the gaps, slide under the drones, never stop running.',
    es: 'Salta los huecos, deslízate bajo los drones y no dejes de correr.',
  },
  description: {
    en: 'An endless runner with an original name and look: a courier runs across the city rooftops on her own, faster and faster; you only jump and slide. Clear the gaps between buildings and the chimneys, slide under the delivery drones (or jump them), and grab coins for ten points each. Hold the jump for a higher leap; slide in mid-air to drop fast. Space or ↑ jumps, ↓ slides; on a phone, touch high to jump and low to slide. Watch an AI runner that plans a second ahead.',
    es: 'Un juego de correr sin fin con nombre y aspecto originales: una mensajera corre sola por los tejados de la ciudad, cada vez más deprisa; tú solo saltas y te deslizas. Supera los huecos entre edificios y las chimeneas, deslízate bajo los drones de reparto (o sáltalos) y coge monedas, que valen diez puntos. Mantén el salto para llegar más alto; deslízate en el aire para caer rápido. Espacio o ↑ saltan y ↓ desliza; en el móvil, toca arriba para saltar y abajo para deslizarte. Mira a una IA que planifica con un segundo de antelación.',
  },
  category: 'arcade',
  genre: { en: 'Runner', es: 'Correr sin fin' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'runner', 'endless'],
  achievements: [
    {
      id: 'm500',
      title: { en: 'Warming Up', es: 'Calentando' },
      description: { en: 'Run 500 m.', es: 'Corre 500 m.' },
    },
    {
      id: 'm2000',
      title: { en: 'Across Town', es: 'De punta a punta' },
      description: { en: 'Run 2000 m in one go.', es: 'Corre 2000 m de una vez.' },
    },
    {
      id: 'coins',
      title: { en: 'Pocketful', es: 'Bolsillos llenos' },
      description: { en: 'Collect 50 coins in one run.', es: 'Coge 50 monedas en una carrera.' },
    },
    {
      id: 'score',
      title: { en: 'Star Courier', es: 'Mensajera estrella' },
      description: { en: 'Score 5000 points.', es: 'Consigue 5000 puntos.' },
    },
  ],
};
