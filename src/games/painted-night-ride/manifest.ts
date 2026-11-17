import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'painted-night-ride',
  number: 230,
  title: { en: 'Painted Night Ride', es: 'Paseo nocturno pintado' },
  tagline: {
    en: 'Cycle through a swirling, painted night and carry stars back to the steeple.',
    es: 'Pedalea por una noche pintada de remolinos y lleva estrellas al campanario.',
  },
  description: {
    en: 'A calm 3D bicycle ride through a night painted in thick, swirling brush strokes — moonlit hills, flame-like cypresses and a sleeping village. Gather glowing star orbs (some need a leap), deliver them to the church steeple to fill the sky with new stars, spin tricks in the air, or get off and walk. Starlight, Constellation and Free ride modes.',
    es: 'Un tranquilo paseo en bicicleta en 3D por una noche pintada con pinceladas gruesas y arremolinadas: colinas bajo la luna, cipreses como llamas y una aldea dormida. Reúne orbes de estrella (algunos exigen saltar), llévalos al campanario para llenar el cielo de estrellas nuevas, haz piruetas en el aire o bájate a caminar. Modos Luz de estrellas, Constelación y Paseo libre.',
  },
  category: 'viral',
  genre: { en: 'Exploration', es: 'Exploración' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['3d', 'exploration', 'relaxing', 'art'],
  achievements: [
    {
      id: 'first-star',
      title: { en: 'First Light', es: 'Primera luz' },
      description: {
        en: 'Deliver an orb to the steeple.',
        es: 'Entrega un orbe en el campanario.',
      },
    },
    {
      id: 'spin',
      title: { en: 'Pirouette', es: 'Pirueta' },
      description: { en: 'Land a full spin.', es: 'Aterriza un giro completo.' },
    },
    {
      id: 'double',
      title: { en: 'Double Pirouette', es: 'Doble pirueta' },
      description: { en: 'Land a double spin.', es: 'Aterriza un giro doble.' },
    },
    {
      id: 'starlight',
      title: { en: 'Starry Sky', es: 'Cielo estrellado' },
      description: { en: 'Finish Starlight.', es: 'Termina Luz de estrellas.' },
    },
    {
      id: 'constellation',
      title: { en: 'Constellation', es: 'Constelación' },
      description: { en: 'Finish Constellation.', es: 'Termina Constelación.' },
    },
    {
      id: 'quick',
      title: { en: 'Shooting Star', es: 'Estrella fugaz' },
      description: {
        en: 'Finish Starlight in under 3 minutes.',
        es: 'Termina Luz de estrellas en menos de 3 minutos.',
      },
    },
  ],
};
