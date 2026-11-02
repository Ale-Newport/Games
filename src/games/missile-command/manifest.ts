import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'missile-command',
  number: 185,
  title: { en: 'City Shield', es: 'Escudo urbano' },
  tagline: {
    en: 'Tap the sky to stop the rockets before they reach your six cities.',
    es: 'Toca el cielo para detener los cohetes antes de que lleguen a tus seis ciudades.',
  },
  description: {
    en: 'A city-defence arcade game with an original name and look: rockets fall in waves on six cities and three launchers. Tap a point in the sky (or move the crosshair and fire) to send an interceptor there; its blast destroys every rocket inside, and destroyed rockets burst too. Rockets split in mid-air from wave 3. Bonus points for rounds and cities left, a city rebuilt every 10 000 points, and a wave multiplier up to ×6. Watch an AI defender that leads its shots.',
    es: 'Un arcade de defensa de ciudades con nombre y aspecto originales: caen oleadas de cohetes sobre seis ciudades y tres lanzadores. Toca un punto del cielo (o mueve la mira y dispara) para enviar allí un interceptor; su explosión destruye los cohetes que atrapa, y los destruidos estallan también. Desde la oleada 3 los cohetes se dividen en el aire. Puntos extra por la munición y las ciudades que queden, una ciudad reconstruida cada 10 000 puntos y un multiplicador por oleada de hasta ×6. Mira a un defensor de la IA que se adelanta a los cohetes.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['touch', 'mouse', 'keyboard'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'defence', 'aiming'],
  achievements: [
    {
      id: 'wave',
      title: { en: 'First Wave', es: 'Primera oleada' },
      description: { en: 'Survive a wave.', es: 'Sobrevive a una oleada.' },
    },
    {
      id: 'intact',
      title: { en: 'Not a Scratch', es: 'Ni un rasguño' },
      description: {
        en: 'End a wave with all six cities standing.',
        es: 'Termina una oleada con las seis ciudades en pie.',
      },
    },
    {
      id: 'ten',
      title: { en: 'Long Night', es: 'Noche larga' },
      description: { en: 'Reach wave 10.', es: 'Llega a la oleada 10.' },
    },
    {
      id: 'score',
      title: { en: 'Guardian', es: 'Guardián' },
      description: { en: 'Score 25 000 points.', es: 'Consigue 25 000 puntos.' },
    },
  ],
};
