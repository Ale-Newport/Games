import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'misere-tic-tac-toe',
  number: 4,
  title: { en: 'Misère Tic-Tac-Toe', es: 'Tres en raya inverso' },
  tagline: {
    en: 'Three in a row loses. Force your opponent to finish the line.',
    es: 'Tres en línea pierde. Obliga a tu rival a completar la línea.',
  },
  description: {
    en: 'Tic-Tac-Toe turned inside out: completing a line loses. Against an exact solver, a computer that misplays, or a friend.',
    es: 'El tres en raya del revés: completar una línea pierde. Contra un solucionador exacto, una CPU que comete errores o un amigo.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 2,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['misere', 'misère', 'reverse tic tac toe', 'avoid three', 'inverso', 'gato'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Reverse Psychology', es: 'Psicología inversa' },
      description: { en: 'Win a round against the computer.', es: 'Gana una ronda contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Trap Setter', es: 'Tendedor de trampas' },
      description: { en: 'Beat the Medium computer.', es: 'Vence a la CPU en nivel Medio.' },
    },
    {
      id: 'perfect-draw',
      title: { en: 'Untouchable', es: 'Intocable' },
      description: {
        en: 'Hold the Perfect solver to a draw.',
        es: 'Empata contra el solucionador Perfecto.',
      },
    },
    {
      id: 'squeeze',
      title: { en: 'The Squeeze', es: 'Sin salida' },
      description: {
        en: 'Win when every cell left would complete your opponent’s line.',
        es: 'Gana cuando cada casilla libre completaría una línea de tu rival.',
      },
    },
    {
      id: 'win-as-o',
      title: { en: 'Second Mover', es: 'Segundo en mover' },
      description: {
        en: 'Beat the computer while playing O.',
        es: 'Vence a la CPU jugando con O.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Backwards Rivals', es: 'Rivales al revés' },
      description: { en: 'Finish a two-player round.', es: 'Termina una ronda a dos jugadores.' },
    },
  ],
};
