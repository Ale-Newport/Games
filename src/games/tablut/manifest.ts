import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tablut',
  number: 56,
  title: { en: 'Tablut', es: 'Tablut' },
  tagline: {
    en: 'The Lapland tafl: sixteen raiders, eight guards, and a king racing for the edge.',
    es: 'El tafl lapón: dieciséis asaltantes, ocho guardias y un rey que corre hacia el borde.',
  },
  description: {
    en: 'On a 9×9 board the king wins by reaching any edge square, while the attackers can capture him with only two pieces once he leaves the throne’s side. Every piece moves like a rook and captures by sandwiching. Play either side.',
    es: 'En un tablero de 9×9 el rey gana si llega a cualquier casilla del borde, y los atacantes pueden capturarlo con solo dos piezas cuando se aleja del trono. Todas las piezas mueven como torres y capturan encerrando. Juega con cualquier bando.',
  },
  category: 'strategy',
  genre: { en: 'Traditional strategy', es: 'Estrategia tradicional' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['tablut', 'tafl', 'lapland', 'asymmetric'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Northern Lights', es: 'Aurora boreal' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Reindeer Herder', es: 'Pastor de renos' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of Tablut', es: 'Maestro de Tablut' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'king-escapes',
      title: { en: 'To the Edge', es: 'Hasta el borde' },
      description: {
        en: 'Win against the computer as the defenders.',
        es: 'Gana a la CPU con los defensores.',
      },
    },
    {
      id: 'king-taken',
      title: { en: 'Caught', es: 'Atrapado' },
      description: {
        en: 'Win against the computer as the attackers.',
        es: 'Gana a la CPU con los atacantes.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
