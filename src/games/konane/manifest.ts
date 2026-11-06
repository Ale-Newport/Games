import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'konane',
  number: 53,
  title: { en: 'Konane', es: 'Konane' },
  tagline: {
    en: 'A Hawaiian jumping game: leap over stones until your rival is stuck.',
    es: 'Un juego hawaiano de saltos: salta piedras hasta dejar al rival bloqueado.',
  },
  description: {
    en: 'A 6×6 board full of black and white stones. After two stones are removed to open it, players jump over enemy stones in straight lines, capturing them — several in a row if the line allows. Whoever cannot jump loses.',
    es: 'Un tablero de 6×6 lleno de piedras negras y blancas. Tras retirar dos piedras para abrirlo, los jugadores saltan sobre piedras rivales en línea recta y las capturan, varias seguidas si la línea lo permite. Pierde quien no puede saltar.',
  },
  category: 'strategy',
  genre: { en: 'Traditional strategy', es: 'Estrategia tradicional' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['konane', 'hawaiian', 'jumping', 'traditional'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Leap', es: 'Primer salto' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Island Hopper', es: 'Saltando islas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of the Board', es: 'Maestro del tablero' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'double-jump',
      title: { en: 'Double Jump', es: 'Doble salto' },
      description: {
        en: 'Win a game in which you made a double jump.',
        es: 'Gana una partida en la que hiciste un doble salto.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
