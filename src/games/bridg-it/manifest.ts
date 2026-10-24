import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'bridg-it',
  number: 70,
  title: { en: 'Gale', es: 'Gale' },
  tagline: {
    en: 'Build bridges between your dots to span the board — and cut off your rival’s crossing.',
    es: 'Tiende puentes entre tus puntos para cruzar el tablero y corta el paso al rival.',
  },
  description: {
    en: 'Two interleaved grids of dots, one per player. Each turn, join two neighboring dots of your color with a bridge; bridges never cross, so every bridge you build is also a wall for your opponent. Orange links top to bottom, Teal left to right.',
    es: 'Dos rejillas de puntos entrelazadas, una por jugador. En cada turno une dos puntos vecinos de tu color con un puente; los puentes nunca se cruzan, así que cada puente también es un muro para el rival. Naranja une arriba con abajo y Turquesa izquierda con derecha.',
  },
  category: 'strategy',
  genre: { en: 'Connection', es: 'Conexión' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['gale', 'bridges', 'connection', 'shannon switching game'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Span', es: 'Tramo' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Engineer', es: 'Ingeniería' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Low Resistance', es: 'Baja resistencia' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'second-wins',
      title: { en: 'Against the Odds', es: 'Contra pronóstico' },
      description: {
        en: 'Win a round the computer opened (the opener can always win in theory).',
        es: 'Gana una ronda que abrió la CPU (en teoría quien abre siempre puede ganar).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
