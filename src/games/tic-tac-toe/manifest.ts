import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tic-tac-toe',
  number: 1,
  title: { en: 'Tic-Tac-Toe', es: 'Tres en raya' },
  tagline: {
    en: 'Three in a row. Can you hold a perfect opponent to a draw?',
    es: 'Tres en línea. ¿Puedes empatar contra un rival perfecto?',
  },
  description: {
    en: 'The classic 3×3 game against three computer levels — including one that never loses — or a friend on the same device.',
    es: 'El clásico de 3×3 contra tres niveles de CPU —incluido uno que nunca pierde— o contra un amigo en el mismo dispositivo.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 2,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['noughts and crosses', 'ceros y cruces', 'gato', 'x o', 'tic tac toe'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Victory', es: 'Primera victoria' },
      description: { en: 'Win a round against the computer.', es: 'Gana una ronda contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Outplayed', es: 'Superado' },
      description: { en: 'Beat the Medium computer.', es: 'Vence a la CPU en nivel Medio.' },
    },
    {
      id: 'perfect-draw',
      title: { en: 'Immovable', es: 'Inamovible' },
      description: {
        en: 'Hold the Perfect computer to a draw.',
        es: 'Empata contra la CPU Perfecta.',
      },
    },
    {
      id: 'fork-master',
      title: { en: 'Fork Master', es: 'Maestro de la horquilla' },
      description: {
        en: 'Win by creating two threats at once.',
        es: 'Gana creando dos amenazas a la vez.',
      },
    },
    {
      id: 'three-move-win',
      title: { en: 'Lightning', es: 'Relámpago' },
      description: {
        en: 'Win with only three marks on the board.',
        es: 'Gana con solo tres marcas en el tablero.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Friendly Rivals', es: 'Rivales amistosos' },
      description: { en: 'Finish a two-player round.', es: 'Termina una ronda a dos jugadores.' },
    },
  ],
};
