import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'cartpole',
  number: 198,
  title: { en: 'Balancing Cart', es: 'Carro equilibrista' },
  tagline: {
    en: 'Keep the pole upright by pushing the cart. Then the wind picks up.',
    es: 'Mantén el palo de pie empujando el carro. Luego se levanta el viento.',
  },
  description: {
    en: 'The classic cart-and-pole balancing problem, played by hand: a pole stands on a hinge on a cart that runs along a short rail, and you push the cart left or right to keep the pole up. Let it lean past 24° or run off the rail and it is over. After 20 calm seconds, gusts start knocking the pole, harder as time passes. Choose a long or a short pole. Arrows, the pad, or touch either half of the screen; watch the AI controller, the same kind used to teach machine learning.',
    es: 'El clásico problema de equilibrar un palo sobre un carro, jugado a mano: un palo está de pie sobre una bisagra en un carro que corre por un raíl corto, y tú empujas el carro a izquierda o derecha para que no se caiga. Si se inclina más de 24° o el carro se sale del raíl, se acabó. Tras 20 segundos de calma, las ráfagas empiezan a empujar el palo, cada vez más fuerte. Elige un palo largo o corto. Flechas, el panel o toca una de las dos mitades de la pantalla; mira al controlador de la IA, del tipo que se usa para enseñar aprendizaje automático.',
  },
  category: 'arcade',
  genre: { en: 'Balance', es: 'Equilibrio' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 2,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Tenths of a second', es: 'Décimas de segundo' } },
  tags: ['arcade', 'real-time', 'physics', 'balance'],
  achievements: [
    {
      id: 'ten',
      title: { en: 'Steady', es: 'Firme' },
      description: { en: 'Balance for 10 seconds.', es: 'Mantén el equilibrio 10 segundos.' },
    },
    {
      id: 'weather',
      title: { en: 'Weather the Gusts', es: 'Contra el viento' },
      description: {
        en: 'Keep balancing 10 seconds into the gusts.',
        es: 'Aguanta 10 segundos con ráfagas.',
      },
    },
    {
      id: 'minute',
      title: { en: 'A Full Minute', es: 'Un minuto entero' },
      description: { en: 'Balance for 60 seconds.', es: 'Mantén el equilibrio 60 segundos.' },
    },
    {
      id: 'short',
      title: { en: 'Quick Hands', es: 'Manos rápidas' },
      description: {
        en: 'Balance the short pole for 60 seconds.',
        es: 'Mantén el palo corto 60 segundos.',
      },
    },
  ],
};
