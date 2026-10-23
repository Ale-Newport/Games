import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'alquerque',
  number: 59,
  title: { en: 'Alquerque', es: 'Alquerque' },
  tagline: {
    en: 'A thousand-year-old jumping game: forced captures, long chains, no retreat.',
    es: 'Un juego de saltos milenario: capturas obligatorias, cadenas largas y sin retroceso.',
  },
  description: {
    en: 'Twelve pieces each on a 5×5 board of lines. Step forward or sideways, jump enemy pieces to capture them — captures are compulsory and chains must continue. Capture everything or leave your opponent without a move.',
    es: 'Doce piezas por bando en un tablero de líneas de 5×5. Avanza o muévete de lado, salta piezas rivales para capturarlas: capturar es obligatorio y las cadenas deben continuar. Captúralo todo o deja al rival sin jugadas.',
  },
  category: 'strategy',
  genre: { en: 'Traditional strategy', es: 'Estrategia tradicional' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['alquerque', 'draughts', 'capture', 'traditional'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Old Masters', es: 'Viejos maestros' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Forced Hand', es: 'Mano forzada' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Alcázar', es: 'Alcázar' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'dominant',
      title: { en: 'Clean Sweep', es: 'Barrida limpia' },
      description: {
        en: 'Win against the computer with 8 or more of your pieces left.',
        es: 'Gana a la CPU conservando 8 piezas o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
