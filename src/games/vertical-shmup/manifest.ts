import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'vertical-shmup',
  number: 193,
  title: { en: 'Nebula Strike', es: 'Asalto nebular' },
  tagline: {
    en: 'Fly up through the nebula, blasting waves of fighters and the boss at the end.',
    es: 'Atraviesa la nebulosa acabando con oleadas de cazas y con el jefe del final.',
  },
  description: {
    en: 'A vertical scrolling shooter with an original name and look: your fighter fires on its own as you weave through darters, swoopers, heavy tanks and power-dropping carriers, and after a minute a boss with alternating bullet patterns arrives. Grab power-ups for a wider spread, save bombs for tight spots — only the small core of your ship can be hit. Drag on the screen to fly (the ship stays above your finger), or use the arrows and X for a bomb; watch an AI ace dodge the fire.',
    es: 'Un matamarcianos de desplazamiento vertical con nombre y aspecto originales: tu caza dispara solo mientras esquivas dardos, planeadores, tanques pesados y transportes que sueltan mejoras, y al cabo de un minuto llega un jefe con patrones de disparo alternos. Coge mejoras para ampliar el abanico y guarda las bombas para los apuros: solo el pequeño núcleo de la nave puede ser alcanzado. Arrastra el dedo por la pantalla para volar (la nave va un poco por encima del dedo), o usa las flechas y X para la bomba; mira a un as de la IA esquivar el fuego.',
  },
  category: 'arcade',
  genre: { en: 'Shooter', es: 'Disparos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['touch', 'keyboard', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'shooter', 'vertical'],
  achievements: [
    {
      id: 'pickup',
      title: { en: 'Powered Up', es: 'Con más potencia' },
      description: { en: 'Pick up a power-up.', es: 'Coge una mejora.' },
    },
    {
      id: 'boss',
      title: { en: 'Boss Breaker', es: 'Rompejefes' },
      description: { en: 'Bring down a boss.', es: 'Derriba a un jefe.' },
    },
    {
      id: 'stage3',
      title: { en: 'Deep Nebula', es: 'Nebulosa profunda' },
      description: { en: 'Reach stage 3.', es: 'Llega a la fase 3.' },
    },
    {
      id: 'score',
      title: { en: 'Star Ace', es: 'As estelar' },
      description: { en: 'Score 100 000 points.', es: 'Consigue 100 000 puntos.' },
    },
  ],
};
