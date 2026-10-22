import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'breakthrough',
  number: 38,
  title: { en: 'Breakthrough', es: 'Breakthrough' },
  tagline: {
    en: 'Two rows of pawns, one goal: break through to the far side.',
    es: 'Dos filas de peones y una meta: llegar al otro lado.',
  },
  description: {
    en: 'Sixteen pawns each on an 8×8 board. Pawns step straight or diagonally forward and capture diagonally; the first pawn to reach the far row wins. Three computer levels.',
    es: 'Dieciséis peones por bando en un tablero de 8×8. Los peones avanzan recto o en diagonal y capturan en diagonal; el primero que llega a la última fila gana. Tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['breakthrough', 'pawns', 'race', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Breaching the Line', es: 'Rompiendo la línea' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Vanguard', es: 'Vanguardia' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Unstoppable', es: 'Imparable' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'untouched',
      title: { en: 'Untouched', es: 'Intacto' },
      description: {
        en: 'Win without losing a single pawn.',
        es: 'Gana sin perder ni un peón.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
