import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'yote',
  number: 60,
  title: { en: 'Yoté', es: 'Yoté' },
  tagline: {
    en: 'A fast West African game of drops and jumps where every capture costs double.',
    es: 'Un rápido juego de África occidental de colocar y saltar donde cada captura cuesta doble.',
  },
  description: {
    en: 'Twelve pieces each start in hand. Drop them anywhere on the 5×6 board, step them, or jump enemy pieces to capture — and every capture lets you remove one more enemy piece of your choice. Take them all to win.',
    es: 'Doce piezas por bando empiezan en la mano. Colócalas en cualquier casilla del tablero de 5×6, muévelas o salta piezas rivales para capturarlas; cada captura te deja retirar otra pieza rival a tu elección. Tómalas todas para ganar.',
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
  tags: ['yoté', 'west africa', 'capture', 'traditional'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Sharp Eye', es: 'Ojo avizor' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Double Strike', es: 'Golpe doble' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of the Sands', es: 'Maestro de la arena' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'dominant',
      title: { en: 'Untouchable', es: 'Intocable' },
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
