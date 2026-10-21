import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'stacking-gobblers',
  number: 35,
  title: { en: 'Nesting Tic-Tac-Toe', es: 'Tres en raya anidado' },
  tagline: {
    en: 'Bigger cups cover smaller ones — and any cup can move.',
    es: 'Los vasos grandes tapan a los pequeños, y cualquiera se puede mover.',
  },
  description: {
    en: 'Tic-tac-toe with six nesting cups each in three sizes: place a cup on an empty cell or over a smaller one, or move one of yours — but lifting a cup may uncover a line for your opponent. Three computer levels.',
    es: 'Tres en raya con seis vasos anidables de tres tamaños por jugador: coloca un vaso en una casilla vacía o sobre otro menor, o mueve uno tuyo, pero levantar un vaso puede destapar una línea rival. Tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['nesting', 'tic-tac-toe', 'stacking', 'kids', 'tres en raya'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Swallowed!', es: '¡Tapado!' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Stack Master', es: 'Maestro de pilas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Biggest Cup', es: 'El vaso mayor' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'mover',
      title: { en: 'On the Move', es: 'En movimiento' },
      description: {
        en: 'Beat the computer in a game where you moved a cup on the board.',
        es: 'Vence a la CPU en una partida en la que moviste un vaso del tablero.',
      },
    },
    {
      id: 'no-big-cups',
      title: { en: 'Small but Mighty', es: 'Pequeño pero matón' },
      description: {
        en: 'Beat the computer without using a large cup.',
        es: 'Vence a la CPU sin usar un vaso grande.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Kitchen Duel', es: 'Duelo en la cocina' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
