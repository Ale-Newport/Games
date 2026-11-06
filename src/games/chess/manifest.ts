import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'chess',
  number: 15,
  title: { en: 'Chess', es: 'Ajedrez' },
  tagline: {
    en: 'Castle, promote and checkmate — on the clock if you dare.',
    es: 'Enroca, corona y da mate, con reloj si te atreves.',
  },
  description: {
    en: 'Standard chess with every rule (castling, en passant, promotion, repetition, fifty moves, dead positions), optional clocks, resignation, move list and four computer levels.',
    es: 'Ajedrez estándar con todas las reglas (enroque, al paso, coronación, repetición, cincuenta jugadas, posiciones muertas), relojes opcionales, rendición, lista de jugadas y cuatro niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['chess', 'ajedrez', 'checkmate', 'blitz', 'fide'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Victory', es: 'Primera victoria' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Club Player', es: 'Jugador de club' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Tournament Player', es: 'Jugador de torneo' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Master Class', es: 'Clase magistral' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'swift-mate',
      title: { en: 'Swift Mate', es: 'Mate veloz' },
      description: {
        en: 'Checkmate the computer in at most 20 of your moves.',
        es: 'Da mate a la CPU en 20 jugadas tuyas o menos.',
      },
    },
    {
      id: 'promoted',
      title: { en: 'Promotion', es: 'Ascenso' },
      description: {
        en: 'Promote a pawn against the computer.',
        es: 'Corona un peón contra la CPU.',
      },
    },
    {
      id: 'on-the-clock',
      title: { en: 'Beat the Clock', es: 'Contra el reloj' },
      description: {
        en: 'Win a timed game against the computer over the board (not on time).',
        es: 'Gana una partida con reloj contra la CPU en el tablero (no por tiempo).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Café Game', es: 'Partida de café' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
