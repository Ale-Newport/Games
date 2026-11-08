import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'river-raid',
  number: 194,
  title: { en: 'Canyon Run', es: 'Carrera del cañón' },
  tagline: {
    en: 'Fly up a winding river, blast the bridges and keep an eye on the fuel.',
    es: 'Remonta un río sinuoso, derriba los puentes y vigila el combustible.',
  },
  description: {
    en: 'A river-raid style scrolling shooter with an original name and look: your jet flies up a river generated from the run’s seed, between banks and islands, shooting boats, helicopters and crossing jets. Fuel burns as you go (faster at speed) — fly over a depot to refill, or shoot it for points. Each stretch ends at a bridge you must shoot down; the last bridge passed is where your next jet starts. Arrows and Space, or steer with a finger and use the buttons; watch an AI pilot.',
    es: 'Un shooter de río con desplazamiento vertical, nombre y aspecto originales: tu avión remonta un río generado a partir de la semilla de la partida, entre orillas e islas, disparando a barcos, helicópteros y cazas que lo cruzan. El combustible se gasta al avanzar (más deprisa a toda velocidad): pasa sobre un depósito para llenarlo, o dispárale para sumar puntos. Cada tramo termina en un puente que hay que derribar; el último puente superado es donde empieza tu siguiente avión. Flechas y Espacio, o guía con el dedo y usa los botones; mira a un piloto de la IA.',
  },
  category: 'arcade',
  genre: { en: 'Shooter', es: 'Disparos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'shooter', 'fuel'],
  achievements: [
    {
      id: 'bridge',
      title: { en: 'Bridge Breaker', es: 'Rompepuentes' },
      description: { en: 'Shoot down a bridge.', es: 'Derriba un puente.' },
    },
    {
      id: 'refuel',
      title: { en: 'Topped Up', es: 'Depósito lleno' },
      description: { en: 'Refuel over a depot.', es: 'Repón combustible sobre un depósito.' },
    },
    {
      id: 'five',
      title: { en: 'Upriver', es: 'Río arriba' },
      description: { en: 'Shoot down five bridges.', es: 'Derriba cinco puentes.' },
    },
    {
      id: 'score',
      title: { en: 'Canyon Ace', es: 'As del cañón' },
      description: { en: 'Score 10 000 points.', es: 'Consigue 10 000 puntos.' },
    },
  ],
};
