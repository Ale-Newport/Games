import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'chinese-checkers',
  number: 66,
  title: { en: 'Chinese Checkers', es: 'Damas chinas' },
  tagline: {
    en: 'Hop ten marbles across a six-pointed star into the point opposite.',
    es: 'Haz saltar diez canicas a través de una estrella de seis puntas hasta la punta opuesta.',
  },
  description: {
    en: 'Move one marble a hole in any of six directions, or hop it over neighboring marbles — any color — as far as the chain of jumps takes you. Nothing is captured. The first player to fill the opposite point of the star wins.',
    es: 'Mueve una canica a un agujero vecino en cualquiera de las seis direcciones o hazla saltar sobre canicas vecinas, de cualquier color, tan lejos como llegue la cadena de saltos. No se captura nada. Gana quien primero llena la punta opuesta de la estrella.',
  },
  category: 'strategy',
  genre: { en: 'Race', es: 'Carrera' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['chinese checkers', 'star', 'jumping', 'race'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Across the Star', es: 'Al otro lado de la estrella' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Marble Runner', es: 'Corredor de canicas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Star Master', es: 'Maestro de la estrella' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'long-hop',
      title: { en: 'Hop, Skip and Jump', es: 'Salto tras salto' },
      description: {
        en: 'Win after making a chain of four jumps or more.',
        es: 'Gana tras hacer una cadena de cuatro saltos o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
