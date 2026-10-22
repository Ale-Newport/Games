import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'isolation',
  number: 39,
  title: { en: 'Isolation', es: 'Isolation' },
  tagline: {
    en: 'Move, remove a tile, and trap your opponent.',
    es: 'Mueve, retira una casilla y encierra a tu rival.',
  },
  description: {
    en: 'Each turn, step your pawn to a neighboring tile, then knock any free tile off the 7×7 board. The first player who cannot move loses. Three computer levels.',
    es: 'En cada turno mueve tu peón a una casilla vecina y luego retira cualquier casilla libre del tablero de 7×7. Pierde el primero que no puede moverse. Tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['isolation', 'blocking', 'tiles', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Cornered', es: 'Acorralado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'No Way Out', es: 'Sin salida' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Island Builder', es: 'Constructor de islas' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'quick-trap',
      title: { en: 'Quick Trap', es: 'Trampa rápida' },
      description: {
        en: 'Win with more than 24 tiles still on the board.',
        es: 'Gana con más de 24 casillas aún en el tablero.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
