import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'halma',
  number: 65,
  title: { en: 'Halma', es: 'Halma' },
  tagline: {
    en: 'Race nineteen pieces across a 16 × 16 board with chains of leaps.',
    es: 'Lleva diecinueve piezas a través de un tablero de 16 × 16 con cadenas de saltos.',
  },
  description: {
    en: 'Each turn, step one piece to a neighboring square in any of eight directions, or jump it over pieces — yours or your opponent’s — as many times in a row as you can. Nothing is captured. The first to fill the opposite corner camp wins.',
    es: 'En cada turno, mueve una pieza a una casilla vecina en cualquiera de las ocho direcciones o hazla saltar sobre piezas, tuyas o del rival, tantas veces seguidas como puedas. No se captura nada. Gana quien primero llena el campamento de la esquina opuesta.',
  },
  category: 'strategy',
  genre: { en: 'Race', es: 'Carrera' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['halma', 'jumping', 'race', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Home and Dry', es: 'A salvo en casa' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Leapfrog', es: 'Pídola' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Grand Traverse', es: 'Gran travesía' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'sprint',
      title: { en: 'Sprint', es: 'Esprint' },
      description: {
        en: 'Win against the computer in 160 moves or fewer (both sides).',
        es: 'Gana a la CPU en 160 jugadas o menos (de ambos bandos).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
