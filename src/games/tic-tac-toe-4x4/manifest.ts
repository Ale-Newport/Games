import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tic-tac-toe-4x4',
  number: 2,
  title: { en: 'Tic-Tac-Toe 4×4', es: 'Tres en raya 4×4' },
  tagline: {
    en: 'Four in a row on a bigger board. Set up the double threat.',
    es: 'Cuatro en línea en un tablero mayor. Prepara la amenaza doble.',
  },
  description: {
    en: 'The 4×4 four-in-a-row variant against three computer levels — the top one an exact solver that never loses — or a friend.',
    es: 'La variante de 4×4 con cuatro en línea contra tres niveles de CPU —el más alto, un solucionador exacto que nunca pierde— o contra un amigo.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['4x4', 'four in a row', 'cuatro en línea', 'noughts and crosses', 'gato', 'tic tac toe'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Four Up', es: 'Cuatro arriba' },
      description: { en: 'Win a round against the computer.', es: 'Gana una ronda contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Deep Thinker', es: 'Pensador profundo' },
      description: { en: 'Beat the Medium computer.', es: 'Vence a la CPU en nivel Medio.' },
    },
    {
      id: 'perfect-draw',
      title: { en: 'Unbreakable', es: 'Irrompible' },
      description: {
        en: 'Hold the Perfect solver to a draw.',
        es: 'Empata contra el solucionador Perfecto.',
      },
    },
    {
      id: 'double-threat',
      title: { en: 'Double Trouble', es: 'Doble problema' },
      description: {
        en: 'Win after creating two threats at once.',
        es: 'Gana tras crear dos amenazas a la vez.',
      },
    },
    {
      id: 'diagonal-win',
      title: { en: 'Long Diagonal', es: 'Diagonal larga' },
      description: {
        en: 'Win with one of the two long diagonals.',
        es: 'Gana con una de las dos diagonales largas.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Bigger Rivalry', es: 'Rivalidad mayor' },
      description: { en: 'Finish a two-player round.', es: 'Termina una ronda a dos jugadores.' },
    },
  ],
};
