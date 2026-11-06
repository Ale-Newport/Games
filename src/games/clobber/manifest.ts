import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'clobber',
  number: 52,
  title: { en: 'Clobber', es: 'Clobber' },
  tagline: {
    en: 'A full board of stones — clobber your way to the last move.',
    es: 'Un tablero lleno de piedras: elimina hasta hacer el último movimiento.',
  },
  description: {
    en: 'The 6×6 board starts full of white and black stones in a checkerboard. Move one of your stones onto a neighboring enemy stone to clobber it. Whoever cannot move loses. Monte Carlo opponents at three levels.',
    es: 'El tablero de 6×6 empieza lleno de piedras blancas y negras en damero. Mueve una piedra tuya sobre una rival vecina para eliminarla. Pierde quien no puede mover. Rivales Monte Carlo en tres niveles.',
  },
  category: 'strategy',
  genre: { en: 'Combinatorial game', es: 'Juego combinatorio' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['clobber', 'combinatorial', 'stones', 'capture'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Clobbered', es: 'Eliminado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Last Stone Standing', es: 'Última piedra en pie' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Endgame Accountant', es: 'Contable del final' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'quick-clobber',
      title: { en: 'Quick Clobber', es: 'Barrida rápida' },
      description: {
        en: 'Win against the computer in 14 moves or fewer in all.',
        es: 'Gana a la CPU en 14 jugadas o menos en total.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
