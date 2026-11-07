import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'platformer',
  number: 181,
  title: { en: 'Sunny Trail', es: 'Sendero soleado' },
  tagline: {
    en: 'Run, jump and stomp your way through three sunny levels to the flag.',
    es: 'Corre, salta y aplasta escarabajos por tres niveles soleados hasta la bandera.',
  },
  description: {
    en: 'A side-scrolling platformer with an original hero and three levels: run with momentum, jump higher by holding the button, stomp beetles (but not the spiky ones), head-butt prize boxes for coins and a berry shield, and cross pits and ledges to the flag before the timer runs out. A checkpoint halfway through each level. Arrow keys and Space, or the touch pad; watch a planning AI clear the trail.',
    es: 'Un juego de plataformas de desplazamiento lateral con un héroe original y tres niveles: corre con inercia, salta más alto manteniendo el botón, aplasta escarabajos (pero no los de pinchos), golpea cajas sorpresa para conseguir monedas y un escudo de baya, y cruza fosos y repisas hasta la bandera antes de que se acabe el tiempo. Hay un punto de control a mitad de cada nivel. Flechas y Espacio, o el panel táctil; mira cómo una IA que planifica recorre el sendero.',
  },
  category: 'arcade',
  genre: { en: 'Platformer', es: 'Plataformas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'platformer', 'side-scrolling'],
  achievements: [
    {
      id: 'stomp',
      title: { en: 'Squash!', es: '¡Chof!' },
      description: { en: 'Stomp a beetle.', es: 'Aplasta un escarabajo.' },
    },
    {
      id: 'berry',
      title: { en: 'Berry Shield', es: 'Escudo de baya' },
      description: { en: 'Pick up a berry.', es: 'Coge una baya.' },
    },
    {
      id: 'level',
      title: { en: 'First Flag', es: 'Primera bandera' },
      description: { en: 'Finish the first level.', es: 'Termina el primer nivel.' },
    },
    {
      id: 'win',
      title: { en: 'Trail Blazer', es: 'Pionero del sendero' },
      description: { en: 'Finish all three levels.', es: 'Termina los tres niveles.' },
    },
  ],
};
