import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'fanorona',
  number: 54,
  title: { en: 'Fanorona', es: 'Fanorona' },
  tagline: {
    en: 'The Malagasy game of approach and withdrawal: capture whole lines at once.',
    es: 'El juego malgache de aproximación y retirada: captura filas enteras de una vez.',
  },
  description: {
    en: 'Forty-four pieces fill a 5×9 board of lines. Move toward an enemy line or away from it to capture the whole line, then keep capturing with the same piece. Captures are compulsory; take every enemy piece to win.',
    es: 'Cuarenta y cuatro piezas llenan un tablero de líneas de 5×9. Muévete hacia una fila rival o aléjate de ella para capturarla entera y sigue capturando con la misma pieza. Capturar es obligatorio; gana quien se lleva todas las piezas rivales.',
  },
  category: 'strategy',
  genre: { en: 'Traditional strategy', es: 'Estrategia tradicional' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['fanorona', 'madagascar', 'capture', 'traditional'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Line Breaker', es: 'Rompefilas' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Approach and Withdraw', es: 'Avance y retirada' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of Fanorona', es: 'Maestro de Fanorona' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'dominant',
      title: { en: 'Dominant', es: 'Dominante' },
      description: {
        en: 'Win against the computer with 10 or more of your pieces left.',
        es: 'Gana a la CPU conservando 10 piezas o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
