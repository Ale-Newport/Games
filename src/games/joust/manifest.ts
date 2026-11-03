import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'joust',
  number: 191,
  title: { en: 'Sky Lances', es: 'Lanzas del cielo' },
  tagline: {
    en: 'Flap your drake above the rival riders — the higher lance wins.',
    es: 'Eleva a tu dragón por encima de los jinetes rivales: gana la lanza más alta.',
  },
  description: {
    en: 'An aerial jousting game with an original name and look: keep your winged drake aloft by flapping, drift with momentum round a screen that wraps at the sides, and meet the rival riders from above to unhorse them. Each leaves an egg — grab it before it hatches into a fiercer rider. Lava waits below. Waves bring more and keener riders. Arrows and Space, the touch pad, or tap beside your rider to flap that way; watch an AI lancer.',
    es: 'Un juego de justas aéreas con nombre y aspecto originales: mantén en el aire a tu dragón alado a golpe de aleteo, desplázate con inercia por una pantalla que da la vuelta por los lados y enfréntate a los jinetes rivales desde arriba para derribarlos. Cada uno deja un huevo: cógelo antes de que salga un jinete más fiero. Abajo espera la lava. Las oleadas traen más jinetes y más agresivos. Flechas y Espacio, el panel táctil o toca junto a tu jinete para aletear hacia ese lado; mira a un justador de la IA.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'flying', 'joust'],
  achievements: [
    {
      id: 'joust',
      title: { en: 'From Above', es: 'Desde arriba' },
      description: { en: 'Unhorse a rival rider.', es: 'Derriba a un jinete rival.' },
    },
    {
      id: 'egg',
      title: { en: 'Egg Snatcher', es: 'Ladrón de huevos' },
      description: { en: 'Pick up an egg.', es: 'Coge un huevo.' },
    },
    {
      id: 'wave',
      title: { en: 'Clear Skies', es: 'Cielo despejado' },
      description: { en: 'Clear a wave.', es: 'Despeja una oleada.' },
    },
    {
      id: 'score',
      title: { en: 'Champion of the Skies', es: 'Campeón del cielo' },
      description: { en: 'Score 30 000 points.', es: 'Consigue 30 000 puntos.' },
    },
  ],
};
