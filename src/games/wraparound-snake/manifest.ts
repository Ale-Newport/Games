import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'wraparound-snake',
  number: 173,
  title: { en: 'Wraparound Snake', es: 'Serpiente sin bordes' },
  tagline: {
    en: 'The edges wrap around — but the board fills with blocks as you grow.',
    es: 'Los bordes dan la vuelta, pero el tablero se llena de bloques al crecer.',
  },
  description: {
    en: 'Snake on a borderless 20 × 20 board: leave one side and reappear on the other. Every fifth apple drops a block on the board, and a golden fruit sometimes appears for six seconds — worth more the sooner you reach it.',
    es: 'La serpiente en un tablero de 20 × 20 sin bordes: sal por un lado y reaparece por el otro. Cada quinta manzana deja un bloque en el tablero, y a veces aparece una fruta dorada durante seis segundos que vale más cuanto antes llegues.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'snake', 'grid'],
  achievements: [
    {
      id: 'first',
      title: { en: 'First Bite', es: 'Primer bocado' },
      description: { en: 'Eat an apple.', es: 'Cómete una manzana.' },
    },
    {
      id: 'golden',
      title: { en: 'Golden', es: 'Dorada' },
      description: { en: 'Eat a golden fruit.', es: 'Cómete una fruta dorada.' },
    },
    {
      id: 'fifty',
      title: { en: 'Long Snake', es: 'Serpiente larga' },
      description: { en: 'Reach length 50.', es: 'Llega a longitud 50.' },
    },
    {
      id: 'score',
      title: { en: 'Snake Charmer', es: 'Encantador' },
      description: { en: 'Score 2000 points.', es: 'Consigue 2000 puntos.' },
    },
  ],
};
